-- =============================================================================
-- RailPravah Seed Data Migration
-- Migration: 20260906000002_seed_data.sql
-- Description: Authoritative 13-tier user hierarchy, gang rosters, caution orders, timetable, and sample requests
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. AUTHORITATIVE PROFILES (13-Tier Central Railway Hierarchy)
-- -----------------------------------------------------------------------------
-- Deterministic UUIDs for Railway Hierarchy:
-- COA Admin:
--   a0000000-0000-0000-0000-000000000001 (COA-CR-4891)
-- Civil Hierarchy:
--   c1000000-0000-0000-0000-000000000001 (DPT-CR-5520) - Sr. DEN Civil
--   c1000000-0000-0000-0000-000000000002 (ZON-CR-1102) - CTE Central Zone
--   c1000000-0000-0000-0000-000000000003 (SUP-CR-3104) - SSE P-Way Dadar
--   c1000000-0000-0000-0000-000000000004 (WRK-CR-1001) - Track Maintainer
-- Electrical / TRD Hierarchy:
--   e2000000-0000-0000-0000-000000000001 (DPT-CR-5530) - Sr. DEE TRD
--   e2000000-0000-0000-0000-000000000002 (ZON-CR-1103) - CEE Traction
--   e2000000-0000-0000-0000-000000000003 (SUP-CR-3105) - SSE TRD Kalyan
--   e2000000-0000-0000-0000-000000000004 (WRK-CR-1002) - OHE Linesman
-- Signal & Telecom Hierarchy:
--   d3000000-0000-0000-0000-000000000001 (DPT-CR-5540) - Sr. DSTE
--   d3000000-0000-0000-0000-000000000002 (ZON-CR-1104) - CSTE HQ
--   d3000000-0000-0000-0000-000000000003 (SUP-CR-3106) - SSE Signal CSMT
--   d3000000-0000-0000-0000-000000000004 (WRK-CR-1003) - Signal Maintainer

INSERT INTO profiles (id, email, name, role, department, reports_to)
VALUES
  -- 1. COA Admin (Chief Operations Controller - Apex Authority)
  ('a0000000-0000-0000-0000-000000000001', 'coa-cr-4891@railpravah.gov.in', 'Chief Operations Controller (COA-CR-4891)', 'coa_admin', NULL, NULL),

  -- 2. Civil / P-Way Department Hierarchy
  ('c1000000-0000-0000-0000-000000000001', 'dpt-cr-5520@railpravah.gov.in', 'Dr. Pradeep Verma (Sr. DEN / DPT-CR-5520)', 'department_head', 'civil', 'a0000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000002', 'zon-cr-1102@railpravah.gov.in', 'Virendra K. Meena (CTE / ZON-CR-1102)', 'zonal_head', 'civil', 'c1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000003', 'sup-cr-3104@railpravah.gov.in', 'Rajesh K. Shinde (SSE P-Way / SUP-CR-3104)', 'supervisor', 'civil', 'c1000000-0000-0000-0000-000000000002'),
  ('c1000000-0000-0000-0000-000000000004', 'wrk-cr-1001@railpravah.gov.in', 'Ramesh Pawar (Trackman / WRK-CR-1001)', 'worker', 'civil', 'c1000000-0000-0000-0000-000000000003'),

  -- 3. Electrical / TRD Department Hierarchy
  ('e2000000-0000-0000-0000-000000000001', 'dpt-cr-5530@railpravah.gov.in', 'K. R. Narayanan (Sr. DEE TRD / DPT-CR-5530)', 'department_head', 'electrical', 'a0000000-0000-0000-0000-000000000001'),
  ('e2000000-0000-0000-0000-000000000002', 'zon-cr-1103@railpravah.gov.in', 'A. P. Deshmukh (CEE Traction / ZON-CR-1103)', 'zonal_head', 'electrical', 'e2000000-0000-0000-0000-000000000001'),
  ('e2000000-0000-0000-0000-000000000003', 'sup-cr-3105@railpravah.gov.in', 'Sunil G. Gaikwad (SSE TRD / SUP-CR-3105)', 'supervisor', 'electrical', 'e2000000-0000-0000-0000-000000000002'),
  ('e2000000-0000-0000-0000-000000000004', 'wrk-cr-1002@railpravah.gov.in', 'Suresh Patil (Linesman / WRK-CR-1002)', 'worker', 'electrical', 'e2000000-0000-0000-0000-000000000003'),

  -- 4. Signal & Telecom (S&C) Department Hierarchy
  ('d3000000-0000-0000-0000-000000000001', 'dpt-cr-5540@railpravah.gov.in', 'M. S. Raghavan (Sr. DSTE / DPT-CR-5540)', 'department_head', 'signal_comm', 'a0000000-0000-0000-0000-000000000001'),
  ('d3000000-0000-0000-0000-000000000002', 'zon-cr-1104@railpravah.gov.in', 'R. K. Sharma (CSTE HQ / ZON-CR-1104)', 'zonal_head', 'signal_comm', 'd3000000-0000-0000-0000-000000000001'),
  ('d3000000-0000-0000-0000-000000000003', 'sup-cr-3106@railpravah.gov.in', 'Deepak V. Kulkarni (SSE Signal / SUP-CR-3106)', 'supervisor', 'signal_comm', 'd3000000-0000-0000-0000-000000000002'),
  ('d3000000-0000-0000-0000-000000000004', 'wrk-cr-1003@railpravah.gov.in', 'Santosh Jadhav (Signal Maintainer / WRK-CR-1003)', 'worker', 'signal_comm', 'd3000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  reports_to = EXCLUDED.reports_to;

-- -----------------------------------------------------------------------------
-- 2. SECTION FIELD GROUPS & GANG ROSTERS
-- -----------------------------------------------------------------------------
INSERT INTO section_field_groups (id, gang_code, name, department, section_division, mate_name, mate_contact, total_strength, on_duty_count, beat_location, operational_status, shift_name, roster_members)
VALUES
  (
    'grp-pw-12',
    'GANG-PW-12',
    'Track Group #12 (Dadar - Matunga)',
    'civil',
    'P-Way Dadar Sub-Division (DR - GC)',
    'Vivek Patil (Sr. Mate)',
    '+91 98201 44521',
    10,
    8,
    'Km 9/20 to Km 12/04 (Down Fast & Down Slow)',
    'on_patrol',
    'Morning (06:00 - 14:00)',
    '[
      {"emp_id": "TM-CR-101", "name": "Vivek Patil", "designation": "Track Mate", "status": "On Duty", "contact": "+91 98201 44521"},
      {"emp_id": "TM-CR-102", "name": "Suresh More", "designation": "Keyman", "status": "On Duty", "contact": "+91 98201 44522"},
      {"emp_id": "TM-CR-103", "name": "Ganesh Shinde", "designation": "Trackman-I", "status": "On Duty", "contact": "+91 98201 44523"},
      {"emp_id": "TM-CR-104", "name": "Raju Jadhav", "designation": "Trackman-II", "status": "On Duty", "contact": "+91 98201 44524"},
      {"emp_id": "TM-CR-105", "name": "Dinesh Kamble", "designation": "Trackman-II", "status": "On Duty", "contact": "+91 98201 44525"},
      {"emp_id": "TM-CR-106", "name": "Amol Pawar", "designation": "Trackman-III", "status": "On Duty", "contact": "+91 98201 44526"},
      {"emp_id": "TM-CR-107", "name": "Pradeep Gaikwad", "designation": "Trackman-III", "status": "On Duty", "contact": "+91 98201 44527"},
      {"emp_id": "TM-CR-108", "name": "Kailash Sonawane", "designation": "Trackman-IV", "status": "On Duty", "contact": "+91 98201 44528"}
    ]'::jsonb
  ),
  (
    'grp-pw-14',
    'GANG-PW-14',
    'Track Group #14 (Kurla Junction Yard)',
    'civil',
    'P-Way Kurla Sub-Division (DR - GC)',
    'Anil Gokhale (Head Mate)',
    '+91 98201 88310',
    12,
    10,
    'Points & Crossings 104A/B, 108 (Kurla Fast Yard)',
    'turnout_maintenance',
    'Morning (06:00 - 14:00)',
    '[
      {"emp_id": "TM-CR-111", "name": "Anil Gokhale", "designation": "Track Mate", "status": "On Duty", "contact": "+91 98201 88310"},
      {"emp_id": "TM-CR-112", "name": "Mohan Chavan", "designation": "Keyman", "status": "On Duty", "contact": "+91 98201 88311"},
      {"emp_id": "TM-CR-113", "name": "Sachin Sawant", "designation": "Blacksmith", "status": "On Duty", "contact": "+91 98201 88312"},
      {"emp_id": "TM-CR-114", "name": "Ramesh Kadam", "designation": "Trackman-I", "status": "On Duty", "contact": "+91 98201 88313"},
      {"emp_id": "TM-CR-115", "name": "Sunil Thorat", "designation": "Trackman-II", "status": "On Duty", "contact": "+91 98201 88314"}
    ]'::jsonb
  ),
  (
    'grp-trd-04',
    'GANG-TRD-04',
    'TRD Overhead Group #04 (Kurla - Vidyavihar)',
    'electrical',
    'Traction Distribution Central Line',
    'P. V. Kulkarni (TRD Supervisor)',
    '+91 98202 11980',
    8,
    7,
    'OHE Mast #14/02 to #18/20 (Contact Wire Inspection)',
    'standby',
    'Morning (06:00 - 14:00)',
    '[
      {"emp_id": "EL-CR-201", "name": "P. V. Kulkarni", "designation": "TRD Incharge", "status": "On Duty", "contact": "+91 98202 11980"},
      {"emp_id": "EL-CR-202", "name": "Mahesh Deshmukh", "designation": "Linesman-I", "status": "On Duty", "contact": "+91 98202 11981"},
      {"emp_id": "EL-CR-203", "name": "Sandip Gite", "designation": "Linesman-II", "status": "On Duty", "contact": "+91 98202 11982"},
      {"emp_id": "EL-CR-204", "name": "Rahul Zagade", "designation": "Tower Car Driver", "status": "On Duty", "contact": "+91 98202 11983"}
    ]'::jsonb
  ),
  (
    'grp-st-02',
    'GANG-ST-02',
    'S&T Signal Squad #02 (Byculla - Dadar)',
    'signal_comm',
    'Signal & Telecom Suburban Division',
    'D. M. Nair (Signal Inspector)',
    '+91 98203 77412',
    7,
    6,
    'Auto Signals S-12, S-14 & Point Machine 101/A',
    'on_patrol',
    'Morning (06:00 - 14:00)',
    '[
      {"emp_id": "ST-CR-301", "name": "D. M. Nair", "designation": "Signal Inspector", "status": "On Duty", "contact": "+91 98203 77412"},
      {"emp_id": "ST-CR-302", "name": "Anand Shirodkar", "designation": "Signal Maintainer-I", "status": "On Duty", "contact": "+91 98203 77413"},
      {"emp_id": "ST-CR-303", "name": "Kiran Gurav", "designation": "Telecom Maintainer", "status": "On Duty", "contact": "+91 98203 77414"}
    ]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  gang_code = EXCLUDED.gang_code,
  name = EXCLUDED.name,
  mate_name = EXCLUDED.mate_name,
  beat_location = EXCLUDED.beat_location,
  operational_status = EXCLUDED.operational_status,
  roster_members = EXCLUDED.roster_members;

-- -----------------------------------------------------------------------------
-- 3. CAUTION ORDERS (Speed Restrictions / Safety TSR)
-- -----------------------------------------------------------------------------
INSERT INTO caution_orders (id, order_no, section_location, track_line, imposed_speed, reason, status, department)
VALUES
  (
    'co-dr-402',
    'CO-DR-402',
    'Km 10/18 (Mast #10/24)',
    'Down Slow',
    '30 KMPH',
    'Fishplate bolt elongation & tongue rail check',
    'active',
    'civil'
  ),
  (
    'co-dr-398',
    'CO-DR-398',
    'Km 8/12 (Matunga Curve)',
    'Up Fast',
    '45 KMPH',
    'Cushion deep screening tamp pending',
    'revocation_review',
    'civil'
  ),
  (
    'co-trd-105',
    'CO-TRD-105',
    'Km 15/04 (Kurla Outer)',
    'Down Fast',
    '50 KMPH',
    'Catenary dropper adjustment & isolator inspection',
    'active',
    'electrical'
  )
ON CONFLICT (id) DO UPDATE SET
  order_no = EXCLUDED.order_no,
  section_location = EXCLUDED.section_location,
  track_line = EXCLUDED.track_line,
  imposed_speed = EXCLUDED.imposed_speed,
  reason = EXCLUDED.reason,
  status = EXCLUDED.status;

-- -----------------------------------------------------------------------------
-- 4. TRAIN SCHEDULES (Central Line Suburban Timetable for Simulation)
-- -----------------------------------------------------------------------------
INSERT INTO train_schedules (id, train_no, train_name, service_type, direction, corridor_section, station, line_type, scheduled_slot, origin, destination, frequency_minutes, priority_tier)
VALUES
  ('trn-97001', '97001', 'CSMT – Thane Slow Local', 'slow_local', 'DOWN', 'CSMT – Byculla', 'CSMT', 'Down Slow Line', '05:12', 'CSMT', 'Thane', 6, 3),
  ('trn-97003', '97003', 'CSMT – Kalyan Slow Local', 'slow_local', 'DOWN', 'CSMT – Byculla', 'Byculla', 'Down Slow Line', '06:20', 'CSMT', 'Kalyan', 6, 3),
  ('trn-95301', '95301', 'CSMT – Kalyan Fast Local', 'fast_local', 'DOWN', 'Byculla – Dadar', 'Dadar', 'Down Fast Line', '07:15', 'CSMT', 'Kalyan', 8, 2),
  ('trn-12111', '12111', 'CSMT – Amravati Express', 'mail_express', 'DOWN', 'Byculla – Dadar', 'Dadar', 'Down Fast Line', '08:10', 'CSMT', 'Amravati', 0, 1),
  ('trn-97007', '97007', 'CSMT – Dombivli Slow Local', 'slow_local', 'DOWN', 'Dadar – Kurla', 'Kurla', 'Down Slow Line', '08:35', 'CSMT', 'Dombivli', 5, 3),
  ('trn-95305', '95305', 'CSMT – Badlapur Fast Local', 'fast_local', 'DOWN', 'Dadar – Kurla', 'Kurla', 'Down Fast Line', '08:48', 'CSMT', 'Badlapur', 8, 2),
  ('trn-97011', '97011', 'CSMT – Kalyan Slow Local', 'slow_local', 'DOWN', 'Kurla – Ghatkopar', 'Ghatkopar', 'Down Slow Line', '09:05', 'CSMT', 'Kalyan', 5, 3),
  ('trn-22221', '22221', 'CSMT – NZM Rajdhani Express', 'mail_express', 'DOWN', 'Kurla – Ghatkopar', 'Ghatkopar', 'Down Fast Line', '09:20', 'CSMT', 'Hazrat Nizamuddin', 0, 1),
  ('trn-97015', '97015', 'CSMT – Asangaon Slow Local', 'slow_local', 'DOWN', 'Ghatkopar – Thane', 'Thane', 'Down Slow Line', '09:40', 'CSMT', 'Asangaon', 6, 3),
  ('trn-95309', '95309', 'CSMT – Titwala Fast Local', 'fast_local', 'DOWN', 'Ghatkopar – Thane', 'Thane', 'Down Fast Line', '09:55', 'CSMT', 'Titwala', 8, 2),
  ('trn-97019', '97019', 'CSMT – Kasara Slow Local', 'slow_local', 'DOWN', 'Thane – Kalyan', 'Kalyan', 'Down Slow Line', '10:15', 'CSMT', 'Kasara', 6, 3),
  ('trn-11057', '11057', 'CSMT – Amritsar Express', 'mail_express', 'DOWN', 'Thane – Kalyan', 'Kalyan', 'Down Fast Line', '10:30', 'CSMT', 'Amritsar', 0, 1)
ON CONFLICT (id) DO UPDATE SET
  train_name = EXCLUDED.train_name,
  line_type = EXCLUDED.line_type,
  scheduled_slot = EXCLUDED.scheduled_slot,
  priority_tier = EXCLUDED.priority_tier;

-- -----------------------------------------------------------------------------
-- 5. SAMPLE MULTI-DEPARTMENT SERVICE REQUESTS
-- -----------------------------------------------------------------------------
INSERT INTO service_requests (id, raised_by, department, asset_section, requested_start, requested_end, urgency, description, status)
VALUES
  (
    '00000001-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000002', -- Civil Zonal Head
    'civil',
    'DR – GC (Dadar - Ghatkopar)',
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
    'DR – GC (Dadar - Ghatkopar)',
    NOW() + INTERVAL '1 day' + INTERVAL '1 hour 30 minutes',
    NOW() + INTERVAL '1 day' + INTERVAL '4 hours',
    'medium',
    'OHE contact wire replacement and cantilever bracket overhaul on Section Dadar - Ghatkopar.',
    'pending'
  ),
  (
    '00000001-0000-0000-0000-000000000003',
    'd3000000-0000-0000-0000-000000000002', -- S&T Zonal Head
    'signal_comm',
    'DR – GC (Dadar - Ghatkopar)',
    NOW() + INTERVAL '1 day' + INTERVAL '2 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '3 hours 30 minutes',
    'high',
    'Digital Axle Counter (DAC) sensor calibration and point machine motor testing.',
    'pending'
  )
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6. TRACK STATS (Congestion & Delay Metrics)
-- -----------------------------------------------------------------------------
INSERT INTO track_stats (section, time_period, delay_metrics, congestion_index, average_train_speed)
VALUES
  (
    'DR-GC-DN',
    'last_30_days',
    '{"passenger_trains_delayed": 18, "avg_delay_minutes": 11.2, "total_blocks_granted": 12, "block_efficiency_pct": 94.5}'::jsonb,
    1.42,
    68.5
  ),
  (
    'KYN-TNA-UP',
    'last_30_days',
    '{"passenger_trains_delayed": 24, "avg_delay_minutes": 9.4, "total_blocks_granted": 14, "block_efficiency_pct": 91.0}'::jsonb,
    1.65,
    62.0
  )
ON CONFLICT (section, time_period) DO UPDATE SET
  delay_metrics = EXCLUDED.delay_metrics,
  congestion_index = EXCLUDED.congestion_index,
  average_train_speed = EXCLUDED.average_train_speed;
