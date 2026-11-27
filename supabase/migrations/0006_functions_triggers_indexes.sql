-- ============================================================================
-- Migration 0006: Security Helper Functions, Triggers & Performance Indexes
-- ============================================================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Helper: check if current authenticated user holds a specific role
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role('admin');
$$;

CREATE OR REPLACE FUNCTION public.is_hackathon_organizer_or_judge(_hackathon_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.hackathons h
    WHERE h.id = _hackathon_id AND h.organizer_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.judges j
    WHERE j.hackathon_id = _hackathon_id AND j.user_id = auth.uid()
  )
  OR public.is_admin();
$$;

CREATE OR REPLACE FUNCTION public.is_team_member(_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = _team_id
      AND tm.user_id = auth.uid()
      AND tm.invite_status = 'accepted'
  );
$$;

-- Trigger: Provision profile and default dual roles (client + freelancer) on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  raw_name TEXT;
  user_email TEXT;
  is_college BOOLEAN := FALSE;
BEGIN
  user_email := COALESCE(NEW.email, '');
  raw_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''), split_part(user_email, '@', 1), 'Aevrilo Creator');
  base_username := lower(regexp_replace(split_part(user_email, '@', 1), '[^a-z0-9_]', '_', 'g'));
  IF char_length(base_username) < 3 THEN
    base_username := 'user_' || substr(replace(NEW.id::TEXT, '-', ''), 1, 8);
  END IF;
  final_username := left(base_username, 22) || '_' || substr(replace(NEW.id::TEXT, '-', ''), 1, 6);

  IF user_email ~* '\.(edu|edu\.in|ac\.in)$' THEN
    is_college := TRUE;
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    username,
    college_email,
    college_email_verified,
    college_or_org
  ) VALUES (
    NEW.id,
    raw_name,
    final_username,
    CASE WHEN is_college THEN user_email ELSE NULLIF(NEW.raw_user_meta_data->>'college_email', '') END,
    CASE WHEN is_college AND NEW.email_confirmed_at IS NOT NULL THEN TRUE ELSE FALSE END,
    COALESCE(NEW.raw_user_meta_data->>'college_or_org', '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client'), (NEW.id, 'freelancer')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Update request applications_count automatically
CREATE OR REPLACE FUNCTION public.sync_request_applications_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.requests SET applications_count = applications_count + 1 WHERE id = NEW.request_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.requests SET applications_count = GREATEST(0, applications_count - 1) WHERE id = OLD.request_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_applications_count ON public.applications;
CREATE TRIGGER trg_applications_count
  AFTER INSERT OR DELETE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.sync_request_applications_count();

-- Trigger: Update reviewee rating average and reviews_count
CREATE OR REPLACE FUNCTION public.sync_profile_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    rating_avg = COALESCE((SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM public.reviews WHERE reviewee_id = NEW.reviewee_id), 0.00),
    reviews_count = (SELECT COUNT(*) FROM public.reviews WHERE reviewee_id = NEW.reviewee_id)
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_rating ON public.reviews;
CREATE TRIGGER trg_sync_profile_rating
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_rating();

-- Attach updated_at triggers
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles', 'portfolios', 'requests', 'applications', 'projects',
    'hackathons', 'teams', 'submissions', 'evaluations', 'payment_records', 'reports'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();', tbl, tbl);
  END LOOP;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_availability ON public.profiles(availability) WHERE account_status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_user ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status_created ON public.requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_category ON public.requests(category_id);
CREATE INDEX IF NOT EXISTS idx_requests_client ON public.requests(client_id);
CREATE INDEX IF NOT EXISTS idx_applications_request ON public.applications(request_id);
CREATE INDEX IF NOT EXISTS idx_applications_freelancer ON public.applications(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_freelancer ON public.projects(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_hackathons_status_start ON public.hackathons(status, start_date);
CREATE INDEX IF NOT EXISTS idx_registrations_hackathon ON public.registrations(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_hackathon ON public.submissions(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_submission ON public.evaluations(submission_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_records_payee ON public.payment_records(payee_id, status);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
