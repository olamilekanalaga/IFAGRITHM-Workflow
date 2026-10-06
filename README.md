# IFAGRITHM Workflow — Stage 1A

Internal scout workspace. Two primary screens: **Observe** and **Overview / Directory**. An observation creates or reuses a company, records a behaviour and source, and updates company history. This is separate from the private research Terminal and public business website.

## Run locally

Node.js 20+ and npm:

```sh
npm install
npm run dev
```

Open http://localhost:3010. Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Production locally: `npm run start`.

## Functional scope

- Capture an observation with a custom or existing behaviour, company/category, source URL, observed date and scout attribution.
- Adaptive optional detail: Raised, Bounty, Prize pool, Grant pool, Creators observed, Partner, or free detail.
- Reuse companies by selected ID, normalised domain, or unambiguous name. Existing company fields remain unchanged on capture.
- Overview totals use actual records. Behaviour counts measure observations. Combined search/behaviour/category/status filters match the entire direct observation history, not just the latest observation.
- Company detail lists chronological observations, sources, scouts and editable commercial status. “Not Approached” excludes recorded approach and downstream commercial statuses.
- Dark/light mode and JSON memory export.

## Persistence and demonstration data

All seed companies and activities are fictional. Legacy sample notes have no verified external sources and are labelled accordingly. Captured URLs are attributed sources, not automatically verified facts. Observed behaviour does not establish a client problem.

Browser localStorage uses the existing `ifagrithm-memory-v1` key and version. Research, evidence, strategies and other existing records remain intact underneath the simpler interface. Invalid saved memory blocks writes and can be exported for recovery. Export regularly: data is local to this browser and is not shared across devices. No authentication or server database exists.

## Architecture

- `src/app/page.tsx`: primary application entry.
- `src/components/scout-workspace.tsx`: Observe, directory, company history, theme and export.
- `src/lib/scout.ts`: source/domain validation, atomic capture, direct relationships, filters and status logic.
- `src/lib/model.ts`: additive relational record model; companies link to observations, observations to reusable behaviours and evidence.
- `src/lib/seed.ts`: fictional demonstration memory.
- `src/components/workspace.tsx` and `src/lib/operations.ts`: retained earlier operating-system implementation; not the primary UI.
- `src/app/globals.css`: responsive styles, including scoped Stage 1A styles.
- `public/brand-symbol-transparent.png`: existing IFAGRITHM brand symbol.
- `tests/`: capture, relationships, deduplication, filtering and legacy operating-model tests.

Business operations are pure memory transformations. A future repository adapter can load/save the same records and relation edges in PostgreSQL/Supabase. Server-side validation, IDs, attribution and concurrency will then become authoritative.

## Automatic company logos

Set `NEXT_PUBLIC_LOGO_DEV_TOKEN` to a Logo.dev **publishable** token, locally in `.env.local` or in Vercel project environment variables, then rebuild. Never place a secret token in a public environment variable. Domain-based logos load automatically for companies with a website. No uploads are required. Without a token, a domain, or on an image failure, initials appear. No logo provider credentials are bundled. Provider requests disclose the company domain to Logo.dev.

[Logo.dev documentation](https://www.logo.dev/docs) describes provider access and terms. Company websites are optional; existing companies without domains show initials. No fake logos or automatic news scraping are included.

## Deployment

GitHub repository: https://github.com/olamilekanalaga/IFAGRITHM-Workflow
Vercel project: `ifagrithm-workflow`. Push to its linked main branch to deploy; no custom domain changes are required. Set the public logo token in that project if desired, then redeploy. This internal MVP is not ready for sensitive shared team records without authentication and a server database.

## Intentionally later

Stage 1B investigation, commercial workflow, content/delivery workspaces, shared persistence, permissions, source verification, bulk import, logo upload overrides, full-text/graph search and news ingestion. The current product deliberately stops at capture and company behavioural history.
