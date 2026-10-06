# Connect Supabase and Google

The app code and migration are ready. Live authentication requires an actual Supabase project and a Google OAuth client; no credentials are included and no provider login is simulated.

1. Create/select the dedicated **IFAGRITHM Workflow** Supabase project. Do not use the private Terminal database.
2. Apply `supabase/migrations/202610060001_stage_1a.sql`, then `supabase/migrations/202610060002_intervention_report.sql`, in that order in its SQL Editor or through your migration workflow. The base migration creates four core tables, an activity log, role-protected RPCs, RLS policies and a private profile-images bucket. The second migration adds optional intervention context and a backward-compatible capture RPC. Run the base on a fresh schema; these are one-time migrations, not repeatable scripts. An existing Stage 1A schema needs only the second migration.
3. In Supabase Authentication providers, enable Google. Configure the Google OAuth web client with Supabase's callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`. Enter Google client ID/secret in **Supabase**, not in Next.js source. Request only normal profile/email sign-in scopes. Keep other login providers disabled for this workspace.
4. Set Supabase Auth Site URL to `https://ifagrithm-workflow.vercel.app`. Add these allowed redirect URLs: `https://ifagrithm-workflow.vercel.app/auth/callback` and `http://localhost:3010/auth/callback`. Add a specific preview deployment callback if testing there; avoid broad wildcard callbacks.
5. Copy `.env.example` to `.env.local` and configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. These are project URL/publishable client credentials. Never use a service-role/secret key in a public variable. The application does not require a service-role key.
6. Set the same two variables on the existing Vercel `ifagrithm-workflow` project, for the intended deployment environments. Redeploy. Secrets/Google configuration are not managed by the in-app Settings screen.
7. The intended owner signs in with their Google account and completes profile setup. The account is pending at this point.
8. In the SQL Editor, replace the placeholder email in `supabase/bootstrap-owner.sql` with that owner's full verified Google email and execute it. It requires a verified Google account and completed profile. Only deliberate project administration can bootstrap ownership.
9. Owner refreshes the application, enters `/admin` and approves Scouts/Analysts. Selecting a requested role during onboarding never assigns actual permissions.

Full account emails stay in Supabase Auth; other workers cannot retrieve them from the profile table. Stable auth UUIDs link contributions, so changing a username or display name preserves history.

Profile uploads use a private bucket and short-lived signed reads. Uploads are restricted to the signed-in user's folder and PNG/JPEG/WebP up to 2 MB.

Existing browser-local memory is preserved at `/demo` and can be exported there. It is not silently imported into shared storage or relabelled as authenticated work. An explicit reviewed migration can be added later.

## Verification before team use

Use two Google test accounts. Complete both profiles; only bootstrap the intended owner. Confirm the second account sees Pending. Approve it as Scout; capture a company/source; check authorship. Try the same source from the owner account and review the warning. Add an alternate source to the existing observation, and verify the observation count does not increase. Verify the Scout cannot enter `/admin` or call admin RPCs; suspend the account and confirm shared access is blocked.

The local database tests execute the actual migration and policies in PGlite PostgreSQL with minimal Supabase auth/storage fixtures. They verify relational/permission behavior, not the external Google OAuth exchange. The latter must be checked against the configured project.

Official references: [Google sign-in](https://supabase.com/docs/guides/auth/social-login/auth-google), [SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
