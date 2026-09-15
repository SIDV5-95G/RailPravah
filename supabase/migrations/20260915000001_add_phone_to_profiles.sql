-- -----------------------------------------------------------------------------
-- Migration: Add phone column to profiles table for SMS OTP and contact info
-- -----------------------------------------------------------------------------

ALTER TABLE IF EXISTS profiles
ADD COLUMN IF NOT EXISTS phone TEXT NULL;

-- Update existing mock users with default official contact numbers if null
UPDATE profiles SET phone = '+91 98201 44521' WHERE email ILIKE '%sup-cr-3104%' AND phone IS NULL;
UPDATE profiles SET phone = '+91 97692 31204' WHERE email ILIKE '%wrk-cr-1001%' AND phone IS NULL;
UPDATE profiles SET phone = '+91 98201 44522' WHERE email ILIKE '%zon-cr-1102%' AND phone IS NULL;
UPDATE profiles SET phone = '+91 98201 44523' WHERE email ILIKE '%dpt-cr-5520%' AND phone IS NULL;
UPDATE profiles SET phone = '+91 98201 44520' WHERE email ILIKE '%coa-cr-4891%' AND phone IS NULL;
