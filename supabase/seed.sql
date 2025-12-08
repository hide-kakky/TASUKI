-- Seed data for TASUKI
-- Based on TASUKI_test_data.md

-- ==========================================
-- 1. Organizations & Stores
-- ==========================================

INSERT INTO public.organizations (id, name, plan) VALUES
  ('613e157e-0000-0000-0000-000000000001', 'Test Restaurant Group', 'pro'),
  ('613e157e-0000-0000-0000-000000000002', 'Sample Corp', 'free')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.stores (id, organization_id, name, timezone) VALUES
  ('713e157e-0000-0000-0000-000000000001', '613e157e-0000-0000-0000-000000000001', 'Ginza Main Store', 'Asia/Tokyo'),
  ('713e157e-0000-0000-0000-000000000002', '613e157e-0000-0000-0000-000000000001', 'Shibuya Store', 'Asia/Tokyo'),
  ('713e157e-0000-0000-0000-000000000003', '613e157e-0000-0000-0000-000000000002', 'Sample Diner', 'Asia/Tokyo')
ON CONFLICT (id) DO NOTHING;

/*
-- ==========================================
-- 2. Users (Mocking auth.users requirement)
-- ==========================================
-- Note: In Supabase Local, we can create users via SQL on auth.users directly or CLI.
-- For simplicity, we assume users will be created via Supabase Studio or CLI.
*/

/*
-- ==========================================
-- 4. Sample Manuals (Published)
-- ==========================================
-- Dependent on Users being present.
*/
