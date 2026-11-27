-- ============================================================================
-- Migration 0007: Row Level Security (RLS) Policies & Storage Buckets
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathon_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- platform_settings
-- ----------------------------------------------------------------------------
CREATE POLICY "platform_settings_read_all" ON public.platform_settings
  FOR SELECT USING (TRUE);
CREATE POLICY "platform_settings_admin_update" ON public.platform_settings
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- profiles (never expose raw college_email to non-owners unless admin; UI selects public cols)
-- ----------------------------------------------------------------------------
CREATE POLICY "profiles_public_read_active" ON public.profiles
  FOR SELECT USING (account_status = 'active' OR auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_owner_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (
    (auth.uid() = id AND account_status = (SELECT p.account_status FROM public.profiles p WHERE p.id = auth.uid()))
    OR public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- user_roles
-- ----------------------------------------------------------------------------
CREATE POLICY "user_roles_read_own_or_admin" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "user_roles_admin_manage" ON public.user_roles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- skills & categories
-- ----------------------------------------------------------------------------
CREATE POLICY "skills_read_all" ON public.skills FOR SELECT USING (TRUE);
CREATE POLICY "skills_auth_insert" ON public.skills FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "skills_admin_manage" ON public.skills FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "categories_read_active" ON public.categories FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY "categories_admin_manage" ON public.categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- user_skills
-- ----------------------------------------------------------------------------
CREATE POLICY "user_skills_public_read" ON public.user_skills FOR SELECT USING (TRUE);
CREATE POLICY "user_skills_owner_manage" ON public.user_skills
  FOR ALL USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- ----------------------------------------------------------------------------
-- portfolios & portfolio_media
-- ----------------------------------------------------------------------------
CREATE POLICY "portfolios_public_read" ON public.portfolios FOR SELECT USING (TRUE);
CREATE POLICY "portfolios_owner_manage" ON public.portfolios
  FOR ALL USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "portfolio_media_public_read" ON public.portfolio_media FOR SELECT USING (TRUE);
CREATE POLICY "portfolio_media_owner_manage" ON public.portfolio_media
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid())
    OR public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- requests & request_attachments
-- ----------------------------------------------------------------------------
CREATE POLICY "requests_read_public_or_owner" ON public.requests
  FOR SELECT USING (
    status IN ('OPEN', 'UNDER REVIEW', 'ASSIGNED', 'IN PROGRESS', 'DELIVERED', 'COMPLETED')
    OR auth.uid() = client_id
    OR public.is_admin()
  );
CREATE POLICY "requests_client_insert" ON public.requests
  FOR INSERT WITH CHECK (
    auth.uid() = client_id
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.account_status = 'active')
  );
CREATE POLICY "requests_client_update" ON public.requests
  FOR UPDATE USING (auth.uid() = client_id OR public.is_admin())
  WITH CHECK (auth.uid() = client_id OR public.is_admin());
CREATE POLICY "requests_admin_delete" ON public.requests
  FOR DELETE USING (public.is_admin());

CREATE POLICY "request_attachments_read" ON public.request_attachments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id)
  );
CREATE POLICY "request_attachments_owner_insert" ON public.request_attachments
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id AND r.client_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- applications
-- ----------------------------------------------------------------------------
CREATE POLICY "applications_read_involved" ON public.applications
  FOR SELECT USING (
    auth.uid() = freelancer_id
    OR EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id AND r.client_id = auth.uid())
    OR public.is_admin()
  );
CREATE POLICY "applications_freelancer_insert" ON public.applications
  FOR INSERT WITH CHECK (
    auth.uid() = freelancer_id
    AND EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = request_id AND r.status IN ('OPEN', 'UNDER REVIEW') AND r.client_id <> auth.uid()
    )
  );
CREATE POLICY "applications_update_involved" ON public.applications
  FOR UPDATE USING (
    auth.uid() = freelancer_id
    OR EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id AND r.client_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = freelancer_id
    OR EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id AND r.client_id = auth.uid())
    OR public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- projects, milestones, deliverables, reviews
-- ----------------------------------------------------------------------------
CREATE POLICY "projects_read_participants" ON public.projects
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() = freelancer_id OR public.is_admin());
CREATE POLICY "projects_client_insert" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = client_id OR public.is_admin());
CREATE POLICY "projects_participants_update" ON public.projects
  FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = freelancer_id OR public.is_admin())
  WITH CHECK (auth.uid() = client_id OR auth.uid() = freelancer_id OR public.is_admin());

CREATE POLICY "milestones_read_participants" ON public.project_milestones
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.client_id = auth.uid() OR p.freelancer_id = auth.uid()))
    OR public.is_admin()
  );
CREATE POLICY "milestones_client_manage" ON public.project_milestones
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.client_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.client_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "deliverables_read_participants" ON public.project_deliverables
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.client_id = auth.uid() OR p.freelancer_id = auth.uid()))
    OR public.is_admin()
  );
CREATE POLICY "deliverables_freelancer_insert" ON public.project_deliverables
  FOR INSERT WITH CHECK (
    auth.uid() = submitted_by
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.freelancer_id = auth.uid())
  );
CREATE POLICY "deliverables_client_update" ON public.project_deliverables
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.client_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "reviews_participant_insert" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.status = 'COMPLETED'
        AND ((p.client_id = auth.uid() AND p.freelancer_id = reviewee_id)
          OR (p.freelancer_id = auth.uid() AND p.client_id = reviewee_id))
    )
  );

-- ----------------------------------------------------------------------------
-- hackathons & competition tables
-- ----------------------------------------------------------------------------
CREATE POLICY "hackathons_public_read" ON public.hackathons
  FOR SELECT USING (status <> 'draft' OR organizer_id = auth.uid() OR public.is_admin());
CREATE POLICY "hackathons_organizer_insert" ON public.hackathons
  FOR INSERT WITH CHECK (
    auth.uid() = organizer_id AND (public.has_role('organizer') OR public.is_admin())
  );
CREATE POLICY "hackathons_organizer_update" ON public.hackathons
  FOR UPDATE USING (auth.uid() = organizer_id OR public.is_admin())
  WITH CHECK (auth.uid() = organizer_id OR public.is_admin());

CREATE POLICY "hackathon_rules_read" ON public.hackathon_rules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND (h.status <> 'draft' OR h.organizer_id = auth.uid() OR public.is_admin()))
  );
CREATE POLICY "hackathon_rules_organizer_manage" ON public.hackathon_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND (h.organizer_id = auth.uid() OR public.is_admin()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND (h.organizer_id = auth.uid() OR public.is_admin()))
  );

CREATE POLICY "problem_statements_read" ON public.problem_statements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND (h.status <> 'draft' OR h.organizer_id = auth.uid() OR public.is_admin()))
  );
CREATE POLICY "problem_statements_organizer_manage" ON public.problem_statements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND (h.organizer_id = auth.uid() OR public.is_admin()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND (h.organizer_id = auth.uid() OR public.is_admin()))
  );

CREATE POLICY "announcements_read" ON public.hackathon_announcements FOR SELECT USING (TRUE);
CREATE POLICY "announcements_organizer_manage" ON public.hackathon_announcements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND (h.organizer_id = auth.uid() OR public.is_admin()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND (h.organizer_id = auth.uid() OR public.is_admin()))
  );

CREATE POLICY "registrations_read_own_or_organizer" ON public.registrations
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND h.organizer_id = auth.uid())
    OR public.is_admin()
  );
CREATE POLICY "registrations_user_insert" ON public.registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "registrations_user_update" ON public.registrations
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "teams_read_public_hackathon" ON public.teams FOR SELECT USING (TRUE);
CREATE POLICY "teams_leader_insert" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "teams_leader_or_organizer_update" ON public.teams
  FOR UPDATE USING (
    auth.uid() = leader_id
    OR EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND h.organizer_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "team_members_read_involved_or_organizer" ON public.team_members
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_team_member(team_id)
    OR EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.leader_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND h.organizer_id = auth.uid())
    OR public.is_admin()
  );
CREATE POLICY "team_members_manage" ON public.team_members
  FOR ALL USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.leader_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND h.organizer_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.leader_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND h.organizer_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "submissions_read_team_judges_or_published" ON public.submissions
  FOR SELECT USING (
    public.is_team_member(team_id)
    OR public.is_hackathon_organizer_or_judge(hackathon_id)
    OR EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND h.results_published = TRUE)
  );
CREATE POLICY "submissions_team_write" ON public.submissions
  FOR ALL USING (
    public.is_team_member(team_id)
    OR EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND h.organizer_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    public.is_team_member(team_id)
    OR EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND h.organizer_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "judges_read_organizer_or_self" ON public.judges
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND h.organizer_id = auth.uid())
    OR public.is_admin()
  );
CREATE POLICY "judges_organizer_manage" ON public.judges
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND h.organizer_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND h.organizer_id = auth.uid())
    OR public.is_admin()
  );

-- CRITICAL CONFIDENTIALITY: Normal students CANNOT access evaluations!
CREATE POLICY "evaluations_confidential_read" ON public.evaluations
  FOR SELECT USING (
    auth.uid() = judge_id
    OR EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND h.organizer_id = auth.uid())
    OR public.is_admin()
  );
CREATE POLICY "evaluations_judge_write" ON public.evaluations
  FOR ALL USING (
    (auth.uid() = judge_id AND EXISTS (SELECT 1 FROM public.judges j WHERE j.hackathon_id = hackathon_id AND j.user_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND h.organizer_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    (auth.uid() = judge_id AND EXISTS (SELECT 1 FROM public.judges j WHERE j.hackathon_id = hackathon_id AND j.user_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND h.organizer_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "prizes_public_read" ON public.prizes FOR SELECT USING (TRUE);
CREATE POLICY "prizes_organizer_manage" ON public.prizes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND h.organizer_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.hackathons h WHERE h.id = hackathon_id AND h.organizer_id = auth.uid())
    OR public.is_admin()
  );
CREATE POLICY "prizes_winner_confirm_instructions" ON public.prizes
  FOR UPDATE USING (
    winner_team_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.teams t WHERE t.id = winner_team_id AND t.leader_id = auth.uid())
  )
  WITH CHECK (
    winner_team_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.teams t WHERE t.id = winner_team_id AND t.leader_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- conversations, messages, notifications
-- ----------------------------------------------------------------------------
CREATE POLICY "conversations_participants_read" ON public.conversations
  FOR SELECT USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id OR public.is_admin());
CREATE POLICY "conversations_participants_insert" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

CREATE POLICY "messages_participants_read" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_one_id = auth.uid() OR c.participant_two_id = auth.uid())
    )
    OR public.is_admin()
  );
CREATE POLICY "messages_participants_insert" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_one_id = auth.uid() OR c.participant_two_id = auth.uid())
    )
  );
CREATE POLICY "messages_recipient_mark_read" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_one_id = auth.uid() OR c.participant_two_id = auth.uid())
    )
  );

CREATE POLICY "notifications_owner_read_update" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_owner_update" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_auth_insert" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ----------------------------------------------------------------------------
-- payment_records, payouts, reports, audit_logs
-- ----------------------------------------------------------------------------
CREATE POLICY "payment_records_involved_read" ON public.payment_records
  FOR SELECT USING (auth.uid() = payer_id OR auth.uid() = payee_id OR public.is_admin());
CREATE POLICY "payment_records_admin_manage" ON public.payment_records
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "payouts_involved_read" ON public.payouts
  FOR SELECT USING (auth.uid() = recipient_id OR public.is_admin());
CREATE POLICY "payouts_admin_manage" ON public.payouts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "reports_read_own_or_admin" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id OR public.is_admin());
CREATE POLICY "reports_auth_insert" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_admin_update" ON public.reports
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "audit_logs_admin_read" ON public.audit_logs
  FOR SELECT USING (public.is_admin());
CREATE POLICY "audit_logs_auth_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ----------------------------------------------------------------------------
-- Supabase Storage Buckets & Policies
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('portfolios', 'portfolios', TRUE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('hackathon-banners', 'hackathon-banners', TRUE, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('request-attachments', 'request-attachments', FALSE, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/zip']),
  ('deliverables', 'deliverables', FALSE, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/zip', 'video/mp4']),
  ('submission-decks', 'submission-decks', FALSE, 20971520, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('message-attachments', 'message-attachments', FALSE, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/zip'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_public_read" ON storage.objects
  FOR SELECT USING (bucket_id IN ('avatars', 'portfolios', 'hackathon-banners'));

CREATE POLICY "storage_auth_upload_own_folder" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "storage_owner_delete" ON storage.objects
  FOR DELETE USING (
    auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "storage_private_authenticated_read" ON storage.objects
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND bucket_id IN ('request-attachments', 'deliverables', 'submission-decks', 'message-attachments')
  );
