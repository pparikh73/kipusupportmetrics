import { useState, useEffect } from 'react'
import { getAllAttendanceCodes, upsertAttendanceCode } from '../../lib/api'
import Modal from '../../components/Modal'

export default function AdminAttendanceCodes() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    getAllAttendanceCodes()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try {
      await upsertAttendanceCode(editing)
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
        <h1 className="page-title">Attendance Codes</h1>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <div style={{ marginBottom: 12 }}>
        <button className="btn btn-primary" onClick={() => setEditing({
          code: '', code_name: '', category: '', counts_as_available: false,
          counts_as_scheduled: true, active: true, display_order: 0,
        })}>+ Add Code</button>
      </div>
      {loading ? <div className="loading">Loading...</div> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Category</th>
                <th>Counts as Available</th>
                <th>Counts as Scheduled</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{r.code}</td>
                  <td>{r.code_name}</td>
                  <td>{r.category ?? '—'}</td>
                  <td>{r.counts_as_available ? 'Yes' : 'No'}</td>
                  <td>{r.counts_as_scheduled ? 'Yes' : 'No'}</td>
                  <td><span style={{ color: r.active ? '#1a6e3a' : '#842029', fontWeight: 600, fontSize: 12 }}>{r.active ? 'Yes' : 'No'}</span></td>
                  <td><button className="btn btn-sm btn-secondary" onClick={() => setEditing({ ...r })}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <Modal
          title={editing.id ? 'Edit Attendance Code' : 'Add Attendance Code'}
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
              <label className="form-label">Code</label>
              <input className="form-input" value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} maxLength={10} />
            </div>
            <div className="form-group">
              <label className="form-label">Code Name</label>
              <input className="form-input" value={editing.code_name} onChange={(e) => setEditing({ ...editing, code_name: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <input className="form-input" value={editing.category ?? ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="e.g. paid, unpaid, holiday" />
            </div>
            <div className="form-group">
              <label className="form-label">Display Order</label>
              <input className="form-input" type="number" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={editing.counts_as_available} onChange={(e) => setEditing({ ...editing, counts_as_available: e.target.checked })} />
              Counts as Available
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={editing.counts_as_scheduled} onChange={(e) => setEditing({ ...editing, counts_as_scheduled: e.target.checked })} />
              Counts as Scheduled
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
              Active
            </label>
          </div>
        </Modal>
      )}
    </div>
  )
}
