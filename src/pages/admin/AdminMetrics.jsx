import { useState, useEffect } from 'react'
import { getAllMetrics, upsertMetric } from '../../lib/api'
import Modal from '../../components/Modal'

export default function AdminMetrics() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    getAllMetrics()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try {
      await upsertMetric(editing)
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
        <h1 className="page-title">Metrics</h1>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <div style={{ marginBottom: 12 }}>
        <button className="btn btn-primary" onClick={() => setEditing({
          metric_key: '', metric_name: '', description: '', unit_type: 'count',
          direction_good: 'higher', active: true, display_order: 0,
          counts_toward_rating: true, visibility_only: false, source_behavior: '',
        })}>+ Add Metric</button>
      </div>
      {loading ? <div className="loading">Loading...</div> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Metric Name</th>
                <th>Key</th>
                <th>Unit</th>
                <th>Direction</th>
                <th>Counts to Rating</th>
                <th>Visibility Only</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.metric_name}</td>
                  <td style={{ fontSize: 11, color: '#6b7a8d' }}>{r.metric_key}</td>
                  <td>{r.unit_type}</td>
                  <td>{r.direction_good}</td>
                  <td>{r.counts_toward_rating ? 'Yes' : 'No'}</td>
                  <td>{r.visibility_only ? 'Yes' : 'No'}</td>
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
          title={editing.id ? 'Edit Metric' : 'Add Metric'}
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
              <label className="form-label">Metric Name</label>
              <input className="form-input" value={editing.metric_name} onChange={(e) => setEditing({ ...editing, metric_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Key</label>
              <input className="form-input" value={editing.metric_key} onChange={(e) => setEditing({ ...editing, metric_key: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Unit Type</label>
              <select className="form-select" value={editing.unit_type} onChange={(e) => setEditing({ ...editing, unit_type: e.target.value })}>
                <option value="count">Count</option>
                <option value="percent">Percent</option>
                <option value="days">Days</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Direction Good</label>
              <select className="form-select" value={editing.direction_good} onChange={(e) => setEditing({ ...editing, direction_good: e.target.value })}>
                <option value="higher">Higher</option>
                <option value="lower">Lower</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={2} value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Display Order</label>
            <input className="form-input" type="number" value={editing.display_order} onChange={(e) => setEditing({ ...editing, display_order: Number(e.target.value) })} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={editing.counts_toward_rating} onChange={(e) => setEditing({ ...editing, counts_toward_rating: e.target.checked })} />
              Counts Toward Rating
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={editing.visibility_only} onChange={(e) => setEditing({ ...editing, visibility_only: e.target.checked })} />
              Visibility Only
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
