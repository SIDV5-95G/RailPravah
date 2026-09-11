-- Migration: Create train_schedules table for What-If timetable intelligence
CREATE TABLE IF NOT EXISTS public.train_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Indices for rapid spatial-temporal querying during What-If simulation
CREATE INDEX IF NOT EXISTS idx_train_schedules_section ON public.train_schedules(corridor_section);
CREATE INDEX IF NOT EXISTS idx_train_schedules_station ON public.train_schedules(station);
CREATE INDEX IF NOT EXISTS idx_train_schedules_slot ON public.train_schedules(scheduled_slot);
CREATE INDEX IF NOT EXISTS idx_train_schedules_line ON public.train_schedules(line_type);
