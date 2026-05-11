import { useState, useEffect } from 'react'
import { getAllTolerances, upsertTolerance, getAllGroups, getAllMetrics } from '../../lib/api'
import Modal from '../../components/Modal'

export default function AdminTolerances() {
  const [groups, setGroups] = useState([])
  const [metrics, setMetrics] = useState([])
  const [allTolerances, setAllTolerances] = useState([])
  const [groupId, setGroupId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([getAllTolerances(), getAllGroups(), getAllMetrics()])
      .then(([t, g, m]) => {
        setAllTolerances(t)
        setGroups(g)
        setMetrics(m)
        if (g.length > 0) setGroupId((prev) => prev || String(g[0].id))
      })
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
      await upsertTolerance(payload)
      setEditing(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const activeMetrics = metrics.filter((m) => m.active).sort((a, b) => a.display_order - b.display_order)

  const toleranceByMetric = {}
  allTolerances
    .filter((t) => String(t.external_group_id) === groupId)
    .forEach((t) => { toleranceByMetric[t.metric_id] = t })

  const editMetricName = editing
    ? (metrics.find((m) => m.id === editing.metric_id)?.metric_name ?? '')
    : ''

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Tolerances</h1>
        <p className="page-subtitle">Acceptable variance from target per group and metric</p>
      </div>
      {error && <div className="error-msg">{error}</div>}

      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">Group</label>
          <select className="filter-select" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">Select group…</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.group_name}</option>)}
          </select>
        </div>
      </div>

      {!groupId && <div className="empty-state"><h3>Select a group to view tolerances</h3></div>}

      {groupId && loading && <div className="loading">Loading...</div>}

      {groupId && !loading && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Tolerance Value</th>
                <th>Unit</th>
                <th>Effective Start</th>
                <th>Effective End</th>
                <th>Active</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {activeMetrics.map((metric) => {
                const t = toleranceByMetric[metric.id]
                return (
                  <tr key={metric.id}>
                    <td style={{ fontWeight: 500 }}>{metric.metric_name}</td>
                    <td style={{ fontWeight: 600 }}>
                      {t != null ? `±${t.tolerance_value}` : <span style={{ color: '#adb5bd' }}>—</span>}
                    </td>
                    <td style={{ fontSize: 12 }}>{t?.tolerance_unit ?? <span style={{ color: '#adb5bd' }}>—</span>}</td>
                    <td style={{ fontSize: 12 }}>{t?.effective_start_date ?? <span style={{ color: '#adb5bd' }}>—</span>}</td>
                    <td style={{ fontSize: 12 }}>{t?.effective_end_date ?? <span style={{ color: '#adb5bd' }}>—</span>}</td>
                    <td>
                      {t != null
                        ? <span style={{ color: t.active ? '#1a6e3a' : '#842029', fontWeight: 600, fontSize: 12 }}>{t.active ? 'Yes' : 'No'}</span>
                        : <span style={{ color: '#adb5bd', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ fontSize: 12, color: '#6b7a8d', maxWidth: 200 }}>
                      {t?.notes ?? <span style={{ color: '#adb5bd' }}>—</span>}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setEditing(
                          t
                            ? { ...t }
                            : {
                                metric_id: metric.id,
                                external_group_id: Number(groupId),
                                tolerance_value: '',
                                tolerance_unit: 'points',
                                effective_start_date: '',
                                effective_end_date: '',
                                active: true,
                                notes: '',
                              }
                        )}
                      >
                        {t ? 'Edit' : 'Set'}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {activeMetrics.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#6b7a8d' }}>No active metrics configured.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal
          title={editing.id ? `Edit Tolerance — ${editMetricName}` : `Set Tolerance — ${editMetricName}`}
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
              <label className="form-label">Tolerance Value</label>
              <input
                className="form-input"
                type="number"
                step="any"
                value={editing.tolerance_value ?? ''}
                onChange={(e) => setEditing({ ...editing, tolerance_value: e.target.value === '' ? '' : Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-select" value={editing.tolerance_unit ?? 'points'} onChange={(e) => setEditing({ ...editing, tolerance_unit: e.target.value })}>
                <option value="points">points</option>
                <option value="percent">percent</option>
                <option value="days">days</option>
                <option value="count">count</option>
              </select>
            </div>
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
            <input type="checkbox" checked={!!editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
            Active
          </label>
        </Modal>
      )}
    </div>
  )
}
