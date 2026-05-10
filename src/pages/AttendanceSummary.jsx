import { useState, useEffect, useCallback } from 'react'
import { getOrganizations, getGroups, getAttendanceMonthly } from '../lib/api'
import { currentMonth, recentMonths } from '../lib/format'

export default function AttendanceSummary() {
  const months = recentMonths(18)
  const [orgs, setOrgs] = useState([])
  const [groups, setGroups] = useState([])

  const [orgId, setOrgId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [month, setMonth] = useState(currentMonth())

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getOrganizations().then(setOrgs).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    setGroupId('')
    getGroups(orgId || undefined).then(setGroups).catch((e) => setError(e.message))
  }, [orgId])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getAttendanceMonthly({
        month,
        organizationId: orgId || undefined,
        externalGroupId: groupId || undefined,
      })
      setRows(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [month, orgId, groupId])

  useEffect(() => { loadData() }, [loadData])

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Attendance Summary</h1>
        <p className="page-subtitle">Monthly attendance by agent</p>
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
      </div>

      {loading && <div className="loading">Loading...</div>}

      {!loading && rows.length === 0 && (
        <div className="empty-state">
          <h3>No attendance data</h3>
          <p>No attendance records exist for the selected month and filters. Use Attendance Entry to add records.</p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Organization</th>
                <th>Group</th>
                <th>Scheduled Days</th>
                <th>Available Days</th>
                <th>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const pct = r.attendance_pct
                const pctColor = pct == null ? '#6b7a8d' : pct >= 90 ? '#1a6e3a' : pct >= 80 ? '#664d00' : '#842029'
                return (
                  <tr key={r.agent_id}>
                    <td style={{ fontWeight: 500 }}>{r.agent_name}</td>
                    <td>{r.organization_name ?? '—'}</td>
                    <td>{r.external_group_name ?? '—'}</td>
                    <td>{r.scheduled_days ?? '—'}</td>
                    <td>{r.available_days ?? '—'}</td>
                    <td style={{ color: pctColor, fontWeight: 600 }}>
                      {pct != null ? `${Number(pct).toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
