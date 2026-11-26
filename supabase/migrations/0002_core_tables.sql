-- ============================================================================
-- Migration 0002: Platform Settings, Profiles, Roles, Skills, Categories, Portfolios
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  freelance_commission_bps INTEGER NOT NULL DEFAULT 500 CHECK (freelance_commission_bps >= 0 AND freelance_commission_bps <= 3000),
  currency TEXT NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  freelancer_joining_fee_inr NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (freelancer_joining_fee_inr = 0),
  allowed_college_domains TEXT[] NOT NULL DEFAULT ARRAY['.edu', '.edu.in', '.ac.in'],
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 2),
  username TEXT UNIQUE NOT NULL CHECK (username ~ '^[a-z0-9_]{3,32}$'),
  avatar_url TEXT,
  headline TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  college_or_org TEXT DEFAULT '',
  college_email TEXT,
  college_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  specialization TEXT DEFAULT '',
  city TEXT DEFAULT '',
  country TEXT NOT NULL DEFAULT 'India',
  availability public.availability_status NOT NULL DEFAULT 'available',
  account_status public.account_status NOT NULL DEFAULT 'active',
  is_client_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_freelancer_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  payout_preference_note TEXT DEFAULT '',
  rating_avg NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  completed_projects_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency TEXT NOT NULL DEFAULT 'intermediate' CHECK (proficiency IN ('beginner', 'intermediate', 'advanced', 'expert')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  icon_name TEXT NOT NULL DEFAULT 'Sparkles',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 3),
  description TEXT NOT NULL DEFAULT '',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  video_url TEXT,
  github_url TEXT,
  live_demo_url TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.portfolio_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
