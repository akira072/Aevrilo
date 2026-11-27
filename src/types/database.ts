export type AppRole = "client" | "freelancer" | "organizer" | "admin";
export type AccountStatus = "active" | "suspended" | "restricted";
export type AvailabilityStatus = "available" | "busy" | "unavailable";
export type PaymentType = "fixed" | "milestone" | "hourly";
export type RequestStatus =
  | "OPEN"
  | "UNDER REVIEW"
  | "ASSIGNED"
  | "IN PROGRESS"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";
export type ApplicationStatus = "pending" | "shortlisted" | "accepted" | "rejected" | "withdrawn";
export type ProjectStatus =
  | "ASSIGNED"
  | "IN PROGRESS"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";
export type DeliverableStatus = "submitted" | "revision_requested" | "approved";
export type PaymentStatus = "pending" | "processing" | "successful" | "failed";
export type HackathonStatus =
  | "draft"
  | "published"
  | "registration_open"
  | "ongoing"
  | "judging"
  | "completed"
  | "archived";

export interface Profile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  headline: string;
  bio: string;
  college_or_org: string;
  college_email: string | null;
  college_email_verified: boolean;
  specialization: string;
  city: string;
  country: string;
  availability: AvailabilityStatus;
  account_status: AccountStatus;
  is_client_enabled: boolean;
  is_freelancer_enabled: boolean;
  payout_preference_note: string;
  rating_avg: number;
  reviews_count: number;
  completed_projects_count: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
  display_order: number;
  is_active: boolean;
}

export interface PortfolioItem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category_id: string | null;
  video_url: string | null;
  github_url: string | null;
  live_demo_url: string | null;
  tags: string[];
  is_featured: boolean;
  created_at: string;
  category?: Category | null;
  media?: Array<{
    id: string;
    public_url: string;
    storage_path: string;
    mime_type: string;
  }>;
}

export interface FreelanceRequest {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category_id: string;
  required_skills: string[];
  budget_inr: number;
  payment_type: PaymentType;
  deadline: string;
  freelancers_needed: number;
  additional_requirements: string;
  status: RequestStatus;
  applications_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  client?: Pick<Profile, "id" | "full_name" | "username" | "avatar_url" | "college_or_org" | "rating_avg"> | null;
}

export interface ApplicationRecord {
  id: string;
  request_id: string;
  freelancer_id: string;
  cover_message: string;
  relevant_skills: string[];
  portfolio_links: string[];
  proposed_price_inr: number;
  estimated_days: number;
  status: ApplicationStatus;
  client_note: string;
  created_at: string;
  request?: FreelanceRequest | null;
  freelancer?: Pick<
    Profile,
    "id" | "full_name" | "username" | "avatar_url" | "headline" | "college_or_org" | "rating_avg" | "completed_projects_count"
  > | null;
}

export interface ProjectRecord {
  id: string;
  request_id: string;
  application_id: string;
  client_id: string;
  freelancer_id: string;
  title: string;
  agreed_budget_inr: number;
  commission_bps: number;
  commission_amount_inr: number;
  freelancer_payout_inr: number;
  deadline: string;
  status: ProjectStatus;
  payment_status: PaymentStatus;
  revision_count: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  client?: Pick<Profile, "id" | "full_name" | "username" | "avatar_url"> | null;
  freelancer?: Pick<Profile, "id" | "full_name" | "username" | "avatar_url"> | null;
}

export interface HackathonRecord {
  id: string;
  organizer_id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  banner_url: string | null;
  eligibility: string;
  mode: "online" | "offline" | "hybrid";
  venue: string;
  min_team_size: number;
  max_team_size: number;
  registration_deadline: string;
  start_date: string;
  end_date: string;
  prize_pool_inr: number;
  funding_source: string;
  status: HackathonStatus;
  results_published: boolean;
  allow_late_submission: boolean;
  created_at: string;
  organizer?: Pick<Profile, "id" | "full_name" | "username" | "college_or_org"> | null;
}
