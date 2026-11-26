-- ============================================================================
-- Migration 0004: Hackathon Ecosystem (COMPETE) Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.hackathons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 4),
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL CHECK (char_length(trim(description)) >= 20),
  banner_url TEXT,
  eligibility TEXT NOT NULL DEFAULT 'Open to college students across India',
  mode TEXT NOT NULL DEFAULT 'hybrid' CHECK (mode IN ('online', 'offline', 'hybrid')),
  venue TEXT DEFAULT 'Campus Innovation Hub & Online',
  min_team_size INTEGER NOT NULL DEFAULT 1 CHECK (min_team_size >= 1),
  max_team_size INTEGER NOT NULL DEFAULT 4 CHECK (max_team_size >= min_team_size AND max_team_size <= 10),
  registration_deadline TIMESTAMPTZ NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  prize_pool_inr NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (prize_pool_inr >= 0),
  funding_source TEXT NOT NULL DEFAULT 'College Organizer / Sponsor',
  status public.hackathon_status NOT NULL DEFAULT 'draft',
  results_published BOOLEAN NOT NULL DEFAULT FALSE,
  allow_late_submission BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date > start_date)
);

CREATE TABLE IF NOT EXISTS public.hackathon_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.problem_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  track TEXT NOT NULL DEFAULT 'General',
  difficulty TEXT NOT NULL DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  expected_deliverables TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hackathon_id, code)
);

CREATE TABLE IF NOT EXISTS public.hackathon_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  leader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_statement_id UUID REFERENCES public.problem_statements(id) ON DELETE SET NULL,
  invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(4), 'hex'),
  late_submission_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hackathon_id, name)
);

CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  registration_type public.registration_type NOT NULL DEFAULT 'individual',
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  college_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hackathon_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.team_member_role NOT NULL DEFAULT 'member',
  invite_status public.team_invite_status NOT NULL DEFAULT 'invited',
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  problem_statement_id UUID REFERENCES public.problem_statements(id) ON DELETE SET NULL,
  submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_title TEXT NOT NULL CHECK (char_length(trim(project_title)) >= 3),
  summary TEXT NOT NULL CHECK (char_length(trim(summary)) >= 20),
  github_url TEXT,
  live_demo_url TEXT,
  deck_storage_path TEXT,
  deck_file_name TEXT,
  status public.submission_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  total_score NUMERIC(6, 2),
  rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hackathon_id, team_id)
);

CREATE TABLE IF NOT EXISTS public.judges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Panel Judge',
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hackathon_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  innovation_score NUMERIC(4, 1) NOT NULL CHECK (innovation_score >= 0 AND innovation_score <= 10),
  execution_score NUMERIC(4, 1) NOT NULL CHECK (execution_score >= 0 AND execution_score <= 10),
  design_score NUMERIC(4, 1) NOT NULL CHECK (design_score >= 0 AND design_score <= 10),
  impact_score NUMERIC(4, 1) NOT NULL CHECK (impact_score >= 0 AND impact_score <= 10),
  total_score NUMERIC(5, 2) GENERATED ALWAYS AS (innovation_score + execution_score + design_score + impact_score) STORED,
  feedback TEXT NOT NULL DEFAULT '',
  is_finalized BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id, judge_id)
);

CREATE TABLE IF NOT EXISTS public.prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
  rank_label TEXT NOT NULL,
  rank_order INTEGER NOT NULL DEFAULT 1,
  amount_inr NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_inr >= 0),
  funding_source TEXT NOT NULL DEFAULT 'College Organizer',
  winner_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  distribution_instructions TEXT DEFAULT '',
  instructions_confirmed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  instructions_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
