import { useState, useEffect, useCallback } from 'react'
import { getOrganizations, getGroups, getAgents, getLeaderScorecards } from '../lib/api'
import { ratingClass, currentMonth, recentMonths } from '../lib/format'

export default function LeaderDashboard() {
  const months = recentMonths(18)
  const [orgs, setOrgs] = useState([])
  const [groups, setGroups] = useState([])
  const [agents, setAgents] = useState([])

  const [orgId, setOrgId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [agentId, setAgentId] = useState('')
  const [month, setMonth] = useState(currentMonth())

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getOrganizations().then(setOrgs).catch((e) => setError(e.message))
    getGroups().then(setGroups).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    setAgentId('')
    getAgents(orgId || undefined, groupId || undefined).then(setAgents).catch((e) => setError(e.message))
  }, [orgId, groupId])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getLeaderScorecards({
        month,
        organizationId: orgId || undefined,
        externalGroupId: groupId || undefined,
        agentId: agentId || undefined,
      })
      setRows(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [month, orgId, groupId, agentId])

  useEffect(() => { loadData() }, [loadData])

  // Derived stats
  const ratingCounts = rows.reduce((acc, r) => {
    const label = r.rating_label ?? 'Unknown'
    acc[label] = (acc[label] ?? 0) + 1
    return acc
  }, {})

  const sorted = [...rows].sort((a, b) => (b.on_track_count ?? 0) - (a.on_track_count ?? 0))
  const topPerformers = sorted.slice(0, 5)
  const needsAttention = [...rows]
    .filter((r) => (r.off_track_count ?? 0) > 0)
    .sort((a, b) => (b.off_track_count ?? 0) - (a.off_track_count ?? 0))
    .slice(0, 5)

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Leader Dashboard</h1>
        <p className="page-subtitle">Monthly team performance overview</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">Month</label>
          <select className="filter-select" value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Organization</label>
          <select className="filter-select" value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            <option value="">All Organizations</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.organization_name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Group</label>
          <select className="filter-select" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">All Groups</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.group_name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Agent (optional)</label>
          <select className="filter-select" value={agentId} onChange={(e) => setAgentId(e.target.value)}>
            <option value="">All Agents</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.agent_name}</option>)}
          </select>
        </div>
      </div>

      {loading && <div className="loading">Loading...</div>}

      {!loading && (
        <>
          {/* Rating Distribution */}
          {Object.keys(ratingCounts).length > 0 && (
            <div className="card">
              <div className="card-title">Rating Distribution</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {Object.entries(ratingCounts).map(([label, count]) => (
                  <div key={label} style={{ minWidth: 140, border: '1px solid #e2e6ea', borderRadius: 8, padding: '10px 16px', background: '#f8f9fb' }}>
                    <div className={`${ratingClass(label)}`} style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{count}</div>
                    <div style={{ fontSize: 11, color: '#6b7a8d' }}>agent{count !== 1 ? 's' : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            {topPerformers.length > 0 && (
              <div className="card" style={{ flex: 1, minWidth: 280 }}>
                <div className="card-title" style={{ color: '#1a6e3a' }}>Top Performers</div>
                <div className="table-wrap" style={{ marginBottom: 0 }}>
                  <table>
                    <thead><tr><th>Agent</th><th>Group</th><th>On Track</th></tr></thead>
                    <tbody>
                      {topPerformers.map((r) => (
                        <tr key={r.agent_id}>
                          <td>{r.agent_name}</td>
                          <td>{r.external_group_name ?? '—'}</td>
                          <td><span className="badge status-on-track">{r.on_track_count}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {needsAttention.length > 0 && (
              <div className="card" style={{ flex: 1, minWidth: 280 }}>
                <div className="card-title" style={{ color: '#842029' }}>Needs Attention</div>
                <div className="table-wrap" style={{ marginBottom: 0 }}>
                  <table>
                    <thead><tr><th>Agent</th><th>Group</th><th>Off Track</th></tr></thead>
                    <tbody>
                      {needsAttention.map((r) => (
                        <tr key={r.agent_id}>
                          <td>{r.agent_name}</td>
                          <td>{r.external_group_name ?? '—'}</td>
                          <td><span className="badge status-off-track">{r.off_track_count}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Full agent table */}
          <div className="section-title">All Agents ({rows.length})</div>
          {rows.length === 0 ? (
            <div className="empty-state">
              <h3>No data for this period</h3>
              <p>No scorecard data exists for the selected filters.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Organization</th>
                    <th>Group</th>
                    <th>Rating</th>
                    <th>On Track</th>
                    <th>Off Track</th>
                    <th>With Data</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.agent_id}>
                      <td style={{ fontWeight: 500 }}>{r.agent_name}</td>
                      <td>{r.organization_name ?? '—'}</td>
                      <td>{r.external_group_name ?? '—'}</td>
                      <td><span className={ratingClass(r.rating_label)}>{r.rating_label ?? '—'}</span></td>
                      <td><span className="badge status-on-track">{r.on_track_count ?? 0}</span></td>
                      <td><span className="badge status-off-track">{r.off_track_count ?? 0}</span></td>
                      <td>{r.scoring_metrics_with_data ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
