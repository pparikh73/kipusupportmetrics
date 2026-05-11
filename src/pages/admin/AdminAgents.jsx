import { useState, useEffect } from 'react'
import { getAllAgents, upsertAgent, getAllOrganizations, getAllGroups } from '../../lib/api'
import Modal from '../../components/Modal'

function isAssigned(r) {
  return r.organization_id != null && r.external_group_id != null
}

export default function AdminAgents() {
  const [allRows, setAllRows] = useState([])
  const [orgs, setOrgs] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [assignFilter, setAssignFilter] = useState('all')
  const [orgFilter, setOrgFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([getAllAgents(), getAllOrganizations(), getAllGroups()])
      .then(([a, o, g]) => { setAllRows(a); setOrgs(o); setGroups(g) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...editing }
      delete payload.metrics_cfg_organizations
      delete payload.metrics_cfg_external_groups
      payload.organization_id = payload.organization_id ? Number(payload.organization_id) : null
      payload.external_group_id = payload.external_group_id ? Number(payload.external_group_id) : null
      await upsertAgent(payload)
      setEditing(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // All groups shown in modal — org name shown in parentheses for context
  const modalGroups = groups

  // Groups available for the group filter dropdown (filtered by org filter)
  const filterGroups = orgFilter
    ? groups.filter((g) => g.organization_id === Number(orgFilter))
    : groups

  const displayRows = allRows.filter((r) => {
    if (assignFilter === 'assigned' && !isAssigned(r)) return false
    if (assignFilter === 'unassigned' && isAssigned(r)) return false
    if (orgFilter && r.organization_id !== Number(orgFilter)) return false
    if (groupFilter && r.external_group_id !== Number(groupFilter)) return false
    if (search && !r.agent_name?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const assignedCount = allRows.filter(isAssigned).length
  const unassignedCount = allRows.length - assignedCount

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Agents</h1>
        <p className="page-subtitle">
          {allRows.length} total · {assignedCount} assigned · {unassignedCount} unassigned
        </p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="filter-bar" style={{ marginBottom: 12 }}>
        <div className="filter-group">
          <label className="filter-label">Search</label>
          <input
            className="filter-select"
            style={{ minWidth: 180 }}
            placeholder="Agent name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">Assignment</label>
          <select className="filter-select" value={assignFilter} onChange={(e) => setAssignFilter(e.target.value)}>
            <option value="all">All Agents</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Organization</label>
          <select className="filter-select" value={orgFilter} onChange={(e) => { setOrgFilter(e.target.value); setGroupFilter('') }}>
            <option value="">All Organizations</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.organization_name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Group</label>
          <select className="filter-select" value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
            <option value="">All Groups</option>
            {filterGroups.map((g) => <option key={g.id} value={g.id}>{g.group_name}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div className="loading">Loading...</div> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent Name</th>
                <th>Organization</th>
                <th>Group</th>
                <th>Status</th>
                <th>Active</th>
                <th>Email</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.agent_name}</td>
                  <td>{r.metrics_cfg_organizations?.organization_name ?? <span style={{ color: '#842029', fontSize: 12 }}>Unassigned</span>}</td>
                  <td>{r.metrics_cfg_external_groups?.group_name ?? <span style={{ color: '#842029', fontSize: 12 }}>Unassigned</span>}</td>
                  <td>
                    {isAssigned(r)
                      ? <span className="badge status-on-track">Assigned</span>
                      : <span className="badge status-off-track">Unassigned</span>}
                  </td>
                  <td><span style={{ color: r.active ? '#1a6e3a' : '#842029', fontWeight: 600, fontSize: 12 }}>{r.active ? 'Yes' : 'No'}</span></td>
                  <td style={{ fontSize: 12, color: '#6b7a8d' }}>{r.email ?? '—'}</td>
                  <td style={{ fontSize: 12, color: '#6b7a8d', maxWidth: 200 }}>{r.notes ?? '—'}</td>
                  <td><button className="btn btn-sm btn-secondary" onClick={() => setEditing({ ...r })}>Edit</button></td>
                </tr>
              ))}
              {displayRows.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#6b7a8d' }}>No agents match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal
          title={`Edit Agent: ${editing.agent_name}`}
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
            <input className="form-input" value={editing.agent_name ?? ''} readOnly style={{ background: '#f8f9fb', color: '#6b7a8d' }} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Organization</label>
              <select
                className="form-select"
                value={editing.organization_id ?? ''}
                onChange={(e) => setEditing({ ...editing, organization_id: e.target.value || '', external_group_id: '' })}
              >
                <option value="">— Unassigned —</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.organization_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Group</label>
              <select
                className="form-select"
                value={editing.external_group_id ?? ''}
                onChange={(e) => setEditing({ ...editing, external_group_id: e.target.value || '' })}
              >
                <option value="">— Unassigned —</option>
                {modalGroups.map((g) => (
                  <option key={g.id} value={g.id}>{g.group_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={editing.email ?? ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
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
