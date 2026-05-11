import { supabase } from './supabase'

// Convert YYYY-MM → YYYY-MM-01 for date columns in Postgres
function toDateParam(month) {
  if (!month) return undefined
  return month.length === 7 ? `${month}-01` : month
}

// ── Config / reference data ──────────────────────────────────────────────────

export async function getOrganizations() {
  const { data, error } = await supabase
    .from('metrics_cfg_organizations')
    .select('id, organization_key, organization_name, active, display_order')
    .eq('active', true)
    .order('display_order')
  if (error) throw error
  return data
}

export async function getGroups() {
  const { data, error } = await supabase
    .from('metrics_cfg_external_groups')
    .select('id, group_key, group_name, active, display_order, notes')
    .eq('active', true)
    .order('display_order')
  if (error) throw error
  return data
}

// assignedOnly = true → only active agents with both org and group set (for dashboards)
export async function getAgents(organizationId, externalGroupId, { assignedOnly = true } = {}) {
  let query = supabase
    .from('metrics_cfg_agents')
    .select('id, external_agent_key, zendesk_user_id, agent_name, email, active, hire_date, go_live_date, notes, organization_id, external_group_id')
    .eq('active', true)
    .order('agent_name')
  if (assignedOnly) {
    query = query.not('organization_id', 'is', null).not('external_group_id', 'is', null)
  }
  if (organizationId) query = query.eq('organization_id', organizationId)
  if (externalGroupId) query = query.eq('external_group_id', externalGroupId)
  const { data, error } = await query
  if (error) throw error
  return data
}

// Returns { [groupId]: count } for assigned active agents per group
export async function getAgentCountsByGroup() {
  const { data, error } = await supabase
    .from('metrics_cfg_agents')
    .select('external_group_id')
    .eq('active', true)
    .not('organization_id', 'is', null)
    .not('external_group_id', 'is', null)
  if (error) throw error
  return data.reduce((acc, row) => {
    acc[row.external_group_id] = (acc[row.external_group_id] ?? 0) + 1
    return acc
  }, {})
}

export async function getAttendanceCodes() {
  const { data, error } = await supabase
    .from('metrics_cfg_attendance_codes')
    .select('id, code, code_name, category, counts_as_available, counts_as_scheduled, active, display_order')
    .eq('active', true)
    .order('display_order')
  if (error) throw error
  return data
}

export async function getMetrics() {
  const { data, error } = await supabase
    .from('metrics_cfg_metrics')
    .select('id, metric_key, metric_name, description, unit_type, direction_good, active, display_order, counts_toward_rating, visibility_only, source_behavior')
    .order('display_order')
  if (error) throw error
  return data
}

// ── Performance views ─────────────────────────────────────────────────────────

export async function getAgentScorecard({ agentId, month }) {
  let query = supabase
    .from('metrics_vw_monthly_scorecard')
    .select('*')
  if (agentId) query = query.eq('agent_id', agentId)
  if (month) query = query.eq('metric_month', toDateParam(month))
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getAgentMetricDetail({ agentId, month }) {
  let query = supabase
    .from('metrics_vw_agent_month_detail')
    .select('*')
  if (agentId) query = query.eq('agent_id', agentId)
  if (month) query = query.eq('metric_month', toDateParam(month))
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getLeaderScorecards({ month, organizationId, externalGroupId, agentId }) {
  let query = supabase
    .from('metrics_vw_monthly_scorecard')
    .select('*')
  if (month) query = query.eq('metric_month', toDateParam(month))
  if (organizationId) query = query.eq('organization_id', organizationId)
  if (externalGroupId) query = query.eq('external_group_id', externalGroupId)
  if (agentId) query = query.eq('agent_id', agentId)
  const { data, error } = await query
  if (error) throw error
  return data
}

// ── Attendance ────────────────────────────────────────────────────────────────

export async function getAttendanceMonthly({ month, organizationId, externalGroupId }) {
  let query = supabase
    .from('metrics_vw_attendance_monthly')
    .select('*')
  if (month) query = query.eq('metric_month', toDateParam(month))
  if (organizationId) query = query.eq('organization_id', organizationId)
  if (externalGroupId) query = query.eq('external_group_id', externalGroupId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getAttendanceDaily({ month, agentId, externalGroupId }) {
  let query = supabase
    .from('metrics_vw_attendance_daily')
    .select('*')
  if (month) query = query.eq('attendance_month', toDateParam(month))
  if (agentId) query = query.eq('agent_id', agentId)
  if (externalGroupId) query = query.eq('external_group_id', externalGroupId)
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

// ── Notes ─────────────────────────────────────────────────────────────────────

export async function getAgentMonthNote({ agentId, noteMonth }) {
  const { data, error } = await supabase
    .from('metrics_agent_month_notes')
    .select('*')
    .eq('agent_id', agentId)
    .eq('note_month', toDateParam(noteMonth))
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertAgentMonthNote({ agentId, noteMonth, noteText, createdBy }) {
  const { data, error } = await supabase
    .from('metrics_agent_month_notes')
    .upsert(
      { agent_id: agentId, note_month: toDateParam(noteMonth), note_text: noteText, created_by: createdBy },
      { onConflict: 'agent_id,note_month' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export async function getAllOrganizations() {
  const { data, error } = await supabase
    .from('metrics_cfg_organizations')
    .select('*')
    .order('display_order')
  if (error) throw error
  return data
}

export async function upsertOrganization(row) {
  const { data, error } = await supabase
    .from('metrics_cfg_organizations')
    .upsert(row)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getAllGroups() {
  const { data, error } = await supabase
    .from('metrics_cfg_external_groups')
    .select('id, group_key, group_name, active, display_order, notes')
    .order('display_order')
  if (error) throw error
  return data
}

export async function upsertGroup(row) {
  const { data, error } = await supabase
    .from('metrics_cfg_external_groups')
    .upsert(row)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getAllAgents() {
  const { data, error } = await supabase
    .from('metrics_cfg_agents')
    .select('*, metrics_cfg_organizations(organization_name), metrics_cfg_external_groups(group_name)')
    .order('agent_name')
  if (error) throw error
  return data
}

export async function upsertAgent(row) {
  const { data, error } = await supabase
    .from('metrics_cfg_agents')
    .upsert(row)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getAllMetrics() {
  const { data, error } = await supabase
    .from('metrics_cfg_metrics')
    .select('*')
    .order('display_order')
  if (error) throw error
  return data
}

export async function upsertMetric(row) {
  const { data, error } = await supabase
    .from('metrics_cfg_metrics')
    .upsert(row)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getAllTargets() {
  const { data, error } = await supabase
    .from('metrics_cfg_group_metric_targets')
    .select('*, metrics_cfg_external_groups(group_name), metrics_cfg_metrics(metric_name, unit_type)')
    .order('id')
  if (error) throw error
  return data
}

export async function upsertTarget(row) {
  const { data, error } = await supabase
    .from('metrics_cfg_group_metric_targets')
    .upsert(row)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getAllTolerances() {
  const { data, error } = await supabase
    .from('metrics_cfg_group_metric_tolerances')
    .select('*, metrics_cfg_external_groups(group_name), metrics_cfg_metrics(metric_name, unit_type)')
    .order('id')
  if (error) throw error
  return data
}

export async function upsertTolerance(row) {
  const { data, error } = await supabase
    .from('metrics_cfg_group_metric_tolerances')
    .upsert(row)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getAllAttendanceCodes() {
  const { data, error } = await supabase
    .from('metrics_cfg_attendance_codes')
    .select('*')
    .order('display_order')
  if (error) throw error
  return data
}

export async function upsertAttendanceCode(row) {
  const { data, error } = await supabase
    .from('metrics_cfg_attendance_codes')
    .upsert(row)
    .select()
    .single()
  if (error) throw error
  return data
}
