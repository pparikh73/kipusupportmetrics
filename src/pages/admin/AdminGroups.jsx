import { useState, useEffect } from 'react'
import { getAllGroups, upsertGroup, getAgentCountsByGroup } from '../../lib/api'
import AdminTable from '../../components/AdminTable'
import Modal from '../../components/Modal'

const EMPTY = { group_key: '', group_name: '', active: true, display_order: 0, notes: '' }

export default function AdminGroups() {
  const [rows, setRows] = useState([])
  const [agentCounts, setAgentCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([getAllGroups(), getAgentCountsByGroup()])
      .then(([g, counts]) => { setRows(g); setAgentCounts(counts) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try {
      await upsertGroup(editing)
      setEditing(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'group_name', label: 'Group Name' },
    { key: 'group_key', label: 'Key' },
    { key: 'assigned_agents', label: 'Assigned Agents', render: (r) => agentCounts[r.id] ?? 0 },
    { key: 'display_order', label: 'Order' },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Groups</h1>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <div style={{ marginBottom: 12 }}>
        <button className="btn btn-primary" onClick={() => setEditing({ ...EMPTY })}>+ Add Group</button>
      </div>
      {loading ? <div className="loading">Loading...</div> : (
        <AdminTable columns={columns} rows={rows} onEdit={setEditing} />
      )}
      {editing && (
        <Modal
          title={editing.id ? 'Edit Group' : 'Add Group'}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </>
          }
        >
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Group Name</label>
            <input className="form-input" value={editing.group_name} onChange={(e) => setEditing({ ...editing, group_name: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Key</label>
            <input className="form-input" value={editing.group_key} onChange={(e) => setEditing({ ...editing, group_key: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Display Order</label>
            <input className="form-input" type="number" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" rows={2} value={editing.notes ?? ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
            Active
          </label>
        </Modal>
      )}
    </div>
  )
}
