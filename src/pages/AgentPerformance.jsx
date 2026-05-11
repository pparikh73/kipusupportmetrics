import { useState, useEffect } from 'react'
import {
  getOrganizations, getGroups, getAgents,
  getAgentMetricDetail, getAgentScorecard,
  getAgentMonthNote, upsertAgentMonthNote,
  getMetrics, getAgentYearDetail,
} from '../lib/api'
import {
  formatValue, formatTarget, formatTolerance,
  statusLabel, statusClass, ratingClass,
} from '../lib/format'

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_OPTIONS = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' },   { value: '04', label: 'April' },
  { value: '05', label: 'May' },     { value: '06', label: 'June' },
  { value: '07', label: 'July' },    { value: '08', label: 'August' },
  { value: '09', label: 'September' },{ value: '10', label: 'October' },
  { value: '11', label: 'November' },{ value: '12', label: 'December' },
]

function getYearOptions() {
  const cur = new Date().getFullYear()
  const years = []
  for (let y = cur + 1; y >= 2023; y--) years.push(String(y))
  return years
}

const QUARTERS = [
  { label: 'Q1', months: [1, 2, 3] },
  { label: 'Q2', months: [4, 5, 6] },
  { label: 'Q3', months: [7, 8, 9] },
  { label: 'Q4', months: [10, 11, 12] },
]

const HALVES = [
  { label: 'H1', months: [1, 2, 3, 4, 5, 6] },
  { label: 'H2', months: [7, 8, 9, 10, 11, 12] },
]

// ── Rollup helpers ────────────────────────────────────────────────────────────

function metricMonthNum(metricMonth) {
  // metricMonth is YYYY-MM-DD from Supabase
  return parseInt(metricMonth.slice(5, 7), 10)
}

function computePeriodActual(rows, unitType) {
  const withData = rows.filter((r) => r.actual_value != null)
  if (!withData.length) return null
  const sum = withData.reduce((s, r) => s + r.actual_value, 0)
  return unitType === 'count' ? sum : sum / withData.length
}

function deriveStatus(actual, targetValue, toleranceValue, directionGood) {
  if (actual == null) return 'no_data'
  if (targetValue == null) return 'no_target'
  const tol = toleranceValue ?? 0
  return directionGood === 'higher'
    ? actual >= targetValue - tol ? 'on_track' : 'off_track'
    : actual <= targetValue + tol ? 'on_track' : 'off_track'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MonthlyMetricRow({ row }) {
  const sc = statusClass(row.metric_status)
  return (
    <tr>
      <td>{row.metric_name}</td>
      <td>{formatValue(row.actual_value, row.unit_type)}</td>
      <td>{formatTarget(row.target_value, row.unit_type)}</td>
      <td>{formatTolerance(row.tolerance_value, row.tolerance_unit, row.unit_type)}</td>
      <td><span className={`badge ${sc}`}>{statusLabel(row.metric_status)}</span></td>
      <td style={{ fontSize: 11, color: '#6b7a8d' }}>{row.report_name ?? '—'}</td>
    </tr>
  )
}

function RollupTable({ title, periods, configuredMetrics, yearDetail }) {
  return (
    <>
      <div className="section-title">{title}</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ minWidth: 160 }}>Metric</th>
              {periods.map((p) => <th key={p.label} style={{ minWidth: 110 }}>{p.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {configuredMetrics.map((metric) => {
              const metricRows = yearDetail.filter((r) => r.metric_key === metric.metric_key)
              // Use most recent row as target/tolerance reference
              const refRow = [...metricRows].sort((a, b) => b.metric_month.localeCompare(a.metric_month))[0]
              return (
                <tr key={metric.metric_key}>
                  <td>{metric.metric_name}</td>
                  {periods.map((p) => {
                    const periodRows = metricRows.filter((r) =>
                      p.months.includes(metricMonthNum(r.metric_month))
                    )
                    const actual = computePeriodActual(periodRows, metric.unit_type)
                    const status = deriveStatus(
                      actual,
                      refRow?.target_value,
                      refRow?.tolerance_value,
                      metric.direction_good
                    )
                    return (
                      <td key={p.label}>
                        {actual == null ? (
                          <span style={{ color: '#adb5bd' }}>—</span>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 500 }}>{formatValue(actual, metric.unit_type)}</div>
                            <span className={`badge ${statusClass(status)}`} style={{ fontSize: 10 }}>
                              {statusLabel(status)}
                            </span>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ── Merge configured metrics with view data ───────────────────────────────────

function mergeMetrics(configuredList, viewRows) {
  return configuredList.map((metric) => {
    const dataRow = viewRows.find((r) => r.metric_key === metric.metric_key)
    if (dataRow) return dataRow
    return {
      metric_key: metric.metric_key,
      metric_name: metric.metric_name,
      unit_type: metric.unit_type,
      direction_good: metric.direction_good,
      counts_toward_rating: metric.counts_toward_rating,
      visibility_only: metric.visibility_only,
      actual_value: null,
      target_value: null,
      tolerance_value: null,
      tolerance_unit: null,
      on_track: null,
      metric_status: 'no_data',
      report_name: null,
    }
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AgentPerformance() {
  const now = new Date()
  const yearOptions = getYearOptions()

  const [orgs, setOrgs]       = useState([])
  const [groups, setGroups]   = useState([])
  const [agents, setAgents]   = useState([])
  const [configuredMetrics, setConfiguredMetrics] = useState([])

  const [orgId, setOrgId]     = useState('')
  const [groupId, setGroupId] = useState('')
  const [agentId, setAgentId] = useState('')
  const [year, setYear]       = useState(String(now.getFullYear()))
  const [selMonth, setSelMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'))

  const [scorecard, setScorecard]   = useState(null)
  const [monthDetail, setMonthDetail] = useState([])
  const [yearDetail, setYearDetail]   = useState([])
  const [note, setNote]             = useState('')
  const [savedNote, setSavedNote]   = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteMsg, setNoteMsg]       = useState('')

  const [loading, setLoading]         = useState(false)
  const [yearLoading, setYearLoading] = useState(false)
  const [error, setError]             = useState('')

  // Load reference data once
  useEffect(() => {
    getOrganizations().then(setOrgs).catch((e) => setError(e.message))
    getGroups().then(setGroups).catch((e) => setError(e.message))
    getMetrics()
      .then((all) => setConfiguredMetrics(all.filter((m) => m.active)))
      .catch((e) => setError(e.message))
  }, [])

  // Reload agents when org/group filter changes
  useEffect(() => {
    setAgentId('')
    getAgents(orgId || undefined, groupId || undefined)
      .then(setAgents)
      .catch((e) => setError(e.message))
  }, [orgId, groupId])

  // Load monthly data when agent / year / month changes
  useEffect(() => {
    if (!agentId) return
    const monthKey = `${year}-${selMonth}`
    setLoading(true)
    setError('')
    Promise.all([
      getAgentScorecard({ agentId: Number(agentId), month: monthKey }),
      getAgentMetricDetail({ agentId: Number(agentId), month: monthKey }),
      getAgentMonthNote({ agentId: Number(agentId), noteMonth: monthKey }),
    ])
      .then(([sc, det, noteRow]) => {
        setScorecard(sc[0] ?? null)
        setMonthDetail(det)
        const t = noteRow?.note_text ?? ''
        setNote(t)
        setSavedNote(t)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [agentId, year, selMonth])

  // Load year data when agent / year changes
  useEffect(() => {
    if (!agentId) return
    setYearLoading(true)
    getAgentYearDetail({ agentId: Number(agentId), year })
      .then(setYearDetail)
      .catch((e) => setError(e.message))
      .finally(() => setYearLoading(false))
  }, [agentId, year])

  const saveNote = async () => {
    if (!agentId) return
    setNoteSaving(true)
    setNoteMsg('')
    try {
      await upsertAgentMonthNote({
        agentId: Number(agentId),
        noteMonth: `${year}-${selMonth}`,
        noteText: note,
        createdBy: 'admin',
      })
      setSavedNote(note)
      setNoteMsg('Saved.')
      setTimeout(() => setNoteMsg(''), 3000)
    } catch (e) {
      setNoteMsg('Error: ' + e.message)
    } finally {
      setNoteSaving(false)
    }
  }

  // Derived metric lists
  const configuredCore = configuredMetrics.filter((m) => m.counts_toward_rating && !m.visibility_only)
  const configuredVisibility = configuredMetrics.filter((m) => m.visibility_only)

  const coreRows = mergeMetrics(configuredCore, monthDetail)
  const visibilityRows = mergeMetrics(configuredVisibility, monthDetail)

  const isIncomplete = scorecard?.rating_label?.toLowerCase().includes('incomplete')
  const selectedMonthLabel = MONTH_OPTIONS.find((m) => m.value === selMonth)?.label ?? selMonth

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Agent Performance</h1>
        <p className="page-subtitle">Monthly scorecard by agent</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">Organization</label>
          <select className="filter-select" value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            <option value="">All Organizations</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.organization_name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Group</label>
          <select className="filter-select" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">All Groups</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.group_name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Agent</label>
          <select className="filter-select" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
            <option value="">Select Agent</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.agent_name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Year</label>
          <select className="filter-select" style={{ minWidth: 90 }} value={year} onChange={(e) => setYear(e.target.value)}>
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Month</label>
          <select className="filter-select" value={selMonth} onChange={(e) => setSelMonth(e.target.value)}>
            {MONTH_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {!agentId && (
        <div className="empty-state">
          <h3>Select an agent to view performance</h3>
          <p>Choose an organization, group, and agent above.</p>
        </div>
      )}

      {agentId && loading && <div className="loading">Loading...</div>}

      {agentId && !loading && (
        <>
          {isIncomplete && (
            <div className="info-msg">
              Incomplete Data — one or more required metrics are missing. Attendance has not been entered yet, so the score cannot reach 9/9.
            </div>
          )}

          {/* Summary cards */}
          <div className="cards-row">
            <div className="stat-card">
              <div className="stat-label">Overall Status</div>
              <div className={`stat-value ${ratingClass(scorecard?.rating_label)}`} style={{ fontSize: 18, marginTop: 4 }}>
                {scorecard?.rating_label ?? '—'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">On Track</div>
              <div className="stat-value" style={{ color: '#1a6e3a' }}>{scorecard?.on_track_count ?? '—'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Off Track</div>
              <div className="stat-value" style={{ color: '#842029' }}>{scorecard?.off_track_count ?? '—'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">With Data</div>
              <div className="stat-value">{scorecard?.scoring_metrics_with_data ?? '—'}</div>
            </div>
          </div>

          {/* Monthly: Core Rating Metrics */}
          <div className="section-title">
            Core Rating Metrics — {selectedMonthLabel} {year}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Actual</th>
                  <th>Target</th>
                  <th>Tolerance</th>
                  <th>Status</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {coreRows.map((r) => <MonthlyMetricRow key={r.metric_key} row={r} />)}
              </tbody>
            </table>
          </div>

          {/* Monthly: Visibility Metrics */}
          {configuredVisibility.length > 0 && (
            <>
              <div className="section-title">
                Additional Visibility Metrics — {selectedMonthLabel} {year}
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Actual</th>
                      <th>Target</th>
                      <th>Tolerance</th>
                      <th>Status</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibilityRows.map((r) => <MonthlyMetricRow key={r.metric_key} row={r} />)}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Rollup tables */}
          {yearLoading ? (
            <div className="loading">Loading annual data…</div>
          ) : (
            <>
              <RollupTable
                title={`Quarterly Performance Summary — ${year}`}
                periods={QUARTERS}
                configuredMetrics={configuredCore}
                yearDetail={yearDetail}
              />
              <RollupTable
                title={`Half-Year Performance Summary — ${year}`}
                periods={HALVES}
                configuredMetrics={configuredCore}
                yearDetail={yearDetail}
              />
            </>
          )}

          {/* Supervisor Note */}
          <div className="card">
            <div className="card-title">Supervisor Note — {selectedMonthLabel} {year}</div>
            <textarea
              className="form-textarea"
              style={{ width: '100%', marginBottom: 8 }}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a supervisor note for this agent and month..."
              rows={4}
            />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={saveNote}
                disabled={noteSaving || note === savedNote}
              >
                {noteSaving ? 'Saving…' : 'Save Note'}
              </button>
              {noteMsg && (
                <span style={{ fontSize: 12, color: noteMsg.startsWith('Error') ? '#842029' : '#1a6e3a' }}>
                  {noteMsg}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
