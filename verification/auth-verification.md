# Authenticated Stage 1A verification — 6 October 2026

## Checks

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed, no Edge-runtime SDK warnings after using supported Next.js 15 Node middleware.
- `npm test`: 26 passed (14 preserved memory/capture tests and 12 actual PostgreSQL schema/policy tests).
- `npm audit --omit=dev`: zero runtime advisories after a compatible PostCSS override. The full development audit retains five high reports from the existing ESLint glob/braces toolchain; there is no published compatible braces patch in the inspected registry. These packages are not runtime dependencies. No broad framework downgrade/upgrade was applied.

## PostgreSQL behavior

The migration executes in PGlite PostgreSQL with minimal Supabase auth/storage fixtures. Tests exercise:

- Pending accounts see only their profile and cannot submit.
- Requesting Admin never grants Admin; raw role updates fail.
- Authenticated submitter IDs are assigned inside RPCs.
- Atomic creation links one company, observation and source.
- Same company/normalized source returns a duplicate response; explicit override succeeds.
- Additional URLs attach to the existing event.
- Same-name companies with distinct domains remain distinct.
- Worker admin calls and owner demotion fail.
- Admin approval succeeds.
- Anonymous reads/RPCs fail.
- Merges preserve source contributor IDs and original observation history.
- Usernames are unique, account emails are not worker-readable.
- Bad source capture rolls back; other-user avatar uploads fail RLS.
- Merged domain aliases resolve to canonical company IDs.
- Suspension immediately blocks shared reads and capture.

## Production-build browser checks

Tested with Chromium through agent-browser at http://localhost:3010:

- Signed-out `/` and `/admin` end at `/sign-in`.
- Google button is disabled with an explicit configuration message while environment variables are absent.
- Unconfigured `/api/workflow` returns 503 without internal records. Cross-origin writes return 403. Callback redirect stays within the app.
- `/demo/worker` and `/demo/admin` show clearly labelled, read-only fictional records. No provider authentication is simulated.
- Worker navigation includes Overview, Observe, Directory, My Work and Profile.
- Company picker distinguishes the two NOVA companies by domain/category.
- Company selection exposes recent observations. Normalized duplicate source shows the warning; opening the existing observation shows its two sources.
- Contributor navigation shows computed counts without account email exposure.
- Buttons for viewing people/observations inside capture use `type=button`; they do not submit the form.
- Admin role-request preview shows pending worker and requested role. Its mutation buttons are disabled in demonstration mode.
- Desktop 1440px, 390px and 320px: no document horizontal overflow in checked worker/admin views. Dark/light verified. Controls have associated labels; safe new-tab source links and visible focus styles checked.
- No browser console errors observed.

Screenshots: auth-sign-in.png, auth-worker-desktop.png, auth-capture-duplicate.png, auth-contributor-mobile.png, auth-admin-desktop.png, auth-admin-mobile.png, auth-admin-mobile-light.png.

## Pending live verification

No Supabase project/Google OAuth configuration is connected to this Vercel project. The external OAuth exchange, cloud migration, image bucket and two-real-account end-to-end flow have not been tested live. Follow docs/AUTH-SETUP.md, configure the dedicated project, bootstrap the intended verified owner, then complete that verification before inviting the team.

Existing browser-local memory remains at `/demo`, exportable with the earlier schema. It has not been imported or relabelled as authenticated work. The public website/private Terminal were not modified.
