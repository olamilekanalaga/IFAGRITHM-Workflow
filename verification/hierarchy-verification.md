# Stage 1A information hierarchy correction

Verified on 6 October 2026 with a local production build and Chromium browser automation.

## What changed

The supplied Superteam UK screenshot guides component hierarchy while the existing Paper canvas and theme architecture remain intact. Metrics are large rounded button cards, behaviours are smaller count-led filter cards, and companies use logo-led project cards with distinct tonal surfaces. All three skins share card geometry and directory gutters. Tone colours are decorative, not research findings or status classifications.

Shared presentation lives in `src/components/directory-visuals.tsx`. Worker/Admin use the existing identity adapter in `company-card.tsx`; the older local `/demo` also uses the same project, metric and behaviour components. Worker mobile navigation is fixed at the bottom: Overview, Observe, Directory and My Work. Profile stays in the header. The older local demo offers Overview, Observe and Directory because it has no authenticated My Work model. Admin keeps its existing navigation and protected review surfaces.

No identity, observation/source model, permissions, authentication, API, database migration, seed data or route changes. No new runtime dependencies. Supabase/Google remain inactive; internal previews stay explicitly fictional and read-only. Existing browser-local memory is preserved.

## Engineering checks

- Existing test suite: **32 passed**, 0 failed.
- Lint: passed.
- TypeScript: passed.
- Production build: passed, same route set.
- Browser errors and console messages: empty in final local checks.
- `git diff --check`: passed.

## Responsive checks

All three themes at **1440, 1024, 768, 390 and 320px**: **315 screen checks, no horizontal overflow**. Machine-readable results: [hierarchy-responsive-checks.json](hierarchy-responsive-checks.json).

| Surface | Screens per theme/width | Checks |
| --- | --- | --- |
| Worker | Overview, Directory, Observe, My Work, Profile, company and observation record | 105 |
| Admin | Overview, All Companies, All Observations, Workers, Role Requests, Duplicates / Review, Approached, Completed, Settings | 135 |
| Local demo | Overview, Directory, Observe, company record | 60 |
| Sign-in | Existing configuration-needed state | 15 |

Metrics use two columns on phones; company cards use two columns at 390px and one at 320px. Fixed mobile navigation was checked through native browser clicks, with Observe, Directory and My Work opening the correct views. Bottom safe-area padding keeps final content clear of navigation.

## Interaction and accessibility checks

- Behaviour card taps filter the directory; theme changes preserve that filter.
- Metric links open all/approached/completed company views with correct counts and empty states. Categories focuses the category filter.
- Company card content is identical across themes. Width, padding and radius match across skins at both phone widths.
- Same-name NOVA companies remain distinct by domain and category, including autocomplete.
- Capture draft/source URL survives theme changes.
- Same-company/source duplicate warning appears; recent observations remain visible.
- View Existing opens the bounty observation with both sources; its contributor link opens Sam's profile.
- Long unbroken company names, domains, history text and evidence URL labels cause no page overflow at 320/390px. Stress fixtures were DOM-only and removed through navigation; persisted records were untouched.
- Missing logos, values and zero-observation states are covered by the actual demonstration data.
- Theme persists after reload. Native radio arrow-key switching works; Escape restores visible focus to Appearance.
- The Appearance popover stays within 320px viewport bounds.
- Reduced-motion emulation sets metric, behaviour and project transition duration to 0s.
- Minimum measured text contrast on the new object surfaces: Ifagrithm dark **5.94:1**, Paper **5.06:1**, Terminal **6.20:1**. Additional Ifagrithm light card check: **5.13:1**.

These are browser/keyboard/accessibility basics, not a full assistive-technology or physical-device audit. Real Google onboarding and shared writes still require the separate Supabase activation step. Large-directory pagination remains outside this visual correction.

## Screenshots

| Theme | Worker desktop | Worker mobile |
| --- | --- | --- |
| Ifagrithm | [1440px](hierarchy-ifagrithm-1440.png) | [390px](hierarchy-ifagrithm-390.png) |
| Paper | [1440px](hierarchy-paper-1440.png) | [390px](hierarchy-paper-390.png) |
| Terminal | [1440px](hierarchy-terminal-1440.png) | [390px](hierarchy-terminal-390.png) |

Also: [Paper directory on mobile](hierarchy-directory-paper-390.png), [Paper Admin](hierarchy-admin-paper.png), and [the corrected five-company local demo](hierarchy-local-paper-390.png).

Preview paths on the existing Vercel project: `/demo/worker`, `/demo/admin` and `/demo`. Supabase activation and Stage 1B remain outside this task.
