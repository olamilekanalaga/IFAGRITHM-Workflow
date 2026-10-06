# IFAGRITHM Internal Operating System — MVP

Company work above connected evidence. Separate project: does not import or modify IFAGRITHM-Terminal or the public website.

## Local run

Node.js 20.9+ required.

```powershell
npm install
npm run dev
```

Open http://localhost:3010. Commands: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`. Run a production build with `npm run start` after building.

## Company operating map

DISCOVER → INVESTIGATE → DECIDE → APPROACH → CONVERT → DELIVER → LEARN → DISCOVER.

The Command Centre counts actual records: open observations, active research, pending decisions, companies in Approach/Convert, open delivery engagements, and learning/playbooks. Units are explicit; these are not all company counts or conversion rates. Breakdown rows use recorded behaviour labels, statuses, approach routes and owners. Content readiness and Ola/Analyst task queues are also computed from stored records.

Primary navigation: Command Centre, Discover, Companies, Research, Content, Pipeline, Delivery, Knowledge. Relationships, Recommendations, Decisions and Activity are secondary. Legacy People/Observations/Strategies hash views still work.

One Next.js `/` route with shareable hash views and records, e.g. `/#view=Pipeline&stage=Convert`, `/#record=nova-research`.

## Evidence architecture retained

`src/lib/model.ts`: typed record kinds, directed relationships and activity events. All original IDs and relationship labels are preserved. New optional operating fields extend the version-1 browser model without overwriting saved captures.

Original kinds: Company, Person, Observation, Behaviour, Research, Evidence, Insight, Strategy, Action, Outcome, Learning, Playbook, Task.

New kinds: Decision, Content, Delivery, Problem. Problem is a hypothesis by default; it is not an early operating stage. Client-confirmed requires a company in Convert/Deliver/Learn and a connected founder/client conversation Evidence record. Confidence and company stage cannot confirm a problem on their own.

Decision disposition: pending, archive/knowledge, content, potential client or commercial + content. A decision record does not send outreach or automatically create branches. Research and Decision detail buttons create linked Content/Action records via Quick Capture.

Research framing captures observable facts, actors, encouraged behaviour, research question and public unknowns. Company discovery notes capture current solution, client decision, available data, commercial fit and scope. Content captures publication format and readiness. Delivery captures an analysis approach determined by the question and a client deliverable. Editable record statuses keep operational queues current.

## Main components

- `workspace.tsx`: navigation, search, capture, filters, local persistence, detail traceability.
- `operating-board.tsx`: primary operating map and computed queues/drilldowns.
- `company-workflow.tsx`: stage/route, decision disposition, discovery notes and work statuses.
- `memory-motion.tsx`: illustrative underlying evidence trail; exact graph edges remain in detail history.
- `operations.ts`: stage classification, count logic, problem confirmation guard, additive demo merge and updates.
- `seed.ts`: explicitly fictional examples, including commercial + content branching and one fictional delivery engagement.

## Existing memory

Browser localStorage key stays `ifagrithm-memory-v1`. Existing data loads as-is; default company stages are derived from recorded commercial status if no explicit stage exists. No automatic reset or overwrite.

Existing workspaces can use “Add updated demo examples · keep my records”. This adds missing sample IDs/relationships and preserves all existing record values. It is optional and explicitly fictional. A fresh browser receives the expanded seed automatically.

Export memory downloads JSON for backup. Captures remain in this browser; storage clearing deletes local work. A failed capture write leaves the form open and reports the failure. Data is not shared between browsers.

## Search and traceability

Global search matches record fields and directly connected records. Company history does not expand through shared Person contributors. Stage drilldowns retain filters in the URL. Content and commercial work from the same research remain connected; publication status is a local log, not actual external publishing.

## Brand / motion

Original symbol from https://www.ifagrithm.xyz/assets/brand-symbol-transparent.png is local in `public/`. Warm light/dark palettes, dot grid, animated evidence trail and reduced-motion support. Theme and pause/play settings persist locally. No animation dependency.

## Database migration and V2

Next.js, TypeScript, React and Tailwind CSS 4. Later add `records`, `relationships` and `activity` tables with stable IDs, foreign keys and transactional writes; replace browser persistence with a repository adapter. Add workspace isolation, authentication and server-side validation before real shared use.

V2: collaborative database, authenticated contributors, evidence uploads, editing/merging/deleting all record types, actual content publishing, external outreach integrations, revenue accounting and validated playbook promotion. Manually entered contributors are not audited identities. No employee surveillance is implemented.

Vercel is connected to https://github.com/olamilekanalaga/IFAGRITHM-Workflow; pushes to main trigger deployment. Keep `.env*`, `.vercel`, node_modules and generated build/test output excluded from Git. Deployment protection is retained. No custom domain changes are needed.
