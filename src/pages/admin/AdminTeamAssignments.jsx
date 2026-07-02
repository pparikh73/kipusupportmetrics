import { useState, useEffect } from 'react'
import { getAllTeamAssignments, upsertTeamAssignment, getAllAgents, getAllTeams } from '../../lib/api'
import Modal from '../../components/Modal'

// Older assignments were saved as YYYY-MM; pad to a full date so the picker can show them
function toDateValue(v) {
  if (!v) return ''
  return v.length === 7 ? `${v}-01` : v.slice(0, 10)
}

export default function AdminTeamAssignments() {
  const [rows, setRows]       = useState([])
  const [agents, setAgents]   = useState([])
  const [teams, setTeams]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving]   = useState(false)

  const [agentFilter, setAgentFilter] = useState('')
  const [teamFilter, setTeamFilter]   = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([getAllTeamAssignments(), getAllAgents(), getAllTeams()])
      .then(([r, a, t]) => { setRows(r); setAgents(a); setTeams(t) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...editing }
      payload.agent_id = Number(payload.agent_id)
      payload.group_id = Number(payload.group_id)
      if (payload.effective_start_month === '') payload.effective_start_month = null
      if (payload.effective_end_month === '')   payload.effective_end_month = null
      await upsertTeamAssignment(payload)
      setEditing(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const displayRows = rows.filter((r) => {
    if (agentFilter && String(r.agent_id) !== agentFilter) return false
    if (teamFilter  && String(r.group_id) !== teamFilter)  return false
    return true
  })

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Team Assignments</h1>
        <p className="page-subtitle">Assign agents to teams with effective date ranges</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="filter-bar" style={{ marginBottom: 12 }}>
        <div className="filter-group">
          <label className="filter-label">Agent</label>
          <select className="filter-select" value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}>
            <option value="">All Agents</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.agent_name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Team</label>
          <select className="filter-select" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
            <option value="">All Teams</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.group_name}</option>)}
          </select>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={() => setEditing({
            agent_id: '', group_id: '', effective_start_month: '', effective_end_month: '', active: true,
          })}>+ Add Assignment</button>
        </div>
      </div>

      {loading ? <div className="loading">Loading...</div> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Team</th>
                <th>Start Month</th>
                <th>End Month</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.metrics_agents?.agent_name ?? r.agent_id}</td>
                  <td>{r.metrics_groups?.group_name ?? r.group_id}</td>
                  <td style={{ fontSize: 12 }}>{r.effective_start_month ?? '—'}</td>
                  <td style={{ fontSize: 12 }}>{r.effective_end_month ?? '—'}</td>
                  <td><span style={{ color: r.active ? '#1a6e3a' : '#842029', fontWeight: 600, fontSize: 12 }}>{r.active ? 'Yes' : 'No'}</span></td>
                  <td><button className="btn btn-sm btn-secondary" onClick={() => setEditing({ ...r, metrics_agents: undefined, metrics_groups: undefined })}>Edit</button></td>
                </tr>
              ))}
              {displayRows.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#6b7a8d' }}>No assignments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal
          title={editing.id ? 'Edit Assignment' : 'Add Assignment'}
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
              <label className="form-label">Agent</label>
              <select className="form-select" value={editing.agent_id ?? ''} onChange={(e) => setEditing({ ...editing, agent_id: e.target.value })}>
                <option value="">— Select Agent —</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.agent_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Team</label>
              <select className="form-select" value={editing.group_id ?? ''} onChange={(e) => setEditing({ ...editing, group_id: e.target.value })}>
                <option value="">— Select Team —</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.group_name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input className="form-input" type="date" value={toDateValue(editing.effective_start_month)} onChange={(e) => setEditing({ ...editing, effective_start_month: e.target.value || null })} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date <span style={{ fontWeight: 400, color: '#6b7a8d' }}>(leave blank if current)</span></label>
              <input className="form-input" type="date" value={toDateValue(editing.effective_end_month)} onChange={(e) => setEditing({ ...editing, effective_end_month: e.target.value || null })} />
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
