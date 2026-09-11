-- =============================================================================
-- RailPravah Seed Data Migration
-- Migration: 20260906000002_seed_data.sql
-- Description: 13 hierarchical users (3 depts x 4 roles + 1 COA Admin), sample requests & stats
-- =============================================================================

-- Deterministic UUIDs for testing and consistent reference
-- Civil Hierarchy
-- Dept Head:  c1000000-0000-0000-0000-000000000001
-- Zonal Head: c1000000-0000-0000-0000-000000000002
-- Supervisor: c1000000-0000-0000-0000-000000000003
-- Worker:     c1000000-0000-0000-0000-000000000004

-- Electrical Hierarchy
-- Dept Head:  e2000000-0000-0000-0000-000000000001
-- Zonal Head: e2000000-0000-0000-0000-000000000002
-- Supervisor: e2000000-0000-0000-0000-000000000003
-- Worker:     e2000000-0000-0000-0000-000000000004

-- S&T Hierarchy
-- Dept Head:  s3000000-0000-0000-0000-000000000001
-- Zonal Head: s3000000-0000-0000-0000-000000000002
-- Supervisor: s3000000-0000-0000-0000-000000000003
-- Worker:     s3000000-0000-0000-0000-000000000004

-- COA Admin
-- a0000000-0000-0000-0000-000000000001

-- 1. Insert Profiles (Upsert if exists)
INSERT INTO profiles (id, email, name, role, department, reports_to)
VALUES
  -- COA Admin (Central Operating Admin - Department Agnostic)
  ('a0000000-0000-0000-0000-000000000001', 'coa.admin@railpravah.gov.in', 'Rajesh Sharma (COA Admin)', 'coa_admin', NULL, NULL),

  -- Civil Department Chain
  ('c1000000-0000-0000-0000-000000000001', 'civil.pce@railpravah.gov.in', 'Vikramaditya Rao (Civil Dept Head / PCE)', 'department_head', 'civil', NULL),
  ('c1000000-0000-0000-0000-000000000002', 'civil.zonal@railpravah.gov.in', 'Amitabh Sengupta (Civil Zonal Head / SrDEN)', 'zonal_head', 'civil', 'c1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000003', 'civil.sup@railpravah.gov.in', 'Ramesh Yadav (Civil Supervisor / SSE Track)', 'supervisor', 'civil', 'c1000000-0000-0000-0000-000000000002'),
  ('c1000000-0000-0000-0000-000000000004', 'civil.worker@railpravah.gov.in', 'Manoj Kumar (Civil Trackman)', 'worker', 'civil', 'c1000000-0000-0000-0000-000000000003'),

  -- Electrical Department Chain
  ('e2000000-0000-0000-0000-000000000001', 'elec.pcee@railpravah.gov.in', 'Sunil Deshmukh (Electrical Dept Head / PCEE)', 'department_head', 'electrical', NULL),
  ('e2000000-0000-0000-0000-000000000002', 'elec.zonal@railpravah.gov.in', 'Praveen Nair (Electrical Zonal Head / SrDEE)', 'zonal_head', 'electrical', 'e2000000-0000-0000-0000-000000000001'),
  ('e2000000-0000-0000-0000-000000000003', 'elec.sup@railpravah.gov.in', 'Kishore Patil (Electrical Supervisor / SSE TRD)', 'supervisor', 'electrical', 'e2000000-0000-0000-0000-000000000002'),
  ('e2000000-0000-0000-0000-000000000004', 'elec.worker@railpravah.gov.in', 'Dinesh Verma (Electrical Lineman)', 'worker', 'electrical', 'e2000000-0000-0000-0000-000000000003'),

  -- Signal & Telecom (S&C) Department Chain
  ('s3000000-0000-0000-0000-000000000001', 'st.pcste@railpravah.gov.in', 'Harish Chandra (S&T Dept Head / PCSTE)', 'department_head', 'signal_comm', NULL),
  ('s3000000-0000-0000-0000-000000000002', 'st.zonal@railpravah.gov.in', 'Anand Kulkarni (S&T Zonal Head / SrDSTE)', 'zonal_head', 'signal_comm', 's3000000-0000-0000-0000-000000000001'),
  ('s3000000-0000-0000-0000-000000000003', 'st.sup@railpravah.gov.in', 'Sanjay Bhatt (S&T Supervisor / SSE Signal)', 'supervisor', 'signal_comm', 's3000000-0000-0000-0000-000000000002'),
  ('s3000000-0000-0000-0000-000000000004', 'st.worker@railpravah.gov.in', 'Gopal Tiwari (S&T Signal Maintainer)', 'worker', 'signal_comm', 's3000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  reports_to = EXCLUDED.reports_to;

-- 2. Seed Sample Overlapping Service Requests for Testing Optimizer
INSERT INTO service_requests (id, raised_by, department, asset_section, requested_start, requested_end, urgency, description, status)
VALUES
  (
    '00000001-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000002', -- Civil Zonal Head
    'civil',
    'NDLS-GZB-DN',
    NOW() + INTERVAL '1 day' + INTERVAL '1 hour',
    NOW() + INTERVAL '1 day' + INTERVAL '4 hours',
    'high',
    'Deep screening and ballast packing on Down main line KM 12/4 to 14/8.',
    'pending'
  ),
  (
    '00000001-0000-0000-0000-000000000002',
    'e2000000-0000-0000-0000-000000000002', -- Electrical Zonal Head
    'electrical',
    'NDLS-GZB-DN',
    NOW() + INTERVAL '1 day' + INTERVAL '1 hour 30 minutes',
    NOW() + INTERVAL '1 day' + INTERVAL '4 hours 30 minutes',
    'medium',
    'OHE contact wire replacement and cantilever bracket overhaul on Section NDLS-GZB.',
    'pending'
  ),
  (
    '00000001-0000-0000-0000-000000000003',
    's3000000-0000-0000-0000-000000000002', -- S&T Zonal Head
    'signal_comm',
    'NDLS-GZB-DN',
    NOW() + INTERVAL '1 day' + INTERVAL '2 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '3 hours 30 minutes',
    'high',
    'Digital Axle Counter (DAC) sensor calibration and point machine motor testing.',
    'pending'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Sample Track Stats
INSERT INTO track_stats (section, time_period, delay_metrics, congestion_index, average_train_speed)
VALUES
  (
    'NDLS-GZB-DN',
    'last_30_days',
    '{"passenger_trains_delayed": 14, "avg_delay_minutes": 12.4, "total_blocks_granted": 8, "block_efficiency_pct": 92.1}'::jsonb,
    1.45,
    72.5
  ),
  (
    'BCT-VR-UP',
    'last_30_days',
    '{"passenger_trains_delayed": 28, "avg_delay_minutes": 8.7, "total_blocks_granted": 15, "block_efficiency_pct": 88.6}'::jsonb,
    1.82,
    58.0
  )
ON CONFLICT (section, time_period) DO UPDATE SET
  delay_metrics = EXCLUDED.delay_metrics,
  congestion_index = EXCLUDED.congestion_index,
  average_train_speed = EXCLUDED.average_train_speed;
