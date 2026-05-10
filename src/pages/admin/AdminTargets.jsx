import { useState, useEffect } from 'react'
import { getAllTargets, upsertTarget, getAllGroups, getAllMetrics } from '../../lib/api'
import Modal from '../../components/Modal'

export default function AdminTargets() {
  const [rows, setRows] = useState([])
  const [groups, setGroups] = useState([])
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([getAllTargets(), getAllGroups(), getAllMetrics()])
      .then(([t, g, m]) => { setRows(t); setGroups(g); setMetrics(m) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...editing }
      delete payload.metrics_cfg_external_groups
      delete payload.metrics_cfg_metrics
      await upsertTarget(payload)
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
        <h1 className="page-title">Group Metric Targets</h1>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <div style={{ marginBottom: 12 }}>
        <button className="btn btn-primary" onClick={() => setEditing({
          metric_id: '', external_group_id: '', target_value: '',
          effective_start_date: '', effective_end_date: '', active: true, notes: '',
        })}>+ Add Target</button>
      </div>
      {loading ? <div className="loading">Loading...</div> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Group</th>
                <th>Metric</th>
                <th>Target Value</th>
                <th>Effective Start</th>
                <th>Effective End</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.metrics_cfg_external_groups?.group_name ?? '—'}</td>
                  <td>{r.metrics_cfg_metrics?.metric_name ?? '—'}</td>
                  <td style={{ fontWeight: 600 }}>{r.target_value}</td>
                  <td>{r.effective_start_date ?? '—'}</td>
                  <td>{r.effective_end_date ?? '—'}</td>
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
          title={editing.id ? 'Edit Target' : 'Add Target'}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </>
          }
        >
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Group</label>
            <select className="form-select" value={editing.external_group_id ?? ''} onChange={(e) => setEditing({ ...editing, external_group_id: e.target.value ? Number(e.target.value) : '' })}>
              <option value="">Select group…</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.group_name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Metric</label>
            <select className="form-select" value={editing.metric_id ?? ''} onChange={(e) => setEditing({ ...editing, metric_id: e.target.value ? Number(e.target.value) : '' })}>
              <option value="">Select metric…</option>
              {metrics.map((m) => <option key={m.id} value={m.id}>{m.metric_name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Target Value</label>
            <input className="form-input" type="number" step="any" value={editing.target_value ?? ''} onChange={(e) => setEditing({ ...editing, target_value: e.target.value === '' ? '' : Number(e.target.value) })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Effective Start Date</label>
              <input className="form-input" type="date" value={editing.effective_start_date ?? ''} onChange={(e) => setEditing({ ...editing, effective_start_date: e.target.value || null })} />
            </div>
            <div className="form-group">
              <label className="form-label">Effective End Date</label>
              <input className="form-input" type="date" value={editing.effective_end_date ?? ''} onChange={(e) => setEditing({ ...editing, effective_end_date: e.target.value || null })} />
            </div>
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
