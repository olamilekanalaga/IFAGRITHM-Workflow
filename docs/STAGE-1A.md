# Stage 1A implementation boundary

Google authentication → editable first-login profile → admin-approved worker access → company selection/create → observation + sources → directory → contributor history.

Four core tables:

| Table | Identity and relationships |
| --- | --- |
| profiles | Stable `auth.users.id`; unique editable username; display name/image; actual role and requested role are separate. Full email remains private in Supabase Auth. |
| companies | Permanent UUID, human-readable name, unique normalized domain, category and commercial status. Names are not unique. |
| observations | Permanent UUID; company FK; behaviour/event; observed date; server timestamp; authenticated submitter FK. Many observations belong to one company. |
| observation_sources | Permanent UUID; observation FK; URL and normalized URL; authenticated source contributor FK. Multiple sources can support one observation. |

An additional activity log records meaningful contributions and admin changes. It does not monitor sessions, browsing or work hours.

Permissions:

- Anonymous: sign-in and fictional demonstration only; no internal table access.
- Pending/Suspended: own profile setup; no companies, observations or sources.
- Approved Scout/Analyst: worker app, submit observations, attach sources, browse company and contributor history.
- Approved Admin: worker app plus protected `/admin`, account approval/role assignment, category/status corrections, reviewed merges, soft removal and activity review.
- Owner is an Admin with a protected owner flag, bootstrapped deliberately by a project administrator. First registrant is never automatically Admin.

Duplicate handling:

- Existing company lookup displays name + domain + category.
- Company domains enforce canonical reuse in PostgreSQL, including concurrent capture. Same-name companies at different domains remain separate.
- Same company + normalized source produces a possible-duplicate response. Nothing new is created until the worker views the existing record or explicitly submits as new.
- Recent observations expose related events for human review. Alternate URLs can be added to an existing observation.
- Source contributors remain distinct from the original observation author. Merges retain original contributor IDs and log the review reason.

Worker navigation: Overview, Observe, Directory, My Work, Profile. No system administration for workers. Admin has a separate route and navigation. Research remains later.

The public website and private research Terminal remain separate. No internal record or profile has an anonymous/public read policy. Intentional publication needs a separate, curated publication model later.

Acceptance checks: Google callback, first profile setup, pending account blocked, admin approval, unique username collision, automatic authorship, same-name/different-domain companies, same-source warning/override, additional source on one event, merging history, admin authorization, mobile layout and production build.
