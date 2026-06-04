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
      .select('id, agent_name, active, role, hire_date, go_live_date, notes')
      .in('id', ids)
      .order('agent_name')
    if (activeOnly) q = q.eq('active', true)
    const { data, error } = await q
    if (error) throw error
    return data
  }
  let query = supabase
    .from('metrics_agents')
    .select('id, agent_name, active, role, hire_date, go_live_date, notes')
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

// ── Dashboard views ───────────────────────────────────────────────────────────

// One row per agent/month/metric — primary scorecard source
export async function getScorecard({ agentId, month, groupId, agentIds } = {}) {
  let query = supabase.from('metrics_vw_ab_scorecard').select('*')
  if (agentId)          query = query.eq('agent_id', Number(agentId))
  if (month)            query = query.eq('metric_month', toDateParam(month))
  if (groupId)          query = query.eq('group_id', Number(groupId))
  if (agentIds?.length) query = query.in('agent_id', agentIds)
  const { data, error } = await query
  if (error) throw error
  return data
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
  return data
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
  if (error) throw error
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
