import { useState, useEffect, useMemo } from 'react'
import {
  getAllGroupGoals, upsertGroupGoal, deleteGroupGoal, endGroupGoal,
  getAllTeams, getAllMetricDefinitions,
} from '../../lib/api'
import Modal from '../../components/Modal'
import DateInput from '../../components/DateInput'
import { formatDateUS } from '../../lib/format'
import { shiftDay, runsOn, overlaps } from '../../lib/goalPlan'

// APT-145: the Goals page is one grid — metrics down the side, teams across the
// top — showing the goal each team is running today. Clicking a value opens the
// same Add/Edit Goal form the page has always used.

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function goalText(value, unitType) {
  if (value === null || value === undefined) return '—'
  const n = Number(value)
  return unitType === 'percent' ? `${n}%` : String(n)
}

export default function AdminGoals() {
  const [goals, setGoals]     = useState([])
  const [teams, setTeams]     = useState([])
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [picking, setPicking] = useState(null)   // which of several clashing goals to open
  const [notice, setNotice]   = useState('')

  const today = useMemo(() => todayISO(), [])

  const load = () => {
    setLoading(true)
    Promise.all([getAllGroupGoals(), getAllTeams(), getAllMetricDefinitions()])
      .then(([g, t, m]) => { setGoals(g); setTeams(t); setMetrics(m) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // A message left behind by the Teams page after copying goals to a new team
  useEffect(() => {
    try {
      const msg = localStorage.getItem('ktp_goals_notice')
      if (msg) { setNotice(msg); localStorage.removeItem('ktp_goals_notice') }
    } catch { /* storage unavailable — no notice, nothing else affected */ }
  }, [])

  const activeMetrics = useMemo(() => metrics.filter((m) => m.active), [metrics])

  // Teams with has_goals turned off are hidden. The column is optional: until a
  // Supabase admin adds it, every active team is shown.
  const teamCols = useMemo(
    () => teams.filter((t) => t.active && t.has_goals !== false),
    [teams],
  )

  // goals running today, keyed metric:team — more than one means a clash
  const grid = useMemo(() => {
    const map = {}
    goals.filter((g) => runsOn(g, today)).forEach((g) => {
      const key = `${g.metric_id}:${g.group_id}`
      if (!map[key]) map[key] = []
      map[key].push(g)
    })
    return map
  }, [goals, today])

  const clashCount = useMemo(
    () => Object.values(grid).filter((list) => list.length > 1).length,
    [grid],
  )

  const openGoal = (goal) => setEditing({ ...goal, metrics_groups: undefined, metrics_definitions: undefined })

  const openCell = (metric, team) => {
    const list = grid[`${metric.id}:${team.id}`] ?? []
    if (list.length > 1) { setPicking({ metric, team, list }); return }
    if (list.length === 1) { openGoal(list[0]); return }
    // No goal yet — same form, with this team and metric already chosen
    setEditing({
      group_id: team.id,
      metric_id: metric.id,
      goal_value: '',
      tolerance_value: '',
      effective_start_month: '',
      effective_end_month: '',
      active: true,
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...editing }
      payload.group_id = Number(payload.group_id)
      payload.metric_id = Number(payload.metric_id)
      payload.goal_value = payload.goal_value !== '' ? Number(payload.goal_value) : null
      payload.tolerance_value = payload.tolerance_value !== '' ? Number(payload.tolerance_value) : null
      if (!payload.effective_start_month) payload.effective_start_month = null
      if (!payload.effective_end_month) payload.effective_end_month = null

      // Saving a goal that covers the same dates as one already running is what
      // leaves a team with two goals for one metric and reports unable to
      // choose between them. Offer to close the old one rather than let it
      // happen quietly — but it stays the user's call.
      if (payload.active) {
        const clashing = goals.filter((g) =>
          g.id !== payload.id &&
          g.active &&
          Number(g.group_id) === payload.group_id &&
          Number(g.metric_id) === payload.metric_id &&
          overlaps(g, payload),
        )
        const closeable = payload.effective_start_month
          ? clashing.filter((g) => (g.effective_start_month ?? '') < payload.effective_start_month)
          : []

        if (closeable.length && closeable.length === clashing.length) {
          const teamName = teams.find((t) => t.id === payload.group_id)?.group_name ?? 'This team'
          const metricName = metrics.find((m) => m.id === payload.metric_id)?.metric_name ?? 'this metric'
          const endDate = shiftDay(payload.effective_start_month, -1)
          const ok = window.confirm(
            `${teamName} already has a goal running for ${metricName}.\n\n` +
            `End it on ${formatDateUS(endDate)} so this new goal takes over?\n\n` +
            `OK — the old goal ends the day before this one starts. Past reports are not changed.\n` +
            `Cancel — both goals are kept, and reports will not know which to use.`,
          )
          if (ok) for (const g of closeable) await endGroupGoal(g.id, endDate)
        } else if (clashing.length) {
          window.alert(
            `Heads up: this team will have ${clashing.length + 1} goals running for this metric at the same time, ` +
            `and reports cannot tell which to use.\n\nThe Goals page will flag it with a ⚠ so you can sort it out.`,
          )
        }
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

  const deleteGoal = async (id) => {
    if (!window.confirm('Permanently delete this goal? This cannot be undone.')) return
    try {
      await deleteGroupGoal(id)
      setEditing(null)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">Goals</h1>
          <p className="page-subtitle">Goals active today. Click any value to edit it, or a dash to add one.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({
          group_id: '', metric_id: '', goal_value: '', tolerance_value: '',
          effective_start_month: '', effective_end_month: '', active: true,
        })}>+ Add Goal</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {notice && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#eef4ff', border: '1px solid #c7d9f7', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>
          <span style={{ flex: 1 }}>{notice}</span>
          <button className="btn btn-sm btn-secondary" onClick={() => setNotice('')}>Dismiss</button>
        </div>
      )}

      {clashCount > 0 && (
        <div style={{ background: '#fff4e5', border: '1px solid #f3cf9a', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>
          <strong>{clashCount} goal{clashCount === 1 ? '' : 's'} need attention.</strong>{' '}
          A team has more than one goal running for the same metric, so reports cannot tell which to use.
          Click the ⚠ cells below to sort them out.
        </div>
      )}

      {loading ? <div className="loading">Loading...</div> : (
        teamCols.length === 0 || activeMetrics.length === 0 ? (
          <div className="empty-state">
            <h3>Nothing to show yet</h3>
            <p>Goals appear once there is at least one active team and one active metric.</p>
          </div>
        ) : (
          <div className="table-wrap" style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, background: '#f7f8fa', zIndex: 2, minWidth: 210 }}>Metric</th>
                  {teamCols.map((t) => (
                    <th key={t.id} style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{t.group_name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeMetrics.map((m) => (
                  <tr key={m.id}>
                    <td style={{ position: 'sticky', left: 0, background: '#fff', zIndex: 1, fontWeight: 500 }}>
                      {m.metric_name}
                    </td>
                    {teamCols.map((t) => {
                      const list = grid[`${m.id}:${t.id}`] ?? []
                      const g = list[0]
                      const clash = list.length > 1
                      return (
                        <td key={t.id} style={{ textAlign: 'center', padding: 0 }}>
                          <button
                            onClick={() => openCell(m, t)}
                            title={
                              clash ? `${list.length} goals are running for this metric — click to sort out`
                                : g ? `Goal ${goalText(g.goal_value, m.unit_type)}${g.tolerance_value ? ` ±${g.tolerance_value}` : ''}, running since ${formatDateUS(g.effective_start_month)}`
                                : `No goal — click to add one for ${t.group_name}`
                            }
                            style={{
                              width: '100%', padding: '9px 6px', border: 'none', background: 'transparent',
                              cursor: 'pointer', font: 'inherit',
                              fontWeight: g ? 500 : 400,
                              color: clash ? '#9a6400' : g ? '#1a1a2e' : '#c3c9d2',
                            }}
                          >
                            {clash && <span style={{ marginRight: 4 }}>⚠</span>}
                            {g ? goalText(g.goal_value, m.unit_type) : '—'}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Which of several clashing goals to open */}
      {picking && (
        <Modal
          title={`${picking.metric.metric_name} — ${picking.team.group_name}`}
          onClose={() => setPicking(null)}
          footer={<button className="btn btn-secondary" onClick={() => setPicking(null)}>Cancel</button>}
        >
          <div style={{ background: '#fff4e5', border: '1px solid #f3cf9a', borderRadius: 6, padding: '10px 12px', fontSize: 12.5, marginBottom: 14 }}>
            <strong>This team has {picking.list.length} goals running for this metric at the same time.</strong>
            <div style={{ marginTop: 4 }}>
              Reports use the first one. Open the ones that should not be running and either set an
              <strong> End Date</strong> or untick <strong>Active</strong>.
            </div>
          </div>
          {picking.list.map((g, i) => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f0f2f5' }}>
              <span style={{ fontWeight: 600, minWidth: 60 }}>{goalText(g.goal_value, picking.metric.unit_type)}</span>
              <span style={{ flex: 1, fontSize: 12, color: '#6b7a8d' }}>
                from {formatDateUS(g.effective_start_month)}
                {g.effective_end_month ? ` to ${formatDateUS(g.effective_end_month)}` : ''}
                {i === 0 && <strong style={{ color: '#9a6400' }}> · used by reports</strong>}
              </span>
              <button className="btn btn-sm btn-secondary" onClick={() => { setPicking(null); openGoal(g) }}>Edit</button>
            </div>
          ))}
        </Modal>
      )}

      {editing && (
        <Modal
          title={editing.id ? 'Edit Goal' : 'Add Goal'}
          onClose={() => setEditing(null)}
          footer={
            <>
              {editing.id && (
                <button className="btn btn-danger" onClick={() => deleteGoal(editing.id)} style={{ marginRight: 'auto' }}>
                  Delete Goal
                </button>
              )}
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
              <label className="form-label">Start Date <span style={{ fontWeight: 400, color: '#9ca3af' }}>(MM/DD/YYYY)</span></label>
              <DateInput
                value={editing.effective_start_month}
                onChange={(v) => setEditing({ ...editing, effective_start_month: v })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>(MM/DD/YYYY — leave blank if still active)</span></label>
              <DateInput
                value={editing.effective_end_month}
                onChange={(v) => setEditing({ ...editing, effective_end_month: v })}
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
