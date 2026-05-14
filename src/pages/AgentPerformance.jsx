import { useState, useEffect, useMemo } from 'react'
import {
  getTeams, getAgents,
  getMetricDefinitions, getScorecard, getScorecardYear,
  getSummary, getAgentMonthNote, upsertAgentMonthNote,
} from '../lib/api'
import { formatValue, statusLabel, statusClass, ratingClass } from '../lib/format'

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_OPTIONS = [
  { value: '01', label: 'January' },  { value: '02', label: 'February' },
  { value: '03', label: 'March' },    { value: '04', label: 'April' },
  { value: '05', label: 'May' },      { value: '06', label: 'June' },
  { value: '07', label: 'July' },     { value: '08', label: 'August' },
  { value: '09', label: 'September' },{ value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
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
  return parseInt(metricMonth.slice(5, 7), 10)
}

function computePeriodActual(rows, unitType) {
  const withData = rows.filter((r) => r.actual_value != null)
  if (!withData.length) return null
  const sum = withData.reduce((s, r) => s + r.actual_value, 0)
  return unitType === 'count' ? sum : sum / withData.length
}

// Uses direction_good values: 'at_or_above' | 'at_or_below'
function deriveStatus(actual, refRow) {
  if (actual == null || !refRow) return 'no_data'
  const { goal_value, tolerance_value, direction_good } = refRow
  if (goal_value == null) return 'no_target'
  const tol = tolerance_value ?? 0
  if (direction_good === 'at_or_above') return actual >= goal_value - tol ? 'on_track' : 'off_track'
  if (direction_good === 'at_or_below') return actual <= goal_value + tol ? 'on_track' : 'off_track'
  return 'no_target'
}

// Ensure all configured metrics show even when view returns no row for that metric
function mergeMetrics(configuredList, viewRows) {
  return configuredList.map((metric) => {
    const dataRow = viewRows.find((r) => r.metric_key === metric.metric_key)
    if (dataRow) return dataRow
    return {
      metric_key: metric.metric_key,
      metric_name: metric.metric_name,
      unit_type: metric.unit_type,
      direction_good: metric.direction_good,
      counts_toward_score: metric.counts_toward_score,
      actual_value: null,
      goal_value: null,
      tolerance_value: null,
      on_track: null,
      metric_status: 'no_data',
    }
  })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricRow({ row }) {
  const sc = statusClass(row.metric_status)
  return (
    <tr>
      <td style={{ fontWeight: 500 }}>{row.metric_name}</td>
      <td>{formatValue(row.actual_value, row.unit_type)}</td>
      <td>{row.goal_value != null ? formatValue(row.goal_value, row.unit_type) : '—'}</td>
      <td>{row.tolerance_value != null ? `±${row.tolerance_value}` : '—'}</td>
      <td><span className={`badge ${sc}`}>{statusLabel(row.metric_status)}</span></td>
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
              <th style={{ minWidth: 180, fontSize: 13, fontWeight: 700 }}>Metric</th>
              {periods.map((p) => (
                <th key={p.label} style={{ minWidth: 120, fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {configuredMetrics.map((metric) => {
              const metricRows = yearDetail.filter((r) => r.metric_key === metric.metric_key)
              const refRow = [...metricRows]
                .filter((r) => r.actual_value != null)
                .sort((a, b) => b.metric_month.localeCompare(a.metric_month))[0]
              return (
                <tr key={metric.metric_key}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{metric.metric_name}</td>
                  {periods.map((p) => {
                    const periodRows = metricRows.filter((r) =>
                      p.months.includes(metricMonthNum(r.metric_month))
                    )
                    const actual = computePeriodActual(periodRows, metric.unit_type)
                    const status = deriveStatus(actual, refRow)
                    return (
                      <td key={p.label} style={{ textAlign: 'center' }}>
                        {actual == null ? (
                          <span style={{ color: '#adb5bd' }}>—</span>
                        ) : (
                          <>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{formatValue(actual, metric.unit_type)}</div>
                            <span className={`badge ${statusClass(status)}`} style={{ fontSize: 10, marginTop: 3, display: 'inline-block' }}>
                              {statusLabel(status)}
                            </span>
                          </>
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AgentPerformance() {
  const now = new Date()
  const yearOptions = getYearOptions()

  const [teams, setTeams]   = useState([])
  const [agents, setAgents] = useState([])
  const [metricDefs, setMetricDefs] = useState([])

  const [teamId, setTeamId]   = useState('')
  const [agentId, setAgentId] = useState('')
  const [year, setYear]       = useState(String(now.getFullYear()))
  const [selMonth, setSelMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'))

  const [monthDetail, setMonthDetail] = useState([])
  const [summary, setSummary]         = useState(null)
  const [yearDetail, setYearDetail]   = useState([])
  const [note, setNote]               = useState('')
  const [savedNote, setSavedNote]     = useState('')
  const [noteSaving, setNoteSaving]   = useState(false)
  const [noteMsg, setNoteMsg]         = useState('')

  const [loading, setLoading]         = useState(false)
  const [yearLoading, setYearLoading] = useState(false)
  const [error, setError]             = useState('')

  // Load reference data once
  useEffect(() => {
    getTeams().then(setTeams).catch((e) => setError(e.message))
    getMetricDefinitions().then(setMetricDefs).catch((e) => setError(e.message))
  }, [])

  // Reload agents when team filter changes
  useEffect(() => {
    setAgentId('')
    getAgents({ groupId: teamId || undefined })
      .then(setAgents)
      .catch((e) => setError(e.message))
  }, [teamId])

  // Load monthly data when agent / year / month changes
  useEffect(() => {
    if (!agentId) return
    const monthKey = `${year}-${selMonth}`
    setLoading(true)
    setError('')
    Promise.all([
      getScorecard({ agentId: Number(agentId), month: monthKey }),
      getSummary({ agentId: Number(agentId), month: monthKey }),
      getAgentMonthNote({ agentId: Number(agentId), noteMonth: monthKey }),
    ])
      .then(([sc, sumRows, noteRow]) => {
        setMonthDetail(sc)
        setSummary(sumRows[0] ?? null)
        const t = noteRow?.note_text ?? ''
        setNote(t)
        setSavedNote(t)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [agentId, year, selMonth])

  // Load year data for rollups
  useEffect(() => {
    if (!agentId) return
    setYearLoading(true)
    getScorecardYear({ agentId: Number(agentId), year })
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

  // Derived metric lists from definitions + view data
  const scoredDefs  = metricDefs.filter((m) => m.counts_toward_score)
  const otherDefs   = metricDefs.filter((m) => !m.counts_toward_score)
  const scoredRows  = mergeMetrics(scoredDefs, monthDetail)
  const otherRows   = mergeMetrics(otherDefs, monthDetail)

  const selectedMonthLabel = MONTH_OPTIONS.find((m) => m.value === selMonth)?.label ?? selMonth

  // Summary card field aliases — handle different possible view column names
  const ratingLabel = summary?.rating_label ?? summary?.score_label ?? '—'
  const onTrackCount = summary?.on_track_count ?? '—'
  const offTrackCount = summary?.off_track_count ?? '—'
  const withDataCount = summary?.scored_with_data ?? summary?.scoring_metrics_with_data ?? summary?.metrics_with_data ?? '—'

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
          <label className="filter-label">Team</label>
          <select className="filter-select" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            <option value="">All Teams</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.group_name}</option>)}
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
          <p>Optionally filter by team, then choose an agent.</p>
        </div>
      )}

      {agentId && loading && <div className="loading">Loading…</div>}

      {agentId && !loading && (
        <>
          {/* Summary cards */}
          <div className="cards-row">
            <div className="stat-card">
              <div className="stat-label">Overall Rating</div>
              <div className={`stat-value ${ratingClass(summary?.rating_label)}`} style={{ fontSize: 18, marginTop: 4 }}>
                {ratingLabel}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">On Track</div>
              <div className="stat-value" style={{ color: '#1a6e3a' }}>{onTrackCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Off Track</div>
              <div className="stat-value" style={{ color: '#842029' }}>{offTrackCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">With Data</div>
              <div className="stat-value">{withDataCount}</div>
            </div>
          </div>

          {/* Scored metrics */}
          <div className="section-title">Scored Metrics — {selectedMonthLabel} {year}</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Actual</th>
                  <th>Goal</th>
                  <th>Tolerance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {scoredRows.map((r) => <MetricRow key={r.metric_key} row={r} />)}
              </tbody>
            </table>
          </div>

          {/* Other metrics */}
          {otherDefs.length > 0 && (
            <>
              <div className="section-title">Additional Metrics — {selectedMonthLabel} {year}</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Actual</th>
                      <th>Goal</th>
                      <th>Tolerance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherRows.map((r) => <MetricRow key={r.metric_key} row={r} />)}
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
                title={`Quarterly Performance — ${year}`}
                periods={QUARTERS}
                configuredMetrics={scoredDefs}
                yearDetail={yearDetail}
              />
              <RollupTable
                title={`Half-Year Performance — ${year}`}
                periods={HALVES}
                configuredMetrics={scoredDefs}
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
              placeholder="Add a supervisor note for this agent and month…"
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
