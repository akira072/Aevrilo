-- ============================================================================
-- [DEMO ONLY] Optional Sample Dataset for Aevrilo Local Evaluation
-- DO NOT run in production unless you explicitly want sample demo accounts.
-- Every record below is clearly marked [DEMO] so it is distinguishable from live data.
-- ============================================================================

-- Note: Because profiles.id references auth.users(id), create demo auth users first
-- via Supabase Auth Admin API or the `npm run seed:demo` script in `scripts/seed-demo.mjs`
-- (which creates real auth.users records using SUPABASE_SERVICE_ROLE_KEY and populates
-- sample profiles, portfolios, requests, applications, projects, and a hackathon).
--
-- Running `scripts/seed-demo.mjs` is recommended instead of raw SQL inserts into auth.users.
SELECT 'Run `node scripts/seed-demo.mjs` with SUPABASE_SERVICE_ROLE_KEY set to populate clearly labeled [DEMO] records.' AS instruction;
