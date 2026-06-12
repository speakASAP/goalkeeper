-- GoalKeeper Goal 02 core domain persistence.
-- PostgreSQL migration for intent-first goal, task, execution, IPS, and event records.

CREATE TABLE projects (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  repo_ref text,
  local_path text,
  production_url text,
  staging_url text,
  preferred_executors jsonb NOT NULL DEFAULT '[]'::jsonb,
  command_presets jsonb NOT NULL DEFAULT '{}'::jsonb,
  ips_enabled boolean NOT NULL DEFAULT true,
  ips_root text,
  ips_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  overnight_mode_enabled boolean NOT NULL DEFAULT false,
  concurrency_limit integer NOT NULL DEFAULT 1 CHECK (concurrency_limit > 0),
  status text NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  default_approval_mode text NOT NULL CHECK (default_approval_mode IN ('manual', 'semi_auto')),
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE goals (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  raw_intent text NOT NULL,
  normalized_intent text,
  status text NOT NULL CHECK (status IN (
    'draft',
    'clarifying',
    'intent_ready',
    'intent_approved',
    'planning',
    'awaiting_plan_approval',
    'active',
    'blocked',
    'completed',
    'cancelled'
  )),
  priority integer NOT NULL DEFAULT 0,
  success_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  constraints jsonb NOT NULL DEFAULT '[]'::jsonb,
  non_goals jsonb NOT NULL DEFAULT '[]'::jsonb,
  assumptions jsonb NOT NULL DEFAULT '[]'::jsonb,
  completion_pct integer NOT NULL DEFAULT 0 CHECK (completion_pct >= 0 AND completion_pct <= 100),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

COMMENT ON COLUMN goals.raw_intent IS 'Immutable original owner request. Corrections belong in intent_records.';

CREATE TABLE intent_records (
  id text PRIMARY KEY,
  goal_id text NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('raw', 'summary', 'constraint', 'decision', 'assumption', 'correction', 'retrospective')),
  content text NOT NULL,
  source text NOT NULL CHECK (source IN ('telegram', 'api', 'agent', 'system')),
  actor_id text NOT NULL,
  confidence numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE intent_records IS 'Append-only intent memory. Raw records are never updated; corrections create new rows.';

CREATE TABLE plans (
  id text PRIMARY KEY,
  goal_id text NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  version integer NOT NULL CHECK (version > 0),
  status text NOT NULL CHECK (status IN ('proposed', 'approved', 'rejected', 'superseded')),
  summary text NOT NULL,
  created_by_agent text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  approved_by text,
  UNIQUE (goal_id, version)
);

CREATE UNIQUE INDEX one_approved_plan_per_goal ON plans(goal_id) WHERE status = 'approved';

CREATE TABLE plan_steps (
  id text PRIMARY KEY,
  plan_id text NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  step_index integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  priority integer NOT NULL DEFAULT 0,
  depends_on_step_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  acceptance_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  approval_required boolean NOT NULL DEFAULT false,
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  target_service text,
  tool_requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  preferred_executor_id text,
  UNIQUE (plan_id, step_index)
);

CREATE TABLE executors (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('cli', 'mcp', 'http', 'internal')),
  display_name text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  allowed_project_roots jsonb NOT NULL DEFAULT '[]'::jsonb,
  requires_approval boolean NOT NULL DEFAULT true,
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  command_template text,
  timeout_seconds integer NOT NULL DEFAULT 1800 CHECK (timeout_seconds > 0),
  max_retries integer NOT NULL DEFAULT 0 CHECK (max_retries >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  goal_id text NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  plan_step_id text NOT NULL REFERENCES plan_steps(id) ON DELETE RESTRICT,
  parent_task_id text REFERENCES tasks(id) ON DELETE SET NULL,
  type text NOT NULL,
  status text NOT NULL CHECK (status IN (
    'created',
    'pending_approval',
    'approved',
    'assigned',
    'in_progress',
    'awaiting_user',
    'validation',
    'done',
    'failed',
    'blocked',
    'cancelled'
  )),
  priority integer NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  acceptance_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  depends_on_task_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  approval_required boolean NOT NULL DEFAULT false,
  idempotency_key text NOT NULL UNIQUE,
  assigned_agent_id text,
  selected_executor_id text REFERENCES executors(id) ON DELETE SET NULL,
  routing_reason text,
  ips_gate_status text NOT NULL CHECK (ips_gate_status IN ('not_required', 'pending', 'passed', 'failed', 'blocked')),
  context_package_id text,
  coding_prompt_id text,
  ips_artifact_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  intent_bundle_snapshot jsonb,
  ips_blocker_id text,
  attempt integer NOT NULL DEFAULT 0 CHECK (attempt >= 0),
  max_attempts integer NOT NULL DEFAULT 1 CHECK (max_attempts > 0),
  output jsonb,
  validation_result jsonb,
  blocked_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  CHECK (jsonb_array_length(acceptance_criteria) > 0),
  CHECK (status <> 'done' OR validation_result IS NOT NULL),
  CHECK (
    type NOT IN ('code', 'coding')
    OR (
      ips_gate_status = 'passed'
      AND context_package_id IS NOT NULL
      AND coding_prompt_id IS NOT NULL
      AND jsonb_array_length(ips_artifact_ids) > 0
    )
  )
);

CREATE TABLE ips_artifacts (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  goal_id text NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  task_id text REFERENCES tasks(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN (
    'goal_impact',
    'task_doc',
    'execution_plan',
    'context_package',
    'coding_prompt',
    'validation_report',
    'audit_report'
  )),
  path text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'approved', 'used', 'obsolete', 'failed')),
  approved_by text,
  approved_at timestamptz,
  source text NOT NULL,
  summary text NOT NULL,
  missing_markers jsonb NOT NULL DEFAULT '[]'::jsonb,
  upstream_artifact_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks
  ADD CONSTRAINT tasks_context_package_fk
  FOREIGN KEY (context_package_id) REFERENCES ips_artifacts(id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_coding_prompt_fk
  FOREIGN KEY (coding_prompt_id) REFERENCES ips_artifacts(id) DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE blockers (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  goal_id text REFERENCES goals(id) ON DELETE CASCADE,
  task_id text REFERENCES tasks(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'needs_user_answer',
    'ips_gate_failed',
    'approval_required',
    'executor_failed',
    'validation_failed',
    'deployment_approval_required'
  )),
  question text,
  reason text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendation text,
  impact text NOT NULL,
  status text NOT NULL CHECK (status IN ('open', 'answered', 'resolved', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE tasks
  ADD CONSTRAINT tasks_ips_blocker_fk
  FOREIGN KEY (ips_blocker_id) REFERENCES blockers(id) DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE executions (
  id text PRIMARY KEY,
  task_id text NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  executor_id text NOT NULL REFERENCES executors(id) ON DELETE RESTRICT,
  executor_kind text NOT NULL CHECK (executor_kind IN ('cli', 'mcp', 'http', 'internal')),
  command text,
  cwd text,
  status text NOT NULL CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled', 'timed_out')),
  started_at timestamptz,
  ended_at timestamptz,
  duration_ms integer CHECK (duration_ms IS NULL OR duration_ms >= 0),
  exit_code integer,
  stdout_ref text,
  stderr_ref text,
  artifact_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  token_usage jsonb,
  cost_estimate numeric,
  summary text
);

COMMENT ON TABLE executions IS 'Append-only executor attempts. Do not update historical run evidence.';

CREATE TABLE overnight_reports (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  completed_tasks jsonb NOT NULL DEFAULT '[]'::jsonb,
  failed_tasks jsonb NOT NULL DEFAULT '[]'::jsonb,
  blocked_tasks jsonb NOT NULL DEFAULT '[]'::jsonb,
  partial_tasks jsonb NOT NULL DEFAULT '[]'::jsonb,
  questions_for_owner jsonb NOT NULL DEFAULT '[]'::jsonb,
  validation_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE decisions (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  goal_id text REFERENCES goals(id) ON DELETE CASCADE,
  task_id text REFERENCES tasks(id) ON DELETE CASCADE,
  decision_type text NOT NULL,
  question text,
  answer text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  chosen_option text,
  actor_id text NOT NULL,
  source text NOT NULL CHECK (source IN ('telegram', 'api', 'agent', 'system')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE events (
  id text PRIMARY KEY,
  type text NOT NULL,
  project_id text REFERENCES projects(id) ON DELETE CASCADE,
  goal_id text REFERENCES goals(id) ON DELETE CASCADE,
  task_id text REFERENCES tasks(id) ON DELETE CASCADE,
  actor text NOT NULL,
  source text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE events IS 'Append-only audit log for lifecycle transitions and system history.';

CREATE INDEX goals_project_status_idx ON goals(project_id, status);
CREATE INDEX tasks_project_status_idx ON tasks(project_id, status);
CREATE INDEX tasks_goal_status_idx ON tasks(goal_id, status);
CREATE INDEX executions_task_status_idx ON executions(task_id, status);
CREATE INDEX events_goal_created_idx ON events(goal_id, created_at);
CREATE INDEX events_task_created_idx ON events(task_id, created_at);
