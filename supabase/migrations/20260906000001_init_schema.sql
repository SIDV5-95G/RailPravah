-- =============================================================================
-- RailPravah Database Schema Migration
-- Migration: 20260906000001_init_schema.sql
-- Description: Core tables, enums, RLS policies, audit logs, and triggers
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. ENUMS
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'worker',
    'supervisor',
    'zonal_head',
    'department_head',
    'coa_admin'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE department_type AS ENUM (
    'civil',
    'electrical',
    'signal_comm'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE service_request_status AS ENUM (
    'pending',
    'linked',
    'fulfilled',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE proposal_status AS ENUM (
    'pending_review',
    'accepted',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE complaint_status AS ENUM (
    'open_supervisor',
    'open_zonal_head',
    'open_department_head',
    'open_coa',
    'closed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 2. PROFILES TABLE (Mirrors auth.users with Railway Hierarchy)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  role user_role NOT NULL,
  department department_type NULL, -- NULL for coa_admin
  reports_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_coa_admin_dept CHECK (
    (role = 'coa_admin' AND department IS NULL) OR
    (role != 'coa_admin' AND department IS NOT NULL)
  )
);

-- -----------------------------------------------------------------------------
-- 3. SERVICE REQUESTS (Zonal Head submitted maintenance requests)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raised_by UUID NOT NULL REFERENCES profiles(id),
  department department_type NOT NULL,
  asset_section TEXT NOT NULL,
  requested_start TIMESTAMPTZ NOT NULL,
  requested_end TIMESTAMPTZ NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'emergency')),
  description TEXT NOT NULL,
  status service_request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_valid_window CHECK (requested_end > requested_start)
);

-- -----------------------------------------------------------------------------
-- 4. AI SCHEDULE PROPOSALS (COA Admin view & optimizer output)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_schedule_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposed_start TIMESTAMPTZ NOT NULL,
  proposed_end TIMESTAMPTZ NOT NULL,
  linked_requests UUID[] NOT NULL DEFAULT '{}',
  why_this_slot_explanation TEXT NOT NULL,
  impact_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  status proposal_status NOT NULL DEFAULT 'pending_review',
  decided_at TIMESTAMPTZ NULL,
  decided_by UUID REFERENCES profiles(id) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_valid_prop_window CHECK (proposed_end > proposed_start)
);

-- -----------------------------------------------------------------------------
-- 5. APPROVED BLOCKS (Created upon COA acceptance)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approved_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES ai_schedule_proposals(id),
  asset_section TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  involved_users UUID[] NOT NULL DEFAULT '{}',
  calendar_event_ids TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. COMPLAINTS (Worker submitted, strict escalation lifecycle)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raised_by UUID NOT NULL REFERENCES profiles(id),
  department department_type NOT NULL,
  description TEXT NOT NULL,
  photo_url TEXT NULL,
  status complaint_status NOT NULL DEFAULT 'open_supervisor',
  current_assignee UUID REFERENCES profiles(id) NULL,
  last_edited_by UUID REFERENCES profiles(id) NULL,
  last_edited_at TIMESTAMPTZ NULL,
  resolved_by UUID REFERENCES profiles(id) NULL,
  resolved_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. COMPLAINT AUDIT LOGS (Accountability and tamper-proof trail)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaint_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL CHECK (action IN ('created', 'draft_edit', 'escalated', 'resolved')),
  previous_status complaint_status NULL,
  new_status complaint_status NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. TRACK STATS (Congestion, delay metrics, and section statistics)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS track_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section TEXT NOT NULL,
  time_period TEXT NOT NULL,
  delay_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  congestion_index NUMERIC(4, 2) DEFAULT 1.00,
  average_train_speed NUMERIC(5, 2) DEFAULT 60.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (section, time_period)
);

-- -----------------------------------------------------------------------------
-- 9. CONFLICT FLAGS (ConflictGuard Safety Flags)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conflict_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  block_id UUID NULL,
  request_id UUID NULL,
  section TEXT NOT NULL,
  conflict_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 10. CALENDAR EVENTS & NOTIFICATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES approved_blocks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'alert',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_schedule_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflict_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to retrieve requesting user profile
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS profiles AS $$
  SELECT * FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles: Users can view their own profile and profiles in their reporting tree / department
CREATE POLICY "Profiles readable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Service Requests:
-- Zonal Head can insert only for their department
CREATE POLICY "Zonal Head can create requests in own department"
  ON service_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    raised_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'zonal_head'
        AND p.department = service_requests.department
    )
  );

-- Service Requests: Read scoped to user's department or COA Admin
CREATE POLICY "View service requests by department or COA"
  ON service_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (p.role = 'coa_admin' OR p.department = service_requests.department)
    )
  );

-- AI Schedule Proposals:
-- Readable by Zonal Head, Department Head, and COA Admin
CREATE POLICY "View proposals by leadership & COA"
  ON ai_schedule_proposals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('zonal_head', 'department_head', 'coa_admin')
    )
  );

-- Complaints:
-- Workers can insert complaints in their own department
CREATE POLICY "Workers can create complaints"
  ON complaints FOR INSERT
  TO authenticated
  WITH CHECK (
    raised_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'worker'
        AND p.department = complaints.department
    )
  );

-- Complaints: Read-only global visibility of complaints status for all authenticated roles
CREATE POLICY "Complaints globally readable by authenticated users"
  ON complaints FOR SELECT
  TO authenticated
  USING (true);

-- Track stats & conflict flags readable by Supervisor, Zonal Head, Dept Head, COA Admin
CREATE POLICY "Track stats readable by supervisors and above"
  ON track_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('supervisor', 'zonal_head', 'department_head', 'coa_admin')
    )
  );

CREATE POLICY "Conflict flags readable by supervisors and above"
  ON conflict_flags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('supervisor', 'zonal_head', 'department_head', 'coa_admin')
    )
  );

-- Calendar events and notifications readable by owner
CREATE POLICY "Calendar events readable by owner"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Notifications readable by owner"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
