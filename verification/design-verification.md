# Stage 1A visual-system verification

This records the initial theme-system pass. The subsequent [information hierarchy correction](hierarchy-verification.md) supersedes these overview/card screenshots and mobile navigation notes.

Local production build tested with Chromium browser automation on 6 October 2026.

## Checks

- Lint: passed.
- TypeScript: passed.
- Production build: passed, with the same routes as before this pass.
- Tests: 32 passed, including all 26 existing tests, four preference-boundary tests and two deterministic-date presentation tests.
- Browser errors: none reported during the final local screen/interaction checks.
- Frozen identity model, API, authentication callback, middleware, database migrations and permission tests: unchanged.

Deployed-browser verification exposed the earlier locale-dependent Admin activity timestamp: Vercel rendered US/UTC text while the browser rendered British/local-time text. Activity and contribution timestamps now use explicit, deterministic UTC presentation, avoiding hydration mismatch without changing stored data.

## Responsive matrix

All three themes were checked at **1440, 1024, 768, 390 and 320px**.

Worker: Overview, Directory, Observe, My Work, Profile, canonical company record, observation/multiple-source record and Appearance popover. 120 layout checks.

Admin: Overview, All Companies, All Observations, Workers, Role Requests, Duplicates / Review, Approached, Completed and Settings. 135 layout checks.

Login: all themes and widths, including honest disabled Google/configuration-needed state and popover bounds. 15 layout checks.

No horizontal page overflow was detected. The 320px Appearance popover clipping found during review was fixed and its bounds rechecked. Mobile navigation wraps into usable controls rather than compressing the desktop sidebar.

## Interactions and data integrity

- Identical company-card content in every skin.
- Same-name NOVA records remain separate by domain/category.
- Search and combined behaviour/category/status filters work; selected filters survive theme changes.
- Empty filtered views display a clear reset/adjust message.
- Company → observation → source/contributor history navigation works.
- Existing-company autocomplete includes name, category, domain and logo/initials.
- Same-source duplicate warning remains visible; recent observations and View Existing remain connected.
- Changing appearance preserves the selected company, observation draft and source URL.
- Multiple sources retain separate contributor links.
- My Work shows the active sample user's contributions; profile and protected write controls remain read-only in demonstrations.
- Preference persists after reload and route changes; legacy light preference and corrupt/blocked storage recovery are covered by tests.
- System mode follows both light and dark browser media emulation.
- Reduced-motion emulation removes card transition duration; popover/autocomplete entrance animations are disabled by the same media query.
- Native radio arrow-key selection works. Escape closes the popover and returns visible focus to the Appearance trigger.

## Readability and stress cases

Minimum measured core text/control contrast on the panel surface:

| Theme | Lowest ratio checked |
| --- | --- |
| Ifagrithm dark | 6.46:1 |
| Ifagrithm light | 5.84:1 |
| Paper | 5.21:1 |
| Terminal | 7.36:1 |

These checks cover primary, secondary, muted and link text plus primary-button text; they are accessibility basics, not a full assistive-technology audit.

At 320px, all themes also passed temporary DOM-only stress fixtures: long unbroken company names, 25 history labels, 40 additional observation rows and two long evidence URL labels. Fixtures were removed after each check. They never altered persisted or deployed demonstration records. The actual demonstration also covers initials/missing logos, absent behaviour values, zero observations, same-name companies and multiple sources.

## Screenshots

| Theme | Worker desktop | Worker 390px | Admin desktop |
| --- | --- | --- | --- |
| Ifagrithm | [View](design-ifagrithm-1440.png) | [View](design-ifagrithm-390.png) | [View](design-admin-ifagrithm.png) |
| Paper | [View](design-paper-1440.png) | [View](design-paper-390.png) | [View](design-admin-paper.png) |
| Terminal | [View](design-terminal-1440.png) | [View](design-terminal-390.png) | [View](design-admin-terminal.png) |

## Activation boundary

Supabase and Google are deliberately not activated. Preview data stays fictional/read-only. Real account onboarding, uploads, Google provider behavior and shared writes still require the separately documented activation/testing step. No Stage 1B, paid logo service or public/private Terminal change is included. Large-directory pagination is still outside this visual pass.

Preview paths: `/demo/worker` and `/demo/admin` on the existing `ifagrithm-workflow` Vercel project.
