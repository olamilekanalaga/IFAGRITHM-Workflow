# MVP verification

- Lint: passed (no warnings after excluding generated next-env.d.ts).
- TypeScript: passed, including generated production types.
- Production build: passed; home prerendered, first-load JS about 109 kB.
- Browser: Chromium via agent-browser.
- Desktop: page renders records, navigation and capture controls; screenshot desktop-preview.png.
- Mobile: checked 390×844 and 320×740; document scrollWidth does not exceed viewport width. Screenshot mobile-preview.png.
- Required fields: empty capture form fails browser checkValidity.
- Capture: created fictional Verification capture, linked to NovaX; saved to localStorage and appeared in detail view. Reload preserved it.
- Company detail: NovaX shows incoming/outgoing relationships and excludes Tide Protocol from its connected history.
- Search: real keyboard input Trading competition returns behaviour, observation, strategy, company, evidence, research, insight, action and contributor records.
- Activity: timeline and contributor/company/strategy/type/date controls render.
- Console/page errors: no errors reported during checked flows.
- Accessibility basics: semantic navigation and headings, labelled input controls, visible focus styling, native dialog and keyboard-operable buttons/selects. No formal WCAG audit.

Limitations: no multiuser database, no auth, no upload handling, no verified contributor identities. Browser test records live only in the test browser; source seed data is unchanged.

## Public-brand motion update

- Reused the original IFAGRITHM gold symbol from the live website.
- Warm-white/dark modes, dot-grid backdrop, view/record entrance transitions and animated evidence sequence.
- Desktop screenshot inspected: verification/motion-desktop.png. Dark/mobile captures also saved.
- Six linked motion records render and navigate to record traceability.
- Theme toggle works; Pause stops running animations.
- Emulated prefers-reduced-motion: reduce results in zero animations, even with motion manually enabled.
- No horizontal overflow at 390px or 320px.
- Quick Capture still opens and enforces required-field validation.
- No browser page errors reported.

## Company operating-map revision

- Primary map: Discover → Investigate → Decide → Approach → Convert → Deliver → Learn, with a return to Discover.
- Main navigation: Command Centre, Discover, Companies, Research, Content, Pipeline, Delivery, Knowledge. Relationships, Recommendations, Decisions and Activity are secondary.
- Eight automated tests pass: record-derived queues, confirmation gates, commercial/content branching, additive demo preservation, stage/status updates and contributor attribution.
- Lint and TypeScript pass; production build passes.
- Fresh-browser Command Centre has seven stage cards with actual record counts and Content / Ola / Analyst queues.
- Convert card drills down to one matching company; discovery notes persist after reload.
- Content captured from NovaX research keeps its parent relationship, defaults to Draft, and updates readiness counts when marked ready.
- Completing an Ola task removes it from the open assignment count.
- Confirmation using another company's conversation evidence is rejected; no Problem record is saved.
- Delivery details expose analysis approach, client deliverable and source traceability.
- Both 390px and 320px layouts have no horizontal document overflow.
- Dark mode works. Reduced-motion emulation results in zero running animations.
- No browser page errors or console errors reported during tested flows.
- Existing-browser upgrade preserves all 47 pre-existing records and adds missing Content/Delivery examples. Source seed remains separate from browser test captures.
- Screenshots: verification/operating-desktop.png and verification/operating-mobile.png.

Operating counts are work-record counts with explicit units, not an exclusive company funnel or response-rate analytics. Decision dispositions do not send outreach, publish content or confirm problems automatically. Shared persistence and authentication remain V2.
