-- ============================================================================
-- Migration 0005: Messaging, Notifications, Payments, Reports, Audit Logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
  participant_one_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_two_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (participant_one_id <> participant_two_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(trim(body)) >= 1),
  attachment_path TEXT,
  attachment_name TEXT,
  attachment_mime TEXT,
  attachment_size BIGINT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link_url TEXT DEFAULT '/dashboard',
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow public.payment_flow NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  prize_id UUID REFERENCES public.prizes(id) ON DELETE SET NULL,
  payer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  gross_amount_inr NUMERIC(12, 2) NOT NULL CHECK (gross_amount_inr >= 0),
  commission_bps INTEGER NOT NULL DEFAULT 0 CHECK (commission_bps >= 0 AND commission_bps <= 3000),
  commission_amount_inr NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (commission_amount_inr >= 0),
  net_amount_inr NUMERIC(12, 2) NOT NULL CHECK (net_amount_inr >= 0),
  currency TEXT NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  settlement_method TEXT NOT NULL DEFAULT 'external_upi_or_bank',
  external_reference TEXT DEFAULT '',
  provider_name TEXT NOT NULL DEFAULT 'manual_record',
  provider_transfer_id TEXT,
  status public.payment_status NOT NULL DEFAULT 'pending',
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_record_id UUID NOT NULL REFERENCES public.payment_records(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  amount_inr NUMERIC(12, 2) NOT NULL CHECK (amount_inr >= 0),
  currency TEXT NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  status public.payment_status NOT NULL DEFAULT 'pending',
  distribution_note TEXT DEFAULT '',
  external_utr TEXT DEFAULT '',
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type public.report_target_type NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (char_length(trim(reason)) >= 5),
  details TEXT DEFAULT '',
  status public.report_status NOT NULL DEFAULT 'open',
  assigned_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_notes TEXT DEFAULT '',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
