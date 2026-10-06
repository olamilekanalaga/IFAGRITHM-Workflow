# IFAGRITHM Workflow — Stage 1A

An internal company-memory workspace for scouts and analysts. This project is separate from the public website and private research Terminal. The frozen scope is documented in [docs/STAGE-1A.md](docs/STAGE-1A.md).

## Local development

Node.js 20+ and npm:

```sh
npm install
npm run dev
```

Open http://localhost:3010. Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Run the production build with `npm run start`.

## Routes

- `/sign-in`: Google OAuth entry, or an honest configuration-needed state.
- `/auth/callback`: exchange the OAuth code for a cookie-based verified session.
- `/`: authenticated worker application. First-time users complete their profile; pending accounts cannot read workspace records.
- `/admin`: approved Admin/Owner only, enforced on the server and in PostgreSQL.
- `/api/workflow`: verified-session API; writes require same-origin requests and approved permissions.
- `/demo/worker`, `/demo/admin`: clearly labelled read-only fictional previews. They do not authenticate users or bypass the real API.
- `/demo`: earlier local capture prototype. Existing `ifagrithm-memory-v1` records remain exportable here; they are not silently imported or assigned to real accounts.

## What works once connected

Google sign-in → automatically created Google profile/name/image/unique username → editable profile setup → admin approval → worker access.

Workers can search/select canonical companies (name + domain + category), create a company while submitting an observation, use custom behaviour labels, attach multiple sources, view contributor history and My Work, and combine directory filters. Backend identity supplies author and timestamp. Changing a display name or username preserves previous contributions.

The database distinguishes companies, observations and submitters. Company names are not unique; normalized domains are unique. Same company/source warns before capture. Workers can view the existing observation or explicitly override. Different URLs can be added to one existing event without increasing behaviour counts.

Admins can approve/suspend accounts, assign Scout/Analyst/Admin roles, correct categories/statuses, review activity, merge companies/observations with a reason, and softly remove bad submissions. A protected owner is deliberately bootstrapped, never awarded to the first registrant. Role requests are separate from actual permissions.

## Appearance

Use **Appearance** beside the profile to choose Ifagrithm, Paper or Terminal. Ifagrithm also supports Dark/Light/System. All skins share the same cards, filters, company history and workflow. Preference is stored locally; database activation is not required. See [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) for tokens, component boundaries, the PaperDAO reference and a future profile-preference adapter. [Latest hierarchy verification and screenshots](verification/hierarchy-verification.md) document the three-theme/five-width checks and the screenshot-guided metric, behaviour, project-card and mobile-navigation correction. The [earlier design verification](verification/design-verification.md) records the initial theme-system pass.

## Configuration and activation

See [docs/AUTH-SETUP.md](docs/AUTH-SETUP.md) for exact Supabase, Google OAuth, database migration and initial owner setup. No live Supabase/Google credentials are included. When unconfigured, Google sign-in is disabled; only labelled demonstrations are available.

Apply `supabase/migrations/202610060001_stage_1a.sql` to a dedicated Supabase project. Copy `.env.example` to `.env.local`, set the project URL and publishable key, configure Google in Supabase, and redeploy the linked Vercel project. After the intended owner signs in and completes setup, run the reviewed `supabase/bootstrap-owner.sql` with their verified full Google email.

Private account emails remain in Supabase Auth, not in the worker-visible profile table. Never use a service-role key in `NEXT_PUBLIC_*`. The application does not need a service-role key.

## Structure

- `src/components/internal-workspace.tsx`: worker/admin navigation, company selection, capture, history and review forms.
- `src/components/profile.tsx`, `sign-in.tsx`: profile onboarding, approval gates, avatars and sign-out.
- `src/lib/identity.ts`: typed profiles/companies/observations/sources and duplicate/history helpers.
- `src/lib/supabase/`: cookie-aware browser/server clients.
- `src/middleware.ts`: verified session refresh for Next.js 15.
- `src/app/api/workflow/route.ts`: restricted API actions. Authority stays with `auth.uid()` and protected PostgreSQL RPCs.
- `supabase/migrations/`: four core tables, activity log, RLS, transactional capture/review and private image policies.
- `tests/database.test.mjs`: executes the real migration against PGlite PostgreSQL with minimal auth/storage fixtures.
- Legacy model/seed/scout files retain the earlier local prototype and company-memory relationships.
- `public/brand-symbol-transparent.png`: existing IFAGRITHM brand asset.
- `verification/`: screenshots and test reports.

## Logos and profile images

Optional `NEXT_PUBLIC_LOGO_DEV_TOKEN` enables [Logo.dev](https://www.logo.dev/docs) domain-based company logos. Use a publishable token, never a secret token. Initials appear when unconfigured or retrieval fails. Company domains are sent to the provider.

Google profile images are used automatically when supplied. Profile uploads use a private Supabase bucket, signed reads, and authenticated user-specific paths. PNG/JPEG/WebP, maximum 2 MB.

## Deployment

GitHub: https://github.com/olamilekanalaga/IFAGRITHM-Workflow
Vercel project: `ifagrithm-workflow`. Push to linked `main` deploys the app. No custom domains or unrelated projects are modified.

## Intentional limits

Live Google/Supabase integration needs configuration and verification with real test accounts. Database tests do not simulate the external Google provider. No Stage 1B, analysis workspace, content/delivery system, public publishing, AI duplicate resolution, automatic domain ownership verification, or unattended import is implemented. Entered domains are identity hints, not proof of ownership. One workspace is supported. Pagination/full-text search, reviewed legacy-data import and broader operational permissions can follow after Stage 1A validation.
