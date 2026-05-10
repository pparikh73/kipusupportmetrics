import { useState, useEffect, useCallback } from 'react'
import {
  getOrganizations, getGroups, getAgents,
  getAgentMetricDetail, getAgentScorecard,
  getAgentMonthNote, upsertAgentMonthNote,
} from '../lib/api'
import {
  formatValue, formatTarget, formatTolerance,
  statusLabel, statusClass, ratingClass, currentMonth, recentMonths,
} from '../lib/format'

function MetricRow({ row }) {
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

export default function AgentPerformance() {
  const months = recentMonths(18)
  const [orgs, setOrgs] = useState([])
  const [groups, setGroups] = useState([])
  const [agents, setAgents] = useState([])

  const [orgId, setOrgId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [agentId, setAgentId] = useState('')
  const [month, setMonth] = useState(currentMonth())

  const [scorecard, setScorecard] = useState(null)
  const [detail, setDetail] = useState([])
  const [note, setNote] = useState('')
  const [savedNote, setSavedNote] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteMsg, setNoteMsg] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load orgs
  useEffect(() => {
    getOrganizations().then(setOrgs).catch((e) => setError(e.message))
  }, [])

  // Load groups when org changes
  useEffect(() => {
    setGroupId('')
    setAgentId('')
    getGroups(orgId || undefined).then(setGroups).catch((e) => setError(e.message))
  }, [orgId])

  // Load agents when group or org changes
  useEffect(() => {
    setAgentId('')
    getAgents(orgId || undefined, groupId || undefined)
      .then(setAgents)
      .catch((e) => setError(e.message))
  }, [orgId, groupId])

  // Load performance data
  const loadData = useCallback(async () => {
    if (!agentId || !month) return
    setLoading(true)
    setError('')
    try {
      const [sc, det, noteRow] = await Promise.all([
        getAgentScorecard({ agentId: Number(agentId), month }),
        getAgentMetricDetail({ agentId: Number(agentId), month }),
        getAgentMonthNote({ agentId: Number(agentId), noteMonth: month }),
      ])
      setScorecard(sc[0] ?? null)
      setDetail(det)
      const t = noteRow?.note_text ?? ''
      setNote(t)
      setSavedNote(t)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [agentId, month])

  useEffect(() => { loadData() }, [loadData])

  const saveNote = async () => {
    if (!agentId || !month) return
    setNoteSaving(true)
    setNoteMsg('')
    try {
      await upsertAgentMonthNote({ agentId: Number(agentId), noteMonth: month, noteText: note, createdBy: 'admin' })
      setSavedNote(note)
      setNoteMsg('Saved.')
      setTimeout(() => setNoteMsg(''), 3000)
    } catch (e) {
      setNoteMsg('Error: ' + e.message)
    } finally {
      setNoteSaving(false)
    }
  }

  const coreMetrics = detail.filter((r) => r.counts_toward_rating && !r.visibility_only)
  const visibilityMetrics = detail.filter((r) => r.visibility_only)
  const strengths = coreMetrics.filter((r) => r.on_track === true)
  const improvements = coreMetrics.filter((r) => r.on_track === false)

  const isIncomplete = scorecard?.rating_label?.toLowerCase().includes('incomplete')

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Agent Performance</h1>
        <p className="page-subtitle">Monthly scorecard by agent</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

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
          <label className="filter-label">Month</label>
          <select className="filter-select" value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
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

          {/* Core Rating Metrics */}
          {coreMetrics.length > 0 && (
            <>
              <div className="section-title">Core Rating Metrics</div>
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
                    {coreMetrics.map((r) => <MetricRow key={r.metric_key} row={r} />)}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Visibility Metrics */}
          {visibilityMetrics.length > 0 && (
            <>
              <div className="section-title">Additional Visibility Metrics</div>
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
                    {visibilityMetrics.map((r) => <MetricRow key={r.metric_key} row={r} />)}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {detail.length === 0 && (
            <div className="empty-state">
              <h3>No metric data for this period</h3>
              <p>Metrics will appear once data has been loaded for this agent and month.</p>
            </div>
          )}

          {/* Strengths & Improvements */}
          {(strengths.length > 0 || improvements.length > 0) && (
            <div className="cards-row">
              {strengths.length > 0 && (
                <div className="card" style={{ flex: 1 }}>
                  <div className="card-title" style={{ color: '#1a6e3a' }}>Strengths</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                    {strengths.map((r) => <li key={r.metric_key}>{r.metric_name}</li>)}
                  </ul>
                </div>
              )}
              {improvements.length > 0 && (
                <div className="card" style={{ flex: 1 }}>
                  <div className="card-title" style={{ color: '#842029' }}>Areas for Improvement</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                    {improvements.map((r) => <li key={r.metric_key}>{r.metric_name}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Supervisor Note */}
          <div className="card">
            <div className="card-title">Supervisor Note</div>
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
              {noteMsg && <span style={{ fontSize: 12, color: noteMsg.startsWith('Error') ? '#842029' : '#1a6e3a' }}>{noteMsg}</span>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
