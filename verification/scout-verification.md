# Stage 1A verification — 6 October 2026

- `npm test`: 14/14 passed. Covers atomic capture, domain deduplication, conflicting domains, unsafe sources, adaptive detail validation, history filtering, same-day ordering, and preserved underlying operating relationships.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed. Static application; first load approximately 117 kB.
- Production build tested at http://localhost:3010 with Chromium via agent-browser.
- Browser capture created fictional Atlas Demo with source URL and bounty detail. Second Fundraise observation reused that company. Reload retained six companies, exactly one Atlas Demo, and both observations.
- Company history showed newest same-day observation first. Card showed the latest Fundraise while Bounty + Protocol + Not Approached still found the company through its earlier history.
- Explicit Completed status updated overview counts to Approached 4 / Completed 1 in the isolated test browser. Status change recorded in activity.
- Desktop 1440px, phone 390px and narrow 320px: no document horizontal overflow. Company history uses a contained scrollable table.
- Observe/Overview navigation, company detail, dark/light mode, and existing storage compatibility checked. Earlier saved records remain in the same version-1 memory model; no destructive migration runs.
- No browser console errors or framework error overlays observed. Form controls have associated labels; keyboard focus styles are present. Source links use safe new-tab attributes. Reduced-motion CSS removes card transitions.
- Final screenshots: scout-desktop.png, scout-company-history.png, scout-mobile-light.png, scout-mobile-dark.png. Capture screenshot: scout-observe-mobile.png.
- Demo data and browser verification examples are fictional. No provider token configured: company initials are expected. Live logo-provider success cannot be verified without a publishable token.
- Persistence is local browser storage. No authentication, backend, shared database, verified source ingestion or Stage 1B implementation.
