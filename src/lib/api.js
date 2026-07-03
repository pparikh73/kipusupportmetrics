import { supabase } from './supabase'

// Convert YYYY-MM → YYYY-MM-01 for date columns in Postgres
function toDateParam(month) {
  if (!month) return undefined
  return month.length === 7 ? `${month}-01` : month
}

// ── Teams (metrics_groups where group_type='team') ────────────────────────────

export async function getTeams() {
  const { data, error } = await supabase
    .from('metrics_groups')
    .select('id, group_key, group_name, active, display_order')
    .eq('group_type', 'team')
    .eq('active', true)
    .order('display_order')
  if (error) throw error
  return data
}

export async function getAllTeams() {
  const { data, error } = await supabase
    .from('metrics_groups')
    .select('id, group_type, group_key, group_name, active, display_order')
    .eq('group_type', 'team')
    .order('display_order')
  if (error) throw error
  return data
}

export async function upsertTeam(row) {
  const { data, error } = await supabase
    .from('metrics_groups')
    .upsert({ ...row, group_type: 'team' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Agents (metrics_agents) ───────────────────────────────────────────────────

// Active agents, optionally filtered by team via assignments
export async function getAgents({ groupId, activeOnly = true } = {}) {
  if (groupId) {
    const { data: assignments, error: ae } = await supabase
      .from('metrics_agent_group_assignments')
      .select('agent_id')
      .eq('group_id', Number(groupId))
      .eq('active', true)
    if (ae) throw ae
    if (!assignments?.length) return []
    const ids = assignments.map((a) => a.agent_id)
    let q = supabase
      .from('metrics_agents')
      .select('id, agent_name, active, role, hire_date, go_live_date, employment_end_date, notes')
      .in('id', ids)
      .order('agent_name')
    if (activeOnly) q = q.eq('active', true)
    const { data, error } = await q
    if (error) throw error
    return data
  }
  let query = supabase
    .from('metrics_agents')
    .select('id, agent_name, active, role, hire_date, go_live_date, employment_end_date, notes')
    .order('agent_name')
  if (activeOnly) query = query.eq('active', true)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getAllAgents() {
  const { data, error } = await supabase
    .from('metrics_agents')
    .select('*')
    .order('agent_name')
  if (error) throw error
  return data
}

export async function autoDeactivateExpiredAgents() {
  const today = new Date().toISOString().slice(0, 10)
  const { error } = await supabase
    .from('metrics_agents')
    .update({ active: false })
    .lte('employment_end_date', today)
    .eq('active', true)
    .not('employment_end_date', 'is', null)
  if (error) throw error
}

export async function upsertAgent(row) {
  const { data, error } = await supabase
    .from('metrics_agents')
    .upsert(row)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Team Assignments (metrics_agent_group_assignments) ────────────────────────

export async function getAllTeamAssignments() {
  const { data, error } = await supabase
    .from('metrics_agent_group_assignments')
    .select('*, metrics_groups(group_name), metrics_agents(agent_name)')
    .order('effective_start_month', { ascending: false })
  if (error) throw error
  return data
}

export async function upsertTeamAssignment(row) {
  const payload = { ...row }
  delete payload.metrics_groups
  delete payload.metrics_agents
  const { data, error } = await supabase
    .from('metrics_agent_group_assignments')
    .upsert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getAgentTeamAssignments(agentId) {
  const { data, error } = await supabase
    .from('metrics_agent_group_assignments')
    .select('*, metrics_groups(group_name)')
    .eq('agent_id', agentId)
    .order('effective_start_month', { ascending: false })
  if (error) throw error
  return data
}

export async function deleteTeamAssignment(id) {
  const { error } = await supabase
    .from('metrics_agent_group_assignments')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Metric Definitions (metrics_definitions) ──────────────────────────────────

export async function getMetricDefinitions() {
  const { data, error } = await supabase
    .from('metrics_definitions')
    .select('*')
    .eq('active', true)
    .order('display_order')
  if (error) throw error
  return data
}

export async function getAllMetricDefinitions() {
  const { data, error } = await supabase
    .from('metrics_definitions')
    .select('*')
    .order('display_order')
  if (error) throw error
  return data
}

export async function upsertMetricDefinition(row) {
  const { data, error } = await supabase
    .from('metrics_definitions')
    .upsert(row)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Group Goals (metrics_group_goals) ─────────────────────────────────────────

export async function getAllGroupGoals() {
  const { data, error } = await supabase
    .from('metrics_group_goals')
    .select('*, metrics_groups(group_name), metrics_definitions(metric_name, unit_type)')
    .order('group_id')
  if (error) throw error
  return data
}

export async function upsertGroupGoal(row) {
  const payload = { ...row }
  delete payload.metrics_groups
  delete payload.metrics_definitions
  const { data, error } = await supabase
    .from('metrics_group_goals')
    .upsert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteGroupGoal(id) {
  const { error } = await supabase
    .from('metrics_group_goals')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Dashboard views ───────────────────────────────────────────────────────────

// The scorecard view does not reflect day-level records saved from Attendance
// Entry, so the attendance metric is patched below with live numbers from
// metrics_vw_attendance_monthly — the same source the Attendance Summary uses.

function attendanceStatus(actual, row) {
  if (row.goal_value == null) return 'no_target'
  const tol = row.tolerance_value ?? 0
  if (row.direction_good === 'at_or_below') return actual <= row.goal_value + tol ? 'on_track' : 'off_track'
  return actual >= row.goal_value - tol ? 'on_track' : 'off_track'
}

async function overlayAttendance(rows, { month, year, agentId, agentIds, groupId } = {}) {
  try {
    const { data: defs, error: de } = await supabase
      .from('metrics_definitions')
      .select('*')
      .eq('active', true)
    if (de) throw de
    const attDef = (defs ?? []).find((d) => /attendance/i.test(`${d.metric_key} ${d.metric_name}`))
    if (!attDef) return rows

    let query = supabase.from('metrics_vw_attendance_monthly').select('*')
    if (month) query = query.eq('attendance_month', toDateParam(month))
    if (year)  query = query.gte('attendance_month', `${year}-01-01`).lte('attendance_month', `${year}-12-31`)
    const { data: att, error: ae } = await query
    if (ae) throw ae

    const live = new Map()
    for (const a of att ?? []) {
      if (a.attendance_pct == null) continue
      live.set(`${a.agent_id}:${String(a.attendance_month).slice(0, 7)}`, a)
    }
    if (!live.size) return rows

    const patched = rows.map((r) => {
      if (r.metric_key !== attDef.metric_key) return r
      const key = `${r.agent_id}:${String(r.metric_month).slice(0, 7)}`
      const a = live.get(key)
      if (!a) return r
      live.delete(key)
      const actual = Number(a.attendance_pct)
      return { ...r, actual_value: actual, metric_status: attendanceStatus(actual, r) }
    })

    // Attendance saved for agent/months the scorecard has no row for yet
    const wanted = agentId ? new Set([Number(agentId)])
      : agentIds?.length ? new Set(agentIds.map(Number))
      : null
    for (const [key, a] of live) {
      if (wanted && !wanted.has(Number(a.agent_id))) continue
      if (!wanted && groupId && String(a.external_group_id) !== String(groupId)) continue
      patched.push({
        agent_id: a.agent_id,
        agent_name: a.agent_name ?? null,
        group_id: a.external_group_id ?? null,
        metric_month: `${key.split(':')[1]}-01`,
        metric_key: attDef.metric_key,
        metric_name: attDef.metric_name,
        unit_type: attDef.unit_type,
        direction_good: attDef.direction_good,
        counts_toward_score: attDef.counts_toward_score,
        display_order: attDef.display_order,
        actual_value: Number(a.attendance_pct),
        goal_value: null,
        tolerance_value: null,
        metric_status: 'no_target',
      })
    }
    return patched
  } catch {
    return rows // the overlay must never break the scorecard pages
  }
}

// One row per agent/month/metric — primary scorecard source
export async function getScorecard({ agentId, month, groupId, agentIds } = {}) {
  let query = supabase.from('metrics_vw_ab_scorecard').select('*')
  if (agentId)          query = query.eq('agent_id', Number(agentId))
  if (month)            query = query.eq('metric_month', toDateParam(month))
  if (groupId)          query = query.eq('group_id', Number(groupId))
  if (agentIds?.length) query = query.in('agent_id', agentIds)
  const { data, error } = await query
  if (error) throw error
  return overlayAttendance(data, { month, agentId, agentIds, groupId })
}

// Year-range scorecard for rollups
export async function getScorecardYear({ agentId, groupId, year, agentIds } = {}) {
  let query = supabase.from('metrics_vw_ab_scorecard').select('*')
    .gte('metric_month', `${year}-01-01`)
    .lte('metric_month', `${year}-12-31`)
  if (agentId)          query = query.eq('agent_id', Number(agentId))
  if (groupId)          query = query.eq('group_id', Number(groupId))
  if (agentIds?.length) query = query.in('agent_id', agentIds)
  const { data, error } = await query
  if (error) throw error
  return overlayAttendance(data, { year, agentId, agentIds, groupId })
}

// One row per agent/month — summary ratings
export async function getSummary({ agentId, month, groupId } = {}) {
  let query = supabase.from('metrics_vw_ab_summary').select('*')
  if (agentId) query = query.eq('agent_id', Number(agentId))
  if (month)   query = query.eq('metric_month', toDateParam(month))
  if (groupId) query = query.eq('group_id', Number(groupId))
  const { data, error } = await query
  if (error) throw error
  return data
}

// Trend view
export async function getTrends({ agentId, groupId, year } = {}) {
  let query = supabase.from('metrics_vw_ab_trends').select('*')
  if (agentId) query = query.eq('agent_id', Number(agentId))
  if (groupId) query = query.eq('group_id', Number(groupId))
  if (year) {
    query = query
      .gte('metric_month', `${year}-01-01`)
      .lte('metric_month', `${year}-12-31`)
  }
  const { data, error } = await query
  if (error) throw error
  return data
}

// ── Historical Goals (metrics_group_goals filtered by date range) ─────────────

// Returns goals that were active during the given month (YYYY-MM or YYYY-MM-01).
// Used by the frontend to show the historically correct goal when viewing a past month.
export async function getActiveGoals({ groupId, month }) {
  if (!month || !groupId) return []
  // Use the full month window so a goal starting mid-month is still matched
  const [year, mon] = month.split('-').map(Number)
  const firstDay = `${String(year)}-${String(mon).padStart(2, '0')}-01`
  const lastDayDate = new Date(year, mon, 0) // day 0 of next month = last day of this month
  const lastDay = `${lastDayDate.getFullYear()}-${String(lastDayDate.getMonth() + 1).padStart(2, '0')}-${String(lastDayDate.getDate()).padStart(2, '0')}`
  const { data, error } = await supabase
    .from('metrics_group_goals')
    .select('metric_id, goal_value, tolerance_value, metrics_definitions(metric_key)')
    .eq('group_id', Number(groupId))
    .eq('active', true)
    .lte('effective_start_month', lastDay)
    .or(`effective_end_month.is.null,effective_end_month.gte.${firstDay}`)
  if (error) throw error
  return data
}

// ── Notes (metrics_agent_monthly_notes) ───────────────────────────────────────

export async function getAgentMonthNote({ agentId, noteMonth }) {
  const { data, error } = await supabase
    .from('metrics_agent_monthly_notes')
    .select('*')
    .eq('agent_id', agentId)
    .eq('metric_month', toDateParam(noteMonth))
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertAgentMonthNote({ agentId, noteMonth, noteText, createdBy }) {
  const row = { agent_id: agentId, metric_month: toDateParam(noteMonth), note_text: noteText }
  if (createdBy) row.created_by = createdBy
  const { data, error } = await supabase
    .from('metrics_agent_monthly_notes')
    .upsert(row, { onConflict: 'agent_id,metric_month' })
    .select()
    .single()
  if (error) {
    // If created_by column doesn't exist in DB yet, retry without it so the note still saves
    if (error.message?.includes('created_by') && row.created_by !== undefined) {
      delete row.created_by
      const { data: d2, error: e2 } = await supabase
        .from('metrics_agent_monthly_notes')
        .upsert(row, { onConflict: 'agent_id,metric_month' })
        .select()
        .single()
      if (e2) throw e2
      return d2
    }
    throw error
  }
  return data
}

export async function getAllNotes({ agentId, month } = {}) {
  let query = supabase
    .from('metrics_agent_monthly_notes')
    .select('*, metrics_agents(agent_name)')
    .order('metric_month', { ascending: false })
    .order('agent_id')
  if (agentId) query = query.eq('agent_id', agentId)
  if (month)   query = query.eq('metric_month', toDateParam(month))
  const { data, error } = await query
  if (error) throw error
  return data
}

// ── Attendance (references old tables — may fail if schema changed) ───────────
// These functions reference tables/views from the old schema that may not exist:
//   metrics_cfg_attendance_codes  → getAttendanceCodes()
//   metrics_vw_attendance_monthly → getAttendanceMonthly()
//   metrics_vw_attendance_daily   → getAttendanceDaily()
//   metrics_fact_attendance_daily → upsertAttendance(), deleteAttendance()

export async function getAttendanceCodes() {
  const { data, error } = await supabase
    .from('metrics_cfg_attendance_codes')
    .select('id, code, code_name, category, counts_as_available, counts_as_scheduled, active, display_order')
    .eq('active', true)
    .order('display_order')
  if (error) throw error
  return data
}

export async function getAttendanceMonthly({ month, externalGroupId } = {}) {
  let query = supabase.from('metrics_vw_attendance_monthly').select('*')
  if (month)           query = query.eq('metric_month', toDateParam(month))
  if (externalGroupId) query = query.eq('external_group_id', Number(externalGroupId))
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getAttendanceDaily({ month, agentId, externalGroupId } = {}) {
  let query = supabase.from('metrics_vw_attendance_daily').select('*')
  if (month)           query = query.eq('attendance_month', toDateParam(month))
  if (agentId)         query = query.eq('agent_id', agentId)
  if (externalGroupId) query = query.eq('external_group_id', Number(externalGroupId))
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function upsertAttendance(rows) {
  const { data, error } = await supabase
    .from('metrics_fact_attendance_daily')
    .upsert(rows, { onConflict: 'attendance_date,agent_id' })
    .select()
  if (error) throw error
  return data
}

export async function deleteAttendance({ attendanceDate, agentId }) {
  const { error } = await supabase
    .from('metrics_fact_attendance_daily')
    .delete()
    .eq('attendance_date', attendanceDate)
    .eq('agent_id', agentId)
  if (error) throw error
}
