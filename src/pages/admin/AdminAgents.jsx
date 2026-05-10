import { useState, useEffect } from 'react'
import { getAllAgents, upsertAgent, getAllOrganizations, getAllGroups } from '../../lib/api'
import Modal from '../../components/Modal'

export default function AdminAgents() {
  const [rows, setRows] = useState([])
  const [orgs, setOrgs] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([getAllAgents(), getAllOrganizations(), getAllGroups()])
      .then(([a, o, g]) => { setRows(a); setOrgs(o); setGroups(g) })
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
      if (!payload.organization_id) payload.organization_id = null
      if (!payload.external_group_id) payload.external_group_id = null
      await upsertAgent(payload)
      setEditing(null)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredGroups = editing?.organization_id
    ? groups.filter((g) => g.organization_id === Number(editing.organization_id))
    : groups

  const displayRows = rows.filter((r) =>
    !search || r.agent_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Agents</h1>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
        <input
          className="form-input"
          style={{ maxWidth: 240 }}
          placeholder="Search agents…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-primary" onClick={() => setEditing({
          agent_name: '', email: '', external_agent_key: '', zendesk_user_id: '',
          organization_id: '', external_group_id: '', active: true,
          hire_date: '', go_live_date: '', notes: '',
        })}>+ Add Agent</button>
      </div>
      {loading ? <div className="loading">Loading...</div> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent Name</th>
                <th>Email</th>
                <th>Organization</th>
                <th>Group</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.agent_name}</td>
                  <td>{r.email ?? '—'}</td>
                  <td>{r.metrics_cfg_organizations?.organization_name ?? '—'}</td>
                  <td>{r.metrics_cfg_external_groups?.group_name ?? '—'}</td>
                  <td><span style={{ color: r.active ? '#1a6e3a' : '#842029', fontWeight: 600, fontSize: 12 }}>{r.active ? 'Yes' : 'No'}</span></td>
                  <td><button className="btn btn-sm btn-secondary" onClick={() => setEditing({ ...r })}>Edit</button></td>
                </tr>
              ))}
              {displayRows.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#6b7a8d' }}>No agents found</td></tr>
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
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Agent Name</label>
              <input className="form-input" value={editing.agent_name ?? ''} onChange={(e) => setEditing({ ...editing, agent_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={editing.email ?? ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Organization</label>
              <select
                className="form-select"
                value={editing.organization_id ?? ''}
                onChange={(e) => setEditing({ ...editing, organization_id: e.target.value ? Number(e.target.value) : '', external_group_id: '' })}
              >
                <option value="">Select organization…</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.organization_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Group</label>
              <select
                className="form-select"
                value={editing.external_group_id ?? ''}
                onChange={(e) => setEditing({ ...editing, external_group_id: e.target.value ? Number(e.target.value) : '' })}
              >
                <option value="">Select group…</option>
                {filteredGroups.map((g) => <option key={g.id} value={g.id}>{g.group_name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">External Agent Key</label>
              <input className="form-input" value={editing.external_agent_key ?? ''} onChange={(e) => setEditing({ ...editing, external_agent_key: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Zendesk User ID</label>
              <input className="form-input" value={editing.zendesk_user_id ?? ''} onChange={(e) => setEditing({ ...editing, zendesk_user_id: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Hire Date</label>
              <input className="form-input" type="date" value={editing.hire_date ?? ''} onChange={(e) => setEditing({ ...editing, hire_date: e.target.value || null })} />
            </div>
            <div className="form-group">
              <label className="form-label">Go Live Date</label>
              <input className="form-input" type="date" value={editing.go_live_date ?? ''} onChange={(e) => setEditing({ ...editing, go_live_date: e.target.value || null })} />
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
