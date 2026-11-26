-- ============================================================================
-- Migration 0003: Freelance Marketplace (CREATE) Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 5),
  description TEXT NOT NULL CHECK (char_length(trim(description)) >= 20),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  required_skills TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  budget_inr NUMERIC(12, 2) NOT NULL CHECK (budget_inr >= 100),
  payment_type public.payment_type NOT NULL DEFAULT 'fixed',
  deadline TIMESTAMPTZ NOT NULL,
  freelancers_needed INTEGER NOT NULL DEFAULT 1 CHECK (freelancers_needed >= 1 AND freelancers_needed <= 20),
  additional_requirements TEXT DEFAULT '',
  status public.request_status NOT NULL DEFAULT 'OPEN',
  applications_count INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.request_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 15728640),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_message TEXT NOT NULL CHECK (char_length(trim(cover_message)) >= 20),
  relevant_skills TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  portfolio_links TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  proposed_price_inr NUMERIC(12, 2) NOT NULL CHECK (proposed_price_inr >= 100),
  estimated_days INTEGER NOT NULL CHECK (estimated_days >= 1 AND estimated_days <= 365),
  status public.application_status NOT NULL DEFAULT 'pending',
  client_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (request_id, freelancer_id)
);

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE RESTRICT,
  application_id UUID NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  freelancer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  agreed_budget_inr NUMERIC(12, 2) NOT NULL CHECK (agreed_budget_inr >= 100),
  commission_bps INTEGER NOT NULL DEFAULT 500 CHECK (commission_bps >= 0 AND commission_bps <= 3000),
  commission_amount_inr NUMERIC(12, 2) NOT NULL CHECK (commission_amount_inr >= 0),
  freelancer_payout_inr NUMERIC(12, 2) NOT NULL CHECK (freelancer_payout_inr >= 0),
  deadline TIMESTAMPTZ NOT NULL,
  status public.project_status NOT NULL DEFAULT 'ASSIGNED',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  revision_count INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (client_id <> freelancer_id)
);

CREATE TABLE IF NOT EXISTS public.project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount_inr NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_inr >= 0),
  due_date TIMESTAMPTZ,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  summary TEXT NOT NULL CHECK (char_length(trim(summary)) >= 10),
  deliverable_url TEXT,
  storage_path TEXT,
  file_name TEXT,
  file_size_bytes BIGINT,
  status public.deliverable_status NOT NULL DEFAULT 'submitted',
  client_feedback TEXT DEFAULT '',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, reviewer_id),
  CHECK (reviewer_id <> reviewee_id)
);
