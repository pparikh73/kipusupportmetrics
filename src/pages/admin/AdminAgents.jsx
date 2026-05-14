import { useState, useEffect } from 'react'
import { getAllAgents, upsertAgent } from '../../lib/api'
import Modal from '../../components/Modal'

export default function AdminAgents() {
  const [allRows, setAllRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving]   = useState(false)

  const [search, setSearch]           = useState('')
  const [activeFilter, setActiveFilter] = useState('active')

  const load = () => {
    setLoading(true)
    getAllAgents()
      .then(setAllRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...editing }
      if (payload.hire_date === '') payload.hire_date = null
      if (payload.go_live_date === '') payload.go_live_date = null
      await upsertAgent(payload)
      setEditing(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const displayRows = allRows.filter((r) => {
    if (activeFilter === 'active' && !r.active) return false
    if (activeFilter === 'inactive' && r.active) return false
    if (search && !r.agent_name?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const activeCount   = allRows.filter((r) => r.active).length
  const inactiveCount = allRows.length - activeCount

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Agents</h1>
        <p className="page-subtitle">
          {allRows.length} total · {activeCount} active · {inactiveCount} inactive
        </p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="filter-bar" style={{ marginBottom: 12 }}>
        <div className="filter-group">
          <label className="filter-label">Search</label>
          <input
            className="filter-select"
            style={{ minWidth: 200 }}
            placeholder="Agent name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">Status</label>
          <select className="filter-select" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={() => setEditing({
            agent_name: '', role: '', hire_date: '', go_live_date: '', notes: '', active: true,
          })}>+ Add Agent</button>
        </div>
      </div>

      {loading ? <div className="loading">Loading...</div> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent Name</th>
                <th>Role</th>
                <th>Hire Date</th>
                <th>Go-Live Date</th>
                <th>Active</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.agent_name}</td>
                  <td style={{ fontSize: 12, color: '#6b7a8d' }}>{r.role ?? '—'}</td>
                  <td style={{ fontSize: 12 }}>{r.hire_date ?? '—'}</td>
                  <td style={{ fontSize: 12 }}>{r.go_live_date ?? '—'}</td>
                  <td><span style={{ color: r.active ? '#1a6e3a' : '#842029', fontWeight: 600, fontSize: 12 }}>{r.active ? 'Yes' : 'No'}</span></td>
                  <td style={{ fontSize: 12, color: '#6b7a8d', maxWidth: 200 }}>{r.notes ?? '—'}</td>
                  <td><button className="btn btn-sm btn-secondary" onClick={() => setEditing({ ...r })}>Edit</button></td>
                </tr>
              ))}
              {displayRows.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#6b7a8d' }}>No agents match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal
          title={editing.id ? `Edit Agent: ${editing.agent_name}` : 'Add Agent'}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </>
          }
        >
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Agent Name</label>
            <input
              className="form-input"
              value={editing.agent_name ?? ''}
              onChange={(e) => setEditing({ ...editing, agent_name: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Role</label>
            <input
              className="form-input"
              value={editing.role ?? ''}
              onChange={(e) => setEditing({ ...editing, role: e.target.value })}
              placeholder="e.g. Support Agent, Team Lead"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Hire Date</label>
              <input
                className="form-input"
                type="date"
                value={editing.hire_date ?? ''}
                onChange={(e) => setEditing({ ...editing, hire_date: e.target.value || null })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Go-Live Date</label>
              <input
                className="form-input"
                type="date"
                value={editing.go_live_date ?? ''}
                onChange={(e) => setEditing({ ...editing, go_live_date: e.target.value || null })}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={editing.notes ?? ''}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
            Active
          </label>
        </Modal>
      )}
    </div>
  )
}
