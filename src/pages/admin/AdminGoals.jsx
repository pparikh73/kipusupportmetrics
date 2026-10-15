import { useState, useEffect, useMemo } from 'react'
import {
  getAllGroupGoals, upsertGroupGoal, deleteGroupGoal, endGroupGoal,
  applyGoalToTeams, getAllTeams, getAllMetricDefinitions, shiftDay,
} from '../../lib/api'
import Modal from '../../components/Modal'
import DateInput from '../../components/DateInput'
import { formatDateUS } from '../../lib/format'

// APT-145: the Goals page is one grid — metrics down the side, teams across the
// top — showing the goal each team is running today. A goal is set once and
// applied to as many teams as it fits, and changing one never rewrites history:
// the running goal is ended the day before the new one starts.

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function goalText(value, unitType) {
  if (value === null || value === undefined) return '—'
  const n = Number(value)
  return unitType === 'percent' ? `${n}%` : String(n)
}

// A goal counts for today when it is switched on, has started, and has not ended
function runsOn(goal, day) {
  if (!goal.active) return false
  if (goal.effective_start_month && goal.effective_start_month > day) return false
  if (goal.effective_end_month && goal.effective_end_month < day) return false
  return true
}

export default function AdminGoals() {
  const [goals, setGoals]     = useState([])
  const [teams, setTeams]     = useState([])
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  const [cell, setCell]     = useState(null)   // editing one team's goal
  const [adding, setAdding] = useState(null)   // the Add Goal panel
  const [notice, setNotice] = useState('')

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

  const metricRows = useMemo(() => metrics.filter((m) => m.active), [metrics])

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

  const clashes = useMemo(() => Object.entries(grid).filter(([, list]) => list.length > 1), [grid])

  const openCell = (metric, team) => {
    const list = grid[`${metric.id}:${team.id}`] ?? []
    const current = list[0] ?? null
    setCell({
      metric,
      team,
      current,
      duplicates: list.slice(1),
      mode: current ? 'correct' : 'new',
      goal_value: current?.goal_value ?? '',
      tolerance_value: current?.tolerance_value ?? '',
      start: current?.effective_start_month ?? today,
    })
  }

  // Short list, only built while a cell is open — no need to memoize
  const history = !cell ? [] : goals
    .filter((g) => Number(g.metric_id) === Number(cell.metric.id) && Number(g.group_id) === Number(cell.team.id))
    .filter((g) => !cell.current || g.id !== cell.current.id)
    .slice()
    .sort((a, b) => (b.effective_start_month ?? '').localeCompare(a.effective_start_month ?? ''))

  const saveCell = async () => {
    setSaving(true)
    try {
      if (cell.mode === 'correct' && cell.current) {
        // Fixing the goal as it stands — reports for past months move with it
        await upsertGroupGoal({
          ...cell.current,
          goal_value: cell.goal_value === '' ? null : Number(cell.goal_value),
          tolerance_value: cell.tolerance_value === '' ? null : Number(cell.tolerance_value),
        })
      } else {
        await applyGoalToTeams({
          metricId: cell.metric.id,
          goalValue: cell.goal_value,
          toleranceValue: cell.tolerance_value,
          startDate: cell.start || today,
          teamIds: [cell.team.id],
          existing: goals,
        })
      }
      setCell(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const stopCell = async () => {
    if (!window.confirm(`Stop the ${cell.metric.metric_name} goal for ${cell.team.group_name}?\n\nIt ends today. Past reports keep using it for the months it covered.`)) return
    setSaving(true)
    try {
      await endGroupGoal(cell.current.id, shiftDay(today, -1))
      setCell(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const removeCell = async () => {
    if (!window.confirm('Delete this goal completely?\n\nUnlike stopping it, this also removes it from past reports and cannot be undone.')) return
    setSaving(true)
    try {
      await deleteGroupGoal(cell.current.id)
      setCell(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Keeps the goal being viewed and ends every other one clashing with it
  const resolveClash = async () => {
    if (!window.confirm(`Keep ${goalText(cell.current.goal_value, cell.metric.unit_type)} and stop the other ${cell.duplicates.length} goal(s) for this metric?`)) return
    setSaving(true)
    try {
      for (const dup of cell.duplicates) await endGroupGoal(dup.id, shiftDay(today, -1))
      setCell(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const openAdd = (metric) => {
    setAdding({
      metric_id: metric?.id ?? '',
      goal_value: '',
      tolerance_value: '',
      start: today,
      teamIds: teamCols.map((t) => t.id),
    })
  }

  const saveAdd = async () => {
    if (!adding.metric_id || !adding.teamIds.length) return
    setSaving(true)
    try {
      await applyGoalToTeams({
        metricId: adding.metric_id,
        goalValue: adding.goal_value,
        toleranceValue: adding.tolerance_value,
        startDate: adding.start || today,
        teamIds: adding.teamIds,
        existing: goals,
      })
      setNotice(`Goal applied to ${adding.teamIds.length} team${adding.teamIds.length === 1 ? '' : 's'}.`)
      setAdding(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const addingMetric = metrics.find((m) => String(m.id) === String(adding?.metric_id))

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">Goals</h1>
          <p className="page-subtitle">Goals active today. Click any value to edit it, or a dash to add one.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openAdd(null)}>+ Add Goal</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {notice && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#eef4ff', border: '1px solid #c7d9f7', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>
          <span style={{ flex: 1 }}>{notice}</span>
          <button className="btn btn-sm btn-secondary" onClick={() => setNotice('')}>Dismiss</button>
        </div>
      )}

      {clashes.length > 0 && (
        <div style={{ background: '#fff4e5', border: '1px solid #f3cf9a', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>
          <strong>{clashes.length} goal{clashes.length === 1 ? '' : 's'} need attention.</strong>{' '}
          A team has more than one goal running for the same metric, so reports cannot tell which to use.
          Click the ⚠ cells below to pick the one to keep.
        </div>
      )}

      {loading ? <div className="loading">Loading...</div> : (
        teamCols.length === 0 || metricRows.length === 0 ? (
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
                {metricRows.map((m) => (
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
                              clash ? `${list.length} goals are running for this metric — click to fix`
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

      {/* ── One team's goal for one metric ─────────────────────────────── */}
      {cell && (
        <Modal
          title={`${cell.metric.metric_name} — ${cell.team.group_name}`}
          onClose={() => setCell(null)}
          footer={
            <>
              {cell.current && (
                <button className="btn btn-danger btn-sm" onClick={removeCell} disabled={saving} style={{ marginRight: 'auto' }}>Delete</button>
              )}
              <button className="btn btn-secondary" onClick={() => setCell(null)}>Cancel</button>
              {cell.current && (
                <button className="btn btn-secondary" onClick={stopCell} disabled={saving}>Stop this goal</button>
              )}
              <button className="btn btn-primary" onClick={saveCell} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </>
          }
        >
          {cell.duplicates.length > 0 && (
            <div style={{ background: '#fff4e5', border: '1px solid #f3cf9a', borderRadius: 6, padding: '10px 12px', fontSize: 12.5, marginBottom: 14 }}>
              <strong>This team has {cell.duplicates.length + 1} goals running for this metric.</strong>
              <div style={{ margin: '6px 0' }}>
                {[cell.current, ...cell.duplicates].map((g, i) => (
                  <div key={g.id} style={{ color: '#6b7a8d' }}>
                    {goalText(g.goal_value, cell.metric.unit_type)} from {formatDateUS(g.effective_start_month)}
                    {i === 0 && <strong style={{ color: '#9a6400' }}> ← shown on reports</strong>}
                  </div>
                ))}
              </div>
              <button className="btn btn-sm btn-secondary" onClick={resolveClash} disabled={saving}>
                Keep {goalText(cell.current.goal_value, cell.metric.unit_type)} and stop the rest
              </button>
            </div>
          )}

          {cell.current && (
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">What are you doing?</label>
              <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, cursor: 'pointer', marginBottom: 6 }}>
                <input type="radio" name="goalmode" checked={cell.mode === 'correct'} onChange={() => setCell({ ...cell, mode: 'correct' })} style={{ marginTop: 3 }} />
                <span>
                  <strong>Fixing a mistake</strong>
                  <div style={{ color: '#6b7a8d', fontSize: 12 }}>The goal was wrong all along. Past reports will use the corrected figure.</div>
                </span>
              </label>
              <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, cursor: 'pointer' }}>
                <input type="radio" name="goalmode" checked={cell.mode === 'change'} onChange={() => setCell({ ...cell, mode: 'change', start: today })} style={{ marginTop: 3 }} />
                <span>
                  <strong>Changing it from a date</strong>
                  <div style={{ color: '#6b7a8d', fontSize: 12 }}>The goal is moving. The old one ends the day before and past reports stay as they are.</div>
                </span>
              </label>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Goal {cell.metric.unit_type === 'percent' && <span style={{ fontWeight: 400, color: '#9ca3af' }}>(%)</span>}</label>
              <input className="form-input" type="number" step="any" value={cell.goal_value ?? ''} onChange={(e) => setCell({ ...cell, goal_value: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Tolerance (±) <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
              <input className="form-input" type="number" step="any" value={cell.tolerance_value ?? ''} onChange={(e) => setCell({ ...cell, tolerance_value: e.target.value })} placeholder="0" />
            </div>
            {cell.mode !== 'correct' && (
              <div className="form-group">
                <label className="form-label">Starts <span style={{ fontWeight: 400, color: '#9ca3af' }}>(MM/DD/YYYY)</span></label>
                <DateInput value={cell.start} onChange={(v) => setCell({ ...cell, start: v ?? today })} />
              </div>
            )}
          </div>

          {cell.mode !== 'correct' && (
            <p style={{ fontSize: 12, color: '#6b7a8d', marginTop: -4 }}>
              Any current goal ends the day before. Past reports aren&apos;t changed.
            </p>
          )}

          {cell.current && (
            <p style={{ fontSize: 12, color: '#6b7a8d' }}>
              Running since {formatDateUS(cell.current.effective_start_month)}
              {cell.current.effective_end_month ? ` until ${formatDateUS(cell.current.effective_end_month)}` : ''}.
            </p>
          )}

          {history.length > 0 && (
            <div style={{ marginTop: 14, borderTop: '1px solid #e2e6ea', paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>Earlier goals</div>
              {history.map((g) => (
                <div key={g.id} style={{ fontSize: 12, color: '#6b7a8d', display: 'flex', gap: 8 }}>
                  <span style={{ fontWeight: 600, minWidth: 54 }}>{goalText(g.goal_value, cell.metric.unit_type)}</span>
                  <span>
                    {formatDateUS(g.effective_start_month)} – {g.effective_end_month ? formatDateUS(g.effective_end_month) : 'open'}
                    {!g.active && ' · switched off'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* ── One goal, many teams ───────────────────────────────────────── */}
      {adding && (
        <Modal
          title="Add Goal"
          onClose={() => setAdding(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setAdding(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveAdd} disabled={saving || !adding.metric_id || !adding.teamIds.length}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Metric</label>
            <select className="form-select" value={adding.metric_id} onChange={(e) => setAdding({ ...adding, metric_id: e.target.value })}>
              <option value="">— Select metric —</option>
              {metricRows.map((m) => <option key={m.id} value={m.id}>{m.metric_name}</option>)}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Goal {addingMetric?.unit_type === 'percent' && <span style={{ fontWeight: 400, color: '#9ca3af' }}>(%)</span>}</label>
              <input className="form-input" type="number" step="any" value={adding.goal_value} onChange={(e) => setAdding({ ...adding, goal_value: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Tolerance (±)</label>
              <input className="form-input" type="number" step="any" value={adding.tolerance_value} onChange={(e) => setAdding({ ...adding, tolerance_value: e.target.value })} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Starts <span style={{ fontWeight: 400, color: '#9ca3af' }}>(MM/DD/YYYY)</span></label>
              <DateInput value={adding.start} onChange={(v) => setAdding({ ...adding, start: v ?? today })} />
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#6b7a8d', marginTop: -4, marginBottom: 14 }}>
            Any current goal ends the day before. Past reports aren&apos;t changed.
          </p>

          <div className="form-group" style={{ marginBottom: 6 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
              Teams
              <button
                className="btn btn-sm btn-secondary"
                style={{ marginLeft: 'auto', fontWeight: 400 }}
                onClick={() => setAdding({ ...adding, teamIds: adding.teamIds.length === teamCols.length ? [] : teamCols.map((t) => t.id) })}
              >
                {adding.teamIds.length === teamCols.length ? 'Uncheck all' : 'Check all'}
              </button>
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '2px 18px' }}>
            {teamCols.map((t) => {
              const live = adding.metric_id ? (grid[`${adding.metric_id}:${t.id}`] ?? [])[0] : null
              const checked = adding.teamIds.some((id) => String(id) === String(t.id))
              return (
                <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', padding: '6px 0', borderBottom: '1px solid #f0f2f5' }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setAdding({
                      ...adding,
                      teamIds: e.target.checked
                        ? [...adding.teamIds, t.id]
                        : adding.teamIds.filter((id) => String(id) !== String(t.id)),
                    })}
                  />
                  <span style={{ flex: 1 }}>{t.group_name}</span>
                  <span style={{ fontSize: 11.5, color: '#9ca3af' }}>
                    {!adding.metric_id ? '' : live ? `now ${goalText(live.goal_value, addingMetric?.unit_type)}` : 'no goal'}
                  </span>
                </label>
              )
            })}
          </div>
          <p style={{ fontSize: 12, color: '#6b7a8d', marginTop: 10, marginBottom: 0 }}>
            {adding.teamIds.length === teamCols.length
              ? 'All teams are checked. Uncheck any team this goal doesn’t apply to.'
              : `${adding.teamIds.length} of ${teamCols.length} teams selected.`}
          </p>
        </Modal>
      )}
    </div>
  )
}
