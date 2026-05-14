import { useState, useEffect } from 'react'
import { getAllTeams, upsertTeam } from '../../lib/api'
import Modal from '../../components/Modal'

export default function AdminTeams() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving]   = useState(false)

  const load = () => {
    setLoading(true)
    getAllTeams()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try {
      await upsertTeam(editing)
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
        <h1 className="page-title">Teams</h1>
        <p className="page-subtitle">Manage support teams (metrics_groups)</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div style={{ marginBottom: 12 }}>
        <button className="btn btn-primary" onClick={() => setEditing({
          group_key: '', group_name: '', active: true, display_order: 0,
        })}>+ Add Team</button>
      </div>

      {loading ? <div className="loading">Loading...</div> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Key</th>
                <th>Display Order</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.group_name}</td>
                  <td style={{ fontSize: 12, color: '#6b7a8d', fontFamily: 'monospace' }}>{r.group_key}</td>
                  <td>{r.display_order}</td>
                  <td><span style={{ color: r.active ? '#1a6e3a' : '#842029', fontWeight: 600, fontSize: 12 }}>{r.active ? 'Yes' : 'No'}</span></td>
                  <td><button className="btn btn-sm btn-secondary" onClick={() => setEditing({ ...r })}>Edit</button></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#6b7a8d' }}>No teams found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal
          title={editing.id ? `Edit Team: ${editing.group_name}` : 'Add Team'}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </>
          }
        >
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Team Name</label>
            <input className="form-input" value={editing.group_name ?? ''} onChange={(e) => setEditing({ ...editing, group_name: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Key</label>
            <input className="form-input" value={editing.group_key ?? ''} onChange={(e) => setEditing({ ...editing, group_key: e.target.value })} placeholder="snake_case_key" />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Display Order</label>
            <input className="form-input" type="number" value={editing.display_order ?? 0} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} />
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
