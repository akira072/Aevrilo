-- ============================================================================
-- Migration 0001: Extensions and Domain Enums
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('client', 'freelancer', 'organizer', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.account_status AS ENUM ('active', 'suspended', 'restricted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.availability_status AS ENUM ('available', 'busy', 'unavailable');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_type AS ENUM ('fixed', 'milestone', 'hourly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.request_status AS ENUM (
    'OPEN',
    'UNDER REVIEW',
    'ASSIGNED',
    'IN PROGRESS',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
    'DISPUTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.application_status AS ENUM (
    'pending',
    'shortlisted',
    'accepted',
    'rejected',
    'withdrawn'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.project_status AS ENUM (
    'ASSIGNED',
    'IN PROGRESS',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
    'DISPUTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.deliverable_status AS ENUM (
    'submitted',
    'revision_requested',
    'approved'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'processing',
    'successful',
    'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_flow AS ENUM (
    'freelance_project',
    'hackathon_prize'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.hackathon_status AS ENUM (
    'draft',
    'published',
    'registration_open',
    'ongoing',
    'judging',
    'completed',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.registration_type AS ENUM ('individual', 'team');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.team_member_role AS ENUM ('leader', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.team_invite_status AS ENUM ('invited', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.submission_status AS ENUM (
    'draft',
    'submitted',
    'under_review',
    'evaluated'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.report_status AS ENUM (
    'open',
    'investigating',
    'resolved',
    'dismissed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.report_target_type AS ENUM (
    'user',
    'request',
    'project',
    'hackathon',
    'submission',
    'message'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
