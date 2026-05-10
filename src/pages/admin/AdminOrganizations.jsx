import { useState, useEffect } from 'react'
import { getAllOrganizations, upsertOrganization } from '../../lib/api'
import AdminTable from '../../components/AdminTable'
import Modal from '../../components/Modal'

const EMPTY = { organization_key: '', organization_name: '', active: true, display_order: 0 }

export default function AdminOrganizations() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    getAllOrganizations()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try {
      await upsertOrganization(editing)
      setEditing(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'organization_name', label: 'Organization Name' },
    { key: 'organization_key', label: 'Key' },
    { key: 'display_order', label: 'Order' },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Organizations</h1>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <div style={{ marginBottom: 12 }}>
        <button className="btn btn-primary" onClick={() => setEditing({ ...EMPTY })}>+ Add Organization</button>
      </div>
      {loading ? <div className="loading">Loading...</div> : (
        <AdminTable columns={columns} rows={rows} onEdit={setEditing} />
      )}
      {editing && (
        <Modal
          title={editing.id ? 'Edit Organization' : 'Add Organization'}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </>
          }
        >
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Organization Name</label>
            <input className="form-input" value={editing.organization_name} onChange={(e) => setEditing({ ...editing, organization_name: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Key</label>
            <input className="form-input" value={editing.organization_key} onChange={(e) => setEditing({ ...editing, organization_key: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Display Order</label>
            <input className="form-input" type="number" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} />
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
