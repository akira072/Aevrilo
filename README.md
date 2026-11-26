# Aevrilo — Student Innovation & Creative Talent Marketplace

**Tagline:** *Ideas meet talent. Projects become reality.*

Aevrilo unifies two ecosystems in a single Next.js + Supabase platform:
1. **CREATE** — Freelancing, creative services, scoped INR project requests, portfolios, deliverables, revisions, and verified settlement records.
2. **COMPETE** — Campus hackathons, problem statements, team formation with invite codes, deadline-guarded submissions, confidential organizer/judge scoring, and official leaderboards.

---

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Radix UI primitives (`shadcn/ui` pattern), Lucide Icons, React Hook Form, Zod
- **Backend & Auth:** Next.js Route Handlers + Server Components, Supabase Auth (`@supabase/ssr`), PostgreSQL with Row Level Security (RLS), Supabase Storage, Supabase Realtime
- **Testing:** Vitest (`npm test`), TypeScript (`npm run typecheck`), ESLint (`npm run lint`)

---

## Folder Structure

```text
aevrilo/
├── scripts/
│   └── seed-demo.mjs                 # Optional [DEMO] data seeder (requires service role key)
├── supabase/
│   ├── migrations/
│   │   ├── 0001_extensions_and_enums.sql
│   │   ├── 0002_core_tables.sql
│   │   ├── 0003_marketplace_tables.sql
│   │   ├── 0004_hackathon_tables.sql
│   │   ├── 0005_comm_payments_admin_tables.sql
│   │   ├── 0006_functions_triggers_indexes.sql
│   │   └── 0007_rls_policies.sql
│   ├── seed.sql                      # Required production seed: settings, 10 categories, skills
│   └── demo_seed.sql                 # Notes for optional [DEMO] data seeding
├── src/
│   ├── app/                          # App Router pages & API route handlers
│   │   ├── api/                      # Server endpoints (requests, applications, projects, hackathons, messages, admin, reports)
│   │   ├── admin/                    # Admin moderation, UTR verification, analytics & audit logs
│   │   ├── applications/             # Freelancer proposal tracker
│   │   ├── auth/callback/            # PKCE / email verification callback
│   │   ├── contact/                  # Support & dispute reporting
│   │   ├── dashboard/                # Role-aware workspace dashboard
│   │   ├── explore/                  # Project discovery + detail/proposal submission
│   │   ├── freelancers/              # Talent directory & public creator portfolios
│   │   ├── hackathons/               # Hackathon listing, creation, teams, submissions & judging
│   │   ├── login/, signup/, reset-password/
│   │   ├── messages/                 # Realtime project chat + attachments
│   │   ├── my-requests/              # Client requests manager
│   │   ├── notifications/            # Notifications feed
│   │   ├── payments/                 # INR payment & prize records
│   │   ├── portfolio/                # Portfolio upload & management
│   │   ├── profile/, settings/       # Profile editing, college verification & password settings
│   │   ├── projects/                 # Project lifecycle workspace & deliverables
│   │   └── requests/new/             # Client request creation
│   ├── components/                   # Reusable UI primitives & feature modules
│   ├── lib/
│   │   ├── auth/                     # Session & role guards
│   │   ├── domain/                   # Constants & state-machine transition guards
│   │   ├── email/                    # Resend email alert adapter
│   │   ├── payments/                 # INR commission calculator & provider abstraction
│   │   ├── security/                 # Sliding-window rate limiter
│   │   ├── supabase/                 # Browser, Server, Admin, and Middleware clients
│   │   └── validation/               # Zod schemas
│   └── types/                        # Database TypeScript interfaces
├── tests/                            # Automated Vitest suite
└── .env.example                      # Environment variable template (names only)
```

---

## Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

3. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## Supabase Setup Instructions

1. Create a new Supabase project.
2. In the **SQL Editor** (or via Supabase CLI `supabase db push`), execute migrations in order:
   - `supabase/migrations/0001_extensions_and_enums.sql`
   - `supabase/migrations/0002_core_tables.sql`
   - `supabase/migrations/0003_marketplace_tables.sql`
   - `supabase/migrations/0004_hackathon_tables.sql`
   - `supabase/migrations/0005_comm_payments_admin_tables.sql`
   - `supabase/migrations/0006_functions_triggers_indexes.sql`
   - `supabase/migrations/0007_rls_policies.sql`
3. Run the required taxonomy & settings seed:
   - `supabase/seed.sql` (populates `platform_settings` with 5% commission / ₹0 joining fee, all 10 required freelance categories, and initial skills).
4. **Authentication Settings:**
   - Enable Email/Password authentication in Supabase Auth.
   - Add `http://localhost:3000/auth/callback` and your production `https://<your-domain>/auth/callback` to **Redirect URLs**.
5. **Realtime:**
   - Enable Realtime replication on `public.messages` and `public.notifications` in Supabase Dashboard → Database → Replication.
6. **Optional Demo Data:**
   - To populate clearly labeled `[DEMO]` users, portfolio items, requests, and a sample hackathon:
     ```bash
     npm run seed:demo
     ```
7. **Promoting your first Admin:**
   - Sign up via `/signup`, then in Supabase SQL Editor run:
     ```sql
     INSERT INTO public.user_roles (user_id, role)
     VALUES ('<your-auth-user-uuid>', 'admin')
     ON CONFLICT DO NOTHING;
     ```

---

## Vercel Deployment Instructions

1. Push the `aevrilo/` directory to a GitHub repository.
2. Import the repository in **Vercel** (set Root Directory if needed).
3. Configure Environment Variables in Vercel Project Settings:
   - `NEXT_PUBLIC_APP_URL` (your production `https://...` URL)
   - `NEXT_PUBLIC_APP_NAME=Aevrilo`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Server-only; never mark public)
   - `AEVRILO_DEFAULT_COMMISSION_BPS=500`
   - `AEVRILO_CURRENCY=INR`
   - Optional: `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`
4. Deploy. Update Supabase Auth Site URL and Redirect URLs to match your Vercel domain.

---

## Testing Instructions

Run unit, state-machine, commission, validation, security, and RLS migration tests:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

---

## India Payment & Compliance Design

- **INR Currency & ₹0 Freelancer Joining Fee:** Registration and applying for freelance work are free.
- **Configurable Commission:** Defaults to 5% (`500` bps in `platform_settings`), editable by Admins. Example: ₹5,000 project → ₹250 Aevrilo fee → ₹4,750 freelancer payout before applicable statutory deductions.
- **MVP External Settlement:** Client-to-freelancer settlements and organizer-funded hackathon prizes occur via approved external UPI or bank transfer arrangements, tracked via UTR references and verified by authorized admins (`manual_record` provider). Aevrilo does **not** create internal wallets, hold customer funds in ordinary bank accounts, implement unapproved escrow, or custody crypto/virtual assets.

---

## External Credentials & Unfinished Integrations

The application works end-to-end with Supabase once Supabase keys are provided. The following external integrations require credentials / provider approval before enabling:

| Integration | Status in MVP | Required Credentials / Next Steps |
| --- | --- | --- |
| **Supabase (DB, Auth, Storage, Realtime)** | Implemented (`@supabase/ssr`, SQL migrations, RLS) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Transactional Email Alerts** | Adapter implemented (`src/lib/email/mailer.ts`) | `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS` |
| **Automated Split Marketplace Payments (Razorpay Route / Cashfree Easy Split)** | Provider interface implemented (`src/lib/payments/provider.ts`); MVP uses verified external UPI/bank UTR records | Marketplace onboarding & compliance approval + `PAYMENT_PROVIDER`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| **Multi-instance Distributed Rate Limiting** | In-memory sliding-window limiter (`src/lib/security/rate-limit.ts`) | Optional Upstash Redis credentials for multi-region serverless rate limits |
