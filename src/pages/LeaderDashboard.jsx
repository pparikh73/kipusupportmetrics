import { useState, useEffect, useMemo } from 'react'
import {
  getOrganizations, getGroups, getAgents,
  getLeaderScorecards, getGroupMonthDetail, getGroupYearDetail,
  getMetrics,
} from '../lib/api'
import { formatValue, statusClass, statusLabel, recentMonths } from '../lib/format'

// ── Constants ─────────────────────────────────────────────────────────────────

function getYearOptions() {
  const cur = new Date().getFullYear()
  const years = []
  for (let y = cur + 1; y >= 2023; y--) years.push(String(y))
  return years
}

const QUARTERS = [
  { label: 'Q1', months: [1, 2, 3] },
  { label: 'Q2', months: [4, 5, 6] },
  { label: 'Q3', months: [7, 8, 9] },
  { label: 'Q4', months: [10, 11, 12] },
]
const HALVES = [
  { label: 'H1', months: [1, 2, 3, 4, 5, 6] },
  { label: 'H2', months: [7, 8, 9, 10, 11, 12] },
]

// ── Rollup helpers ────────────────────────────────────────────────────────────

function metricMonthNum(metricMonth) {
  return parseInt(metricMonth.slice(5, 7), 10)
}

function computePeriodActual(rows, unitType) {
  const withData = rows.filter((r) => r.actual_value != null)
  if (!withData.length) return null
  const sum = withData.reduce((s, r) => s + r.actual_value, 0)
  return unitType === 'count' ? sum : sum / withData.length
}

function deriveStatus(actual, refRow) {
  if (actual == null || !refRow) return 'no_data'
  const { target_value, tolerance_value, direction_good } = refRow
  if (target_value == null) return 'no_target'
  const tol = tolerance_value ?? 0
  if (direction_good === 'higher') return actual >= target_value - tol ? 'on_track' : 'off_track'
  if (direction_good === 'lower')  return actual <= target_value + tol ? 'on_track' : 'off_track'
  return 'no_target'
}

// Returns { [metricKey]: { actual, status, unitType } } for an agent/period
function computeAgentPeriodMetrics(agentId, periodMonths, yearDetail, configuredCore) {
  const agentRows = yearDetail.filter((r) => r.agent_id === agentId)
  const result = {}
  configuredCore.forEach((metric) => {
    const metricRows = agentRows.filter(
      (r) => r.metric_key === metric.metric_key && periodMonths.includes(metricMonthNum(r.metric_month))
    )
    const dataRows = metricRows.filter((r) => r.actual_value != null)
    if (!dataRows.length) { result[metric.metric_key] = { actual: null, status: 'no_data', unitType: metric.unit_type }; return }
    const refRow = [...dataRows].sort((a, b) => b.metric_month.localeCompare(a.metric_month))[0]
    const actual = computePeriodActual(dataRows, metric.unit_type)
    result[metric.metric_key] = { actual, status: deriveStatus(actual, refRow), unitType: metric.unit_type }
  })
  return result
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCell({ row }) {
  if (!row || row.actual_value == null) {
    return <td style={{ textAlign: 'center', color: '#adb5bd' }}>—</td>
  }
  const sc = statusClass(row.metric_status)
  return (
    <td style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 600, fontSize: 12 }}>{formatValue(row.actual_value, row.unit_type)}</div>
      <span className={`badge ${sc}`} style={{ fontSize: 10, marginTop: 2, display: 'inline-block' }}>
        {statusLabel(row.metric_status)}
      </span>
    </td>
  )
}

function PeriodMetricCell({ cell }) {
  if (!cell || cell.actual == null) {
    return <td style={{ textAlign: 'center', color: '#adb5bd' }}>—</td>
  }
  const sc = statusClass(cell.status)
  return (
    <td style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 600, fontSize: 12 }}>{formatValue(cell.actual, cell.unitType)}</div>
      <span className={`badge ${sc}`} style={{ fontSize: 10, marginTop: 2, display: 'inline-block' }}>
        {statusLabel(cell.status)}
      </span>
    </td>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamDashboard() {
  const monthOptions = recentMonths(24)
  const yearOptions = getYearOptions()

  const [orgs, setOrgs]     = useState([])
  const [groups, setGroups] = useState([])
  const [agents, setAgents] = useState([])
  const [configuredMetrics, setConfiguredMetrics] = useState([])

  const [orgId, setOrgId]     = useState('')
  const [groupId, setGroupId] = useState('')
  const [search, setSearch]   = useState('')
  const [month, setMonth]     = useState(monthOptions[0]?.value ?? '')
  const [rollupYear, setRollupYear] = useState(String(new Date().getFullYear()))

  const [scorecards, setScorecards]   = useState([])
  const [monthDetail, setMonthDetail] = useState([])
  const [yearDetail, setYearDetail]   = useState([])

  const [loading, setLoading]         = useState(false)
  const [yearLoading, setYearLoading] = useState(false)
  const [error, setError]             = useState('')

  // Load reference data once
  useEffect(() => {
    getOrganizations().then(setOrgs).catch((e) => setError(e.message))
    getMetrics()
      .then((all) => setConfiguredMetrics(all.filter((m) => m.active)))
      .catch((e) => setError(e.message))
    getGroups()
      .then((g) => {
        setGroups(g)
        if (g.length > 0) setGroupId(String(g[0].id)) // default to first group
      })
      .catch((e) => setError(e.message))
  }, [])

  // Load agents when org/group changes
  useEffect(() => {
    if (!groupId) return
    getAgents(orgId || undefined, groupId ? Number(groupId) : undefined)
      .then(setAgents)
      .catch((e) => setError(e.message))
  }, [orgId, groupId])

  // Derived agent IDs — stable reference changes only when agents array changes
  const agentIds = useMemo(() => agents.map((a) => a.id), [agents])

  // Load monthly data when agents or month changes
  useEffect(() => {
    if (!agentIds.length || !month) { setScorecards([]); setMonthDetail([]); return }
    setLoading(true)
    setError('')
    Promise.all([
      getLeaderScorecards({ month, externalGroupId: groupId ? Number(groupId) : undefined }),
      getGroupMonthDetail({ month, agentIds }),
    ])
      .then(([sc, det]) => { setScorecards(sc); setMonthDetail(det) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [agentIds, month])

  // Load year data when agents or rollup year changes
  useEffect(() => {
    if (!agentIds.length || !rollupYear) { setYearDetail([]); return }
    setYearLoading(true)
    getGroupYearDetail({ year: rollupYear, agentIds })
      .then(setYearDetail)
      .catch((e) => setError(e.message))
      .finally(() => setYearLoading(false))
  }, [agentIds, rollupYear])

  // ── Derived data ────────────────────────────────────────────────────────────

  const configuredCore = configuredMetrics.filter((m) => m.counts_toward_rating && !m.visibility_only)

  // Lookup: agentId → metricKey → detail row
  const detailByAgent = useMemo(() => {
    const map = {}
    monthDetail.forEach((r) => {
      if (!map[r.agent_id]) map[r.agent_id] = {}
      map[r.agent_id][r.metric_key] = r
    })
    return map
  }, [monthDetail])

  // Filtered and searched agent list
  const displayAgents = agents.filter((a) =>
    !search || a.agent_name.toLowerCase().includes(search.toLowerCase())
  )

  // Summary stats
  const selectedGroup = groups.find((g) => String(g.id) === groupId)
  const ratingDist = scorecards.reduce((acc, r) => {
    const lbl = r.rating_label ?? 'Unknown'
    acc[lbl] = (acc[lbl] ?? 0) + 1
    return acc
  }, {})
  const avgOnTrack = scorecards.length
    ? (scorecards.reduce((s, r) => s + (r.on_track_count ?? 0), 0) / scorecards.length).toFixed(1)
    : '—'

  const monthLabel = monthOptions.find((m) => m.value === month)?.label ?? month

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Team Dashboard</h1>
        <p className="page-subtitle">Group performance by month</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">Month</label>
          <select className="filter-select" value={month} onChange={(e) => setMonth(e.target.value)}>
            {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
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
            <option value="">Select Group</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.group_name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">Search Agent</label>
          <input
            className="filter-select"
            style={{ minWidth: 160 }}
            placeholder="Filter by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {!groupId && (
        <div className="empty-state">
          <h3>Select a group to view team performance</h3>
        </div>
      )}

      {groupId && loading && <div className="loading">Loading...</div>}

      {groupId && !loading && (
        <>
          {/* Summary cards */}
          <div className="cards-row">
            <div className="stat-card">
              <div className="stat-label">Group</div>
              <div className="stat-value" style={{ fontSize: 16, marginTop: 4, color: '#1a1a2e' }}>
                {selectedGroup?.group_name ?? '—'}
              </div>
              <div className="stat-sub">{monthLabel}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Agents</div>
              <div className="stat-value">{agents.length}</div>
              <div className="stat-sub">assigned active</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg On Track</div>
              <div className="stat-value" style={{ color: '#1a6e3a' }}>{avgOnTrack}</div>
              <div className="stat-sub">metrics / agent</div>
            </div>
            {Object.entries(ratingDist).map(([label, count]) => (
              <div key={label} className="stat-card">
                <div className="stat-label">Rating</div>
                <div className={`stat-value ${ratingClass(label)}`} style={{ fontSize: 16, marginTop: 4 }}>
                  {label}
                </div>
                <div className="stat-sub">{count} agent{count !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>

          {/* Main metric table */}
          <div className="section-title">
            Monthly Performance — {monthLabel}
          </div>

          {displayAgents.length === 0 ? (
            <div className="empty-state">
              <h3>No agents found</h3>
              <p>No assigned active agents match the current filters.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: 150, position: 'sticky', left: 0, background: '#f8f9fb', zIndex: 1 }}>Agent</th>
                    {configuredCore.map((m) => (
                      <th key={m.metric_key} style={{ minWidth: 100, textAlign: 'center' }} title={m.metric_name}>
                        {m.metric_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayAgents.map((agent) => {
                    const agentDetail = detailByAgent[agent.id] ?? {}
                    return (
                      <tr key={agent.id}>
                        <td style={{ fontWeight: 600, position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>
                          {agent.agent_name}
                        </td>
                        {configuredCore.map((m) => (
                          <MetricCell key={m.metric_key} row={agentDetail[m.metric_key]} />
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Rollup section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 8px' }}>
            <div className="section-title" style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>
              Rollup Year
            </div>
            <select
              className="filter-select"
              style={{ height: 30, fontSize: 13, minWidth: 90 }}
              value={rollupYear}
              onChange={(e) => setRollupYear(e.target.value)}
            >
              {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            {yearLoading && <span style={{ fontSize: 12, color: '#6b7a8d' }}>Loading…</span>}
          </div>

          {!yearLoading && displayAgents.length > 0 && (
            <>
              {/* Quarterly table */}
              <div className="section-title">Quarterly Team Summary — {rollupYear}</div>
              <div className="table-wrap">
                <table style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th rowSpan={2} style={{ minWidth: 150, fontSize: 13, fontWeight: 700, verticalAlign: 'bottom' }}>Agent</th>
                      {QUARTERS.map((q) => (
                        <th key={q.label} colSpan={configuredCore.length} style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #dee2e6' }}>
                          {q.label}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      {QUARTERS.map((q) =>
                        configuredCore.map((m) => (
                          <th key={`${q.label}-${m.metric_key}`} style={{ minWidth: 90, textAlign: 'center', fontSize: 11, fontWeight: 600 }}>
                            {m.metric_name}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {displayAgents.map((agent) => (
                      <tr key={agent.id}>
                        <td style={{ fontWeight: 600, fontSize: 13 }}>{agent.agent_name}</td>
                        {QUARTERS.map((q) => {
                          const metrics = computeAgentPeriodMetrics(agent.id, q.months, yearDetail, configuredCore)
                          return configuredCore.map((m) => (
                            <PeriodMetricCell key={`${q.label}-${m.metric_key}`} cell={metrics[m.metric_key]} />
                          ))
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Half-year table */}
              <div className="section-title">Half-Year Team Summary — {rollupYear}</div>
              <div className="table-wrap">
                <table style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th rowSpan={2} style={{ minWidth: 150, fontSize: 13, fontWeight: 700, verticalAlign: 'bottom' }}>Agent</th>
                      {HALVES.map((h) => (
                        <th key={h.label} colSpan={configuredCore.length} style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #dee2e6' }}>
                          {h.label}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      {HALVES.map((h) =>
                        configuredCore.map((m) => (
                          <th key={`${h.label}-${m.metric_key}`} style={{ minWidth: 90, textAlign: 'center', fontSize: 11, fontWeight: 600 }}>
                            {m.metric_name}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {displayAgents.map((agent) => (
                      <tr key={agent.id}>
                        <td style={{ fontWeight: 600, fontSize: 13 }}>{agent.agent_name}</td>
                        {HALVES.map((h) => {
                          const metrics = computeAgentPeriodMetrics(agent.id, h.months, yearDetail, configuredCore)
                          return configuredCore.map((m) => (
                            <PeriodMetricCell key={`${h.label}-${m.metric_key}`} cell={metrics[m.metric_key]} />
                          ))
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
