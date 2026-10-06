# IFAGRITHM Internal Operating System — MVP

Standalone prototype for connected company memory. This project does not import from or modify IFAGRITHM-Terminal or the public website.

## Run

Requires Node.js 20.9+.

```powershell
npm install
npm run dev
```

Open http://localhost:3010. Verification: `npm run lint`, `npm run typecheck`, `npm run build`. Production locally: `npm run start` after building.

## Architecture and model

Next.js App Router, TypeScript, React, Tailwind CSS 4 with custom terminal styling. No auth, billing or production infrastructure.

`src/lib/model.ts`: typed records, directed relationships and an append-only activity list. Records have ID, kind, title, body, status, owner, timestamp, optional category/source/confidence. Relationships have ID, from, to and an explicit label. Activity has record ID, actor, time and description.

Kinds: Company, Person, Observation, Behaviour, Research, Evidence, Insight, Strategy, Action, Outcome, Learning, Playbook, Task. Hypotheses and friction are record descriptions in V1. They can become dedicated types when actual workflows justify it.

`src/lib/seed.ts`: explicitly fictional linked examples across exchange, protocol, consumer app and RWA. Nothing is represented as real research, clients or revenue. Draft insights and playbooks are not validated findings.

`src/components/workspace.tsx`: command centre, navigation, detail views, capture, search, activity filters, export. `src/app/globals.css`: responsive research interface.

## Routes and navigation

One `/` workspace route. Shareable hash locations: `/#view=Companies`, `/#view=Research`, `/#view=Strategies`, `/#view=Pipeline`, `/#view=Knowledge`, `/#view=Activity`, `/#record=nova`. Browser back/forward restores the view. Sidebar also includes People and Observations. Behaviour and Evidence are discoverable in Observations and global search. Actions, outcomes and tasks are reachable through connected records and search.

## Functional

Quick Capture creates every supported kind, validates required fields/source URL, records timestamp/contributor, optionally attaches a directed relationship and logs activity. Companies allow commercial status updates with history. Global search matches fields and one-hop connections; directory filters restrict status/type. Activity filters cover contributor, company, strategy, type and date. Details show direct incoming/outgoing edges and reachable history. Traversal does not expand shared contributor Person nodes, preventing unrelated company histories from being joined through internal team members.

Browser localStorage key: `ifagrithm-memory-v1`. Writes are explicit; failed storage does not report success. Export memory downloads JSON for backup. Data is not shared between browsers. Clearing browser storage removes captured work. No automatic reset/delete operation.

## PostgreSQL / Supabase migration

Keep stable record IDs. Create `records`, `relationships` and `activity` tables with foreign keys on relationship endpoints and activity record IDs, plus timestamps/indexes. Replace browser loading/commit functions with a repository adapter and transactional writes. Add workspace IDs, authenticated contributors and row-level access before real shared use. Later normalise specialized company fields and relationships, and introduce full-text search. UI consumes typed Memory rather than database rows.

## Intentionally V2

Authentication/permissions, collaborative persistence, verified users, evidence uploads, record editing/merging/deleting, imports, monetary accounting, strategy response-rate reporting, validated playbook promotion, semantic search, interactive graph canvas, integrations and notifications. Contributor is manually stated in this unauthenticated prototype; it is not an audited identity. Evidence supports notes and URL references, not uploaded screenshots/datasets.

Do not deploy this unauthenticated prototype with sensitive company information. Robots metadata discourages indexing but provides no access control.

## Brand and motion

Original symbol downloaded from https://www.ifagrithm.xyz/assets/brand-symbol-transparent.png, stored locally in `public/brand-symbol-transparent.png`. The live public website informed the warm-white palette, dot grid, gold accents, floating symbol and moving evidence trail. The website itself is unchanged.

Light/dark toggle and pause/play controls persist in browser preferences. CSS honours prefers-reduced-motion. `memory-motion.tsx` displays clickable connected demonstration records; it is an illustrative operating sequence, while record detail edges preserve exact relationship labels. No animation libraries added.
