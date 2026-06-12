import { useState, useEffect, useMemo } from 'react'
import { getAllGroupGoals, upsertGroupGoal, getAllTeams, getAllMetricDefinitions } from '../../lib/api'
import Modal from '../../components/Modal'

function loadPref(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? v : fallback } catch { return fallback }
}
function savePref(key, val) { try { localStorage.setItem(key, String(val)) } catch {} }

export default function AdminGoals() {
  const [goals, setGoals]     = useState([])
  const [teams, setTeams]     = useState([])
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving]   = useState(false)

  const [teamFilter, setTeamFilter] = useState(() => loadPref('ktp_goals_team', ''))
  const [showHistory, setShowHistory] = useState(() => loadPref('ktp_goals_history', 'false') === 'true')
  const [rangeFrom, setRangeFrom] = useState(() => loadPref('ktp_goals_from', ''))
  const [rangeTo, setRangeTo]     = useState(() => loadPref('ktp_goals_to', ''))

  useEffect(() => savePref('ktp_goals_team', teamFilter), [teamFilter])
  useEffect(() => savePref('ktp_goals_history', showHistory), [showHistory])
  useEffect(() => savePref('ktp_goals_from', rangeFrom), [rangeFrom])
  useEffect(() => savePref('ktp_goals_to', rangeTo), [rangeTo])

  // First day of the current month — used to identify expired goals
  const thisMonthStr = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  }, [])

  const load = () => {
    setLoading(true)
    Promise.all([getAllGroupGoals(), getAllTeams(), getAllMetricDefinitions()])
      .then(([g, t, m]) => { setGoals(g); setTeams(t); setMetrics(m) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...editing }
      payload.group_id = Number(payload.group_id)
      payload.metric_id = Number(payload.metric_id)
      payload.goal_value = payload.goal_value !== '' ? Number(payload.goal_value) : null
      payload.tolerance_value = payload.tolerance_value !== '' ? Number(payload.tolerance_value) : null
      if (!payload.effective_start_month) {
        payload.effective_start_month = null
      } else if (payload.effective_start_month.length === 7) {
        payload.effective_start_month = payload.effective_start_month + '-01'
      }
      if (!payload.effective_end_month) {
        payload.effective_end_month = null
      } else if (payload.effective_end_month.length === 7) {
        payload.effective_end_month = payload.effective_end_month + '-01'
      }
      await upsertGroupGoal(payload)
      setEditing(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const activeMetrics = metrics.filter((m) => m.active)

  const displayGoals = goals
    .filter((g) => !teamFilter || String(g.group_id) === teamFilter)
    .filter((g) => {
      const start = g.effective_start_month  // YYYY-MM-01 or null
      const end   = g.effective_end_month    // YYYY-MM-01 or null

      if (rangeFrom || rangeTo) {
        const from = rangeFrom ? rangeFrom + '-01' : null
        const to   = rangeTo   ? rangeTo   + '-01' : null
        // Exclude if goal ended before the range starts
        if (from && end && end < from) return false
        // Exclude if goal started after the range ends
        if (to && start && start > to) return false
      }

      // Without "show expired": hide goals that have already ended
      if (!showHistory && end && end < thisMonthStr) return false

      return true
    })

  // Group goals by team, then sort within each team:
  // primary = metric name (groups duplicates together), secondary = no-end-date first, tertiary = newest start first
  const goalsByTeam = useMemo(() => {
    const map = {}
    displayGoals.forEach((g) => {
      const teamName = g.metrics_groups?.group_name ?? `Team ${g.group_id}`
      if (!map[teamName]) map[teamName] = []
      map[teamName].push(g)
    })
    Object.values(map).forEach((list) => {
      list.sort((a, b) => {
        const nameA = a.metrics_definitions?.metric_name ?? ''
        const nameB = b.metrics_definitions?.metric_name ?? ''
        if (nameA !== nameB) return nameA.localeCompare(nameB)
        // Same metric: no end date (still active) first
        if (!a.effective_end_month && b.effective_end_month) return -1
        if (a.effective_end_month && !b.effective_end_month) return 1
        // Both have (or don't have) end dates: newest start month first
        return (b.effective_start_month ?? '').localeCompare(a.effective_start_month ?? '')
      })
    })
    return map
  }, [displayGoals])

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Goals</h1>
        <p className="page-subtitle">Set metric goals and tolerances per team</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="filter-bar" style={{ marginBottom: 12 }}>
        <div className="filter-group">
          <label className="filter-label">Team</label>
          <select className="filter-select" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
            <option value="">All Teams</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.group_name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">From Month</label>
          <input
            className="filter-select"
            type="month"
            style={{ minWidth: 150 }}
            value={rangeFrom}
            onChange={(e) => setRangeFrom(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">To Month</label>
          <input
            className="filter-select"
            type="month"
            style={{ minWidth: 150 }}
            value={rangeTo}
            onChange={(e) => setRangeTo(e.target.value)}
          />
        </div>
        <div className="filter-group" style={{ justifyContent: 'flex-end' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: '#6b7a8d', paddingTop: 18 }}>
            <input type="checkbox" checked={showHistory} onChange={(e) => setShowHistory(e.target.checked)} />
            Show expired
          </label>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={() => setEditing({
            group_id: teamFilter || '',
            metric_id: '',
            goal_value: '',
            tolerance_value: '',
            effective_start_month: '',
            effective_end_month: '',
            active: true,
          })}>+ Add Goal</button>
        </div>
      </div>

      {loading ? <div className="loading">Loading...</div> : (
        Object.keys(goalsByTeam).length === 0 ? (
          <div className="empty-state">
            <h3>No goals found</h3>
            <p>Add a goal to configure metric targets for a team.</p>
          </div>
        ) : (
          Object.entries(goalsByTeam).map(([teamName, teamGoals]) => (
            <div key={teamName}>
              <div className="section-title">{teamName}</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Unit</th>
                      <th>Goal Value</th>
                      <th>Tolerance</th>
                      <th>Start Month</th>
                      <th>End Month</th>
                      <th>Active</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamGoals.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 500 }}>{r.metrics_definitions?.metric_name ?? r.metric_id}</td>
                        <td style={{ fontSize: 12, color: '#6b7a8d' }}>{r.metrics_definitions?.unit_type ?? '—'}</td>
                        <td>{r.goal_value ?? '—'}</td>
                        <td>{r.tolerance_value != null ? `±${r.tolerance_value}` : '—'}</td>
                        <td style={{ fontSize: 12 }}>{r.effective_start_month ?? '—'}</td>
                        <td style={{ fontSize: 12 }}>{r.effective_end_month ?? '—'}</td>
                        <td><span style={{ color: r.active ? '#1a6e3a' : '#842029', fontWeight: 600, fontSize: 12 }}>{r.active ? 'Yes' : 'No'}</span></td>
                        <td><button className="btn btn-sm btn-secondary" onClick={() => setEditing({ ...r, metrics_groups: undefined, metrics_definitions: undefined })}>Edit</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )
      )}

      {editing && (
        <Modal
          title={editing.id ? 'Edit Goal' : 'Add Goal'}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </>
          }
        >
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Team</label>
              <select className="form-select" value={editing.group_id ?? ''} onChange={(e) => setEditing({ ...editing, group_id: e.target.value })}>
                <option value="">— Select Team —</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.group_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Metric</label>
              <select className="form-select" value={editing.metric_id ?? ''} onChange={(e) => setEditing({ ...editing, metric_id: e.target.value })}>
                <option value="">— Select Metric —</option>
                {activeMetrics.map((m) => <option key={m.id} value={m.id}>{m.metric_name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Goal Value</label>
              <input className="form-input" type="number" step="any" value={editing.goal_value ?? ''} onChange={(e) => setEditing({ ...editing, goal_value: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Tolerance (±)</label>
              <input className="form-input" type="number" step="any" value={editing.tolerance_value ?? ''} onChange={(e) => setEditing({ ...editing, tolerance_value: e.target.value })} placeholder="Optional" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Month</label>
              <input
                className="form-input"
                type="month"
                value={editing.effective_start_month ? editing.effective_start_month.slice(0, 7) : ''}
                onChange={(e) => setEditing({ ...editing, effective_start_month: e.target.value || null })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Month <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>(leave blank if still active)</span></label>
              <input
                className="form-input"
                type="month"
                value={editing.effective_end_month ? editing.effective_end_month.slice(0, 7) : ''}
                onChange={(e) => setEditing({ ...editing, effective_end_month: e.target.value || null })}
              />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
            <input type="checkbox" checked={!!editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
            Active
          </label>
        </Modal>
      )}
    </div>
  )
}
