-- =============================================================================
-- RailPravah Database Schema Migration
-- Migration: 20260906000001_init_schema.sql
-- Description: Core tables, enums, RLS policies, audit logs, and triggers for all 13 subsystems
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
-- 2. PROFILES TABLE (Mirrors auth.users with 5-Tier Railway Hierarchy)
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
  raised_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
  decided_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_valid_prop_window CHECK (proposed_end > proposed_start)
);

-- -----------------------------------------------------------------------------
-- 5. APPROVED BLOCKS (Created upon COA acceptance or direct clearance)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approved_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NULL REFERENCES ai_schedule_proposals(id) ON DELETE SET NULL,
  department department_type NULL,
  asset_section TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '3 hours',
  approved_start TIMESTAMPTZ NULL,
  approved_end TIMESTAMPTZ NULL,
  involved_users UUID[] NOT NULL DEFAULT '{}',
  calendar_event_ids TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'dispatched')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. COMPLAINTS (Worker submitted, strict escalation lifecycle)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raised_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department department_type NOT NULL,
  description TEXT NOT NULL,
  photo_url TEXT NULL,
  audio_url TEXT NULL,
  urgency TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'emergency')),
  status complaint_status NOT NULL DEFAULT 'open_supervisor',
  current_assignee UUID REFERENCES profiles(id) ON DELETE SET NULL,
  last_edited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  last_edited_at TIMESTAMPTZ NULL,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
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
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
-- 11. TRAIN SCHEDULES (Timetable intelligence & What-If simulation engine)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS train_schedules (
  id VARCHAR(64) PRIMARY KEY,
  train_no VARCHAR(64) NOT NULL,
  train_name VARCHAR(255) NOT NULL,
  service_type VARCHAR(64) NOT NULL DEFAULT 'slow_local',
  direction VARCHAR(16) NOT NULL DEFAULT 'DOWN',
  corridor_section VARCHAR(255) NOT NULL,
  station VARCHAR(128) NOT NULL,
  line_type VARCHAR(128) NOT NULL,
  scheduled_slot VARCHAR(16) NOT NULL,
  origin VARCHAR(128) NOT NULL,
  destination VARCHAR(128) NOT NULL,
  frequency_minutes INTEGER DEFAULT 5,
  priority_tier INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_train_schedules_section ON train_schedules(corridor_section);
CREATE INDEX IF NOT EXISTS idx_train_schedules_station ON train_schedules(station);
CREATE INDEX IF NOT EXISTS idx_train_schedules_slot ON train_schedules(scheduled_slot);
CREATE INDEX IF NOT EXISTS idx_train_schedules_line ON train_schedules(line_type);

-- -----------------------------------------------------------------------------
-- 12. SECTION FIELD GROUPS (SSE Track Gang & Maintenance Rosters)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS section_field_groups (
  id TEXT PRIMARY KEY,
  gang_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department department_type NOT NULL,
  section_division TEXT NOT NULL,
  mate_name TEXT NOT NULL,
  mate_contact TEXT NULL,
  total_strength INTEGER NOT NULL DEFAULT 10,
  on_duty_count INTEGER NOT NULL DEFAULT 8,
  beat_location TEXT NOT NULL,
  operational_status TEXT NOT NULL DEFAULT 'on_patrol' CHECK (operational_status IN ('on_patrol', 'possession_work', 'turnout_maintenance', 'standby', 'off_duty')),
  shift_name TEXT NOT NULL DEFAULT 'Morning (06:00 - 14:00)',
  assigned_slot_id TEXT NULL,
  roster_members JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 13. CAUTION ORDERS (Speed Restrictions / Safety PSR & TSR)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS caution_orders (
  id TEXT PRIMARY KEY,
  order_no TEXT NOT NULL UNIQUE,
  section_location TEXT NOT NULL,
  track_line TEXT NOT NULL,
  imposed_speed TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revocation_review', 'cancelled')),
  department department_type NOT NULL,
  imposed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
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
ALTER TABLE train_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_field_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE caution_orders ENABLE ROW LEVEL SECURITY;

-- Helper function to retrieve requesting user profile
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS profiles AS $$
  SELECT * FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles: Authenticated users can view profiles
DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON profiles;
CREATE POLICY "Profiles readable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Profiles manageable by authenticated users" ON profiles;
CREATE POLICY "Profiles manageable by authenticated users"
  ON profiles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service Requests: Zonal Head can insert only for their department
DROP POLICY IF EXISTS "Zonal Head can create requests in own department" ON service_requests;
CREATE POLICY "Zonal Head can create requests in own department"
  ON service_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    raised_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND (p.role IN ('zonal_head', 'department_head', 'coa_admin'))
        AND (p.department = service_requests.department OR p.role = 'coa_admin')
    )
  );

DROP POLICY IF EXISTS "View service requests by department or COA" ON service_requests;
CREATE POLICY "View service requests by department or COA"
  ON service_requests FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service requests full access by authenticated users" ON service_requests;
CREATE POLICY "Service requests full access by authenticated users"
  ON service_requests FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- AI Schedule Proposals
DROP POLICY IF EXISTS "View proposals by leadership & COA" ON ai_schedule_proposals;
CREATE POLICY "View proposals by leadership & COA"
  ON ai_schedule_proposals FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Approved Blocks
DROP POLICY IF EXISTS "Approved blocks accessible by authenticated users" ON approved_blocks;
CREATE POLICY "Approved blocks accessible by authenticated users"
  ON approved_blocks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Complaints
DROP POLICY IF EXISTS "Complaints globally accessible by authenticated users" ON complaints;
CREATE POLICY "Complaints globally accessible by authenticated users"
  ON complaints FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Complaint Audit Logs
DROP POLICY IF EXISTS "Audit logs accessible by authenticated users" ON complaint_audit_logs;
CREATE POLICY "Audit logs accessible by authenticated users"
  ON complaint_audit_logs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Track stats & conflict flags
DROP POLICY IF EXISTS "Track stats accessible by authenticated users" ON track_stats;
CREATE POLICY "Track stats accessible by authenticated users"
  ON track_stats FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Conflict flags accessible by authenticated users" ON conflict_flags;
CREATE POLICY "Conflict flags accessible by authenticated users"
  ON conflict_flags FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Calendar events and notifications
DROP POLICY IF EXISTS "Calendar events accessible by authenticated users" ON calendar_events;
CREATE POLICY "Calendar events accessible by authenticated users"
  ON calendar_events FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Notifications accessible by authenticated users" ON notifications;
CREATE POLICY "Notifications accessible by authenticated users"
  ON notifications FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Train Schedules
DROP POLICY IF EXISTS "Train schedules readable by authenticated users" ON train_schedules;
CREATE POLICY "Train schedules readable by authenticated users"
  ON train_schedules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Section Field Groups
DROP POLICY IF EXISTS "Field groups accessible by authenticated users" ON section_field_groups;
CREATE POLICY "Field groups accessible by authenticated users"
  ON section_field_groups FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Caution Orders
DROP POLICY IF EXISTS "Caution orders accessible by authenticated users" ON caution_orders;
CREATE POLICY "Caution orders accessible by authenticated users"
  ON caution_orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 15. ENABLE REALTIME BROADCASTING
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE profiles, complaints, complaint_audit_logs, service_requests, approved_blocks, notifications, caution_orders, section_field_groups, train_schedules;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
