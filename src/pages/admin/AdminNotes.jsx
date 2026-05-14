import { useState, useEffect } from 'react'
import { getAllNotes, upsertAgentMonthNote, getAllAgents } from '../../lib/api'
import Modal from '../../components/Modal'
import { recentMonths } from '../../lib/format'

export default function AdminNotes() {
  const months = recentMonths(18)
  const [rows, setRows]       = useState([])
  const [agents, setAgents]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving]   = useState(false)

  const [agentFilter, setAgentFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      getAllNotes({ agentId: agentFilter || undefined, month: monthFilter || undefined }),
      getAllAgents(),
    ])
      .then(([n, a]) => { setRows(n); setAgents(a) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [agentFilter, monthFilter])

  const save = async () => {
    setSaving(true)
    try {
      await upsertAgentMonthNote({
        agentId: Number(editing.agent_id),
        noteMonth: editing.metric_month,
        noteText: editing.note_text,
        createdBy: editing.created_by || 'admin',
      })
      setEditing(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Supervisor Notes</h1>
        <p className="page-subtitle">Monthly notes by agent</p>
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
          <label className="filter-label">Month</label>
          <select className="filter-select" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
            <option value="">All Months</option>
            {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={() => setEditing({
            agent_id: agentFilter || '',
            metric_month: monthFilter ? `${monthFilter}-01` : '',
            note_text: '',
            created_by: 'admin',
          })}>+ Add Note</button>
        </div>
      </div>

      {loading ? <div className="loading">Loading...</div> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Month</th>
                <th>Note</th>
                <th>Created By</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.metrics_agents?.agent_name ?? r.agent_id}</td>
                  <td style={{ fontSize: 12 }}>{r.metric_month?.slice(0, 7) ?? '—'}</td>
                  <td style={{ fontSize: 12, maxWidth: 400 }}>{r.note_text}</td>
                  <td style={{ fontSize: 12, color: '#6b7a8d' }}>{r.created_by ?? '—'}</td>
                  <td><button className="btn btn-sm btn-secondary" onClick={() => setEditing({ ...r, metrics_agents: undefined })}>Edit</button></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#6b7a8d' }}>No notes found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal
          title={editing.id ? 'Edit Note' : 'Add Note'}
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
              <label className="form-label">Month</label>
              <select className="form-select" value={editing.metric_month?.slice(0, 7) ?? ''} onChange={(e) => setEditing({ ...editing, metric_month: e.target.value ? `${e.target.value}-01` : '' })}>
                <option value="">— Select Month —</option>
                {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Note</label>
            <textarea
              className="form-textarea"
              rows={4}
              value={editing.note_text ?? ''}
              onChange={(e) => setEditing({ ...editing, note_text: e.target.value })}
              placeholder="Supervisor note for this agent and month…"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Created By</label>
            <input className="form-input" value={editing.created_by ?? ''} onChange={(e) => setEditing({ ...editing, created_by: e.target.value })} />
          </div>
        </Modal>
      )}
    </div>
  )
}
