-- APT-93: Add supervisor_id to metrics_agents
-- Run this in the Supabase SQL Editor before deploying the UI change.

-- Step 1: Add the column
ALTER TABLE metrics_agents
  ADD COLUMN IF NOT EXISTS supervisor_id integer REFERENCES metrics_agents(id);

-- Step 2: Pre-fill existing agents based on team assignments
-- Lashonda Anema → CRM, RCM, CRM/RCM-PSA teams
UPDATE metrics_agents a
SET supervisor_id = (SELECT id FROM metrics_agents WHERE agent_name = 'Lashonda Anema')
WHERE a.id IN (
  SELECT DISTINCT aga.agent_id
  FROM metrics_agent_group_assignments aga
  JOIN metrics_groups g ON g.id = aga.group_id
  WHERE g.group_name IN ('CRM', 'RCM', 'CRM/RCM-PSA')
)
AND a.role NOT IN ('Supervisor', 'Manager');

-- Letrivia Cotton → Billing team
UPDATE metrics_agents a
SET supervisor_id = (SELECT id FROM metrics_agents WHERE agent_name = 'Letrivia Cotton')
WHERE a.id IN (
  SELECT DISTINCT aga.agent_id
  FROM metrics_agent_group_assignments aga
  JOIN metrics_groups g ON g.id = aga.group_id
  WHERE g.group_name = 'Billing'
)
AND a.role NOT IN ('Supervisor', 'Manager');
