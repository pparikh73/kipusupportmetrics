import { useState, useEffect, useCallback } from 'react'
import { getTeams, getAttendanceMonthly } from '../lib/api'
import { currentMonth, recentMonths } from '../lib/format'
import { downloadCsv } from '../lib/csv'

export default function AttendanceSummary() {
  const months = recentMonths(18)
  const [teams, setTeams]   = useState([])
  const [teamId, setTeamId] = useState('')
  const [month, setMonth]   = useState(currentMonth())

  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError]     = useState('')

  // CSV export — every month's summary for every agent, all teams
  async function exportCsv() {
    setExporting(true)
    setError('')
    try {
      const all = await getAttendanceMonthly()
      const teamById = {}
      teams.forEach((t) => { teamById[t.id] = t.group_name })
      const sorted = [...all].sort((a, b) =>
        String(a.metric_month).localeCompare(String(b.metric_month)) ||
        (a.agent_name ?? '').localeCompare(b.agent_name ?? ''))
      downloadCsv(
        `attendance-summary-${new Date().toISOString().slice(0, 10)}.csv`,
        ['Agent', 'Team', 'Month', 'Scheduled Days', 'Available Days', 'Attendance %'],
        sorted.map((r) => [
          r.agent_name,
          teamById[r.external_group_id] ?? '',
          String(r.metric_month).slice(0, 7),
          r.scheduled_days,
          r.available_days,
          r.attendance_pct,
        ])
      )
    } catch (e) {
      setError(e.message)
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    getTeams().then(setTeams).catch((e) => setError(e.message))
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getAttendanceMonthly({ month })
      setRows(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { loadData() }, [loadData])

  const displayRows = teamId
    ? rows.filter((r) => String(r.external_group_id) === teamId)
    : rows

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
          <label className="filter-label">Team</label>
          <select className="filter-select" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            <option value="">All Teams</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.group_name}</option>)}
          </select>
        </div>
        <div className="filter-group" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={exportCsv} disabled={exporting} style={{ marginTop: 18 }}>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {loading && <div className="loading">Loading...</div>}

      {!loading && displayRows.length === 0 && (
        <div className="empty-state">
          <h3>No attendance data</h3>
          <p>No attendance records exist for the selected month and filters. Use Attendance Entry to add records.</p>
        </div>
      )}

      {!loading && displayRows.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Scheduled Days</th>
                <th>Available Days</th>
                <th>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((r) => {
                const pct = r.attendance_pct
                const pctColor = pct == null ? '#6b7a8d' : pct >= 90 ? '#1a6e3a' : pct >= 80 ? '#664d00' : '#842029'
                return (
                  <tr key={r.agent_id}>
                    <td style={{ fontWeight: 500 }}>{r.agent_name}</td>
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
