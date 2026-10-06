# Stage 1A design system

This is a visual pass on the existing Worker/Admin application. Company identity, observation/source relationships, duplicate handling, authorship, permissions, API actions, database migrations and routes remain unchanged. Supabase and Google activation remain a separate step.

## One layout, three skins

| Skin | Canvas and type | Density | Colour mode |
| --- | --- | --- | --- |
| Ifagrithm (default) | Charcoal, clear sans serif, restrained yellow | Standard | Dark / Light / System |
| Paper | Warm paper grain, pastel objects, fine rules, editorial labels | Shared directory geometry | Light |
| Terminal | Dark technical grid, monospace, restrained technical borders | Shared directory geometry; compact supporting UI | Dark |

The Paper reference is https://paperdao.vercel.app/ (also supplied as https://www.paperdao.xyz/). We borrow atmosphere rather than branding, content or assets. The local paper texture is a small procedural SVG. Fonts use system stacks without external requests. The supplied Superteam UK mobile screenshot now guides component hierarchy: large metric objects, interactive behaviour cards, logo-led project cards and persistent bottom navigation. Paper influences the environment; it does not flatten the information into table cells. No reference branding, copy or assets are reused.

Every CompanyCard renders the same company, category, domain, latest behaviour, source/date, adaptive value, behavioural history, status and observation count. Themes change CSS values only. Displayed counts derive from existing records; demonstrations remain explicitly fictional and read-only.

## Where to change presentation

- `src/app/themes.css`: central semantic tokens and shared Stage 1A layout. Tokens cover surfaces, ink, rules, accents, fonts, sizes, shadows, radii, spacing and textures. Theme selectors contain values; shared component selectors contain structure.
- `src/components/directory-visuals.tsx`: shared `MetricCards`, `BehaviourCards`, `ProjectCard`, `MobileNavigation` and native SVG icons. Company, observation and profile data are passed into presentation components without mutation.
- `src/components/company-card.tsx`: worker/admin adapter to `ProjectCard`, with the stored-logo URL extension point, existing optional domain-provider support and initials fallback. The older `/demo` directory uses the same presentation component. No new identity field or paid integration is added.
- `src/components/appearance.tsx`: root preference provider and non-modal switcher. Radio choices work with keyboard navigation. Escape closes and restores trigger focus; clicking outside or leaving the popover closes it.
- `src/lib/presentation.ts`: deterministic UTC dates/timestamps, keeping Vercel server HTML and browser hydration consistent. Stored ISO timestamps remain unchanged.
- `src/lib/appearance.ts`: versioned preference format, validation, legacy migration, colour-mode resolution and static pre-paint bootstrap.
- `public/themes/paper-grain.svg`: locally generated monochrome texture.
- `src/app/globals.css`: retained existing application styles; the theme stylesheet is loaded after it to keep this pass isolated from older prototypes.

`--surface-*`, `--ink*`, `--rule*` and `--accent*` define colour roles. `--font-*` and `--type-*` define typography. `--space-*` controls density, while `--radius-*`, `--shadow-*` and `--canvas-texture*` provide surface treatment. The `--sc-*` names are compatibility aliases to the semantic tokens.

## Information objects and mobile navigation

Metric and entity geometry stays the same across skins: 16px metric radius, 18px project radius, shared directory gutters and spacing. Four `--tone-*` values supply theme-specific muted surfaces; `--object-border`, `--object-shadow` and `--arrow-surface` supply border, depth and arrow treatment. Tones are decorative, not confidence, status or research signals. Actual status remains text.

Overview metrics are buttons with record-derived counts. Companies opens the directory; Categories focuses the category filter; Approached and Completed open their existing status views. Behaviour cards filter companies by existing observations. The company remains one canonical entity with many observations; missing behaviour values stay omitted.

The company grid is two columns on 380–700px phones and one below 380px. It uses the existing tablet/desktop breakpoints above that. Worker phones show a fixed safe-area-aware navigation: Overview, Observe, Directory and My Work, with Profile accessible from the header. The older local demonstration has Overview, Observe and Directory because it has no authenticated My Work model. Admin retains its separate administrative navigation. Content has bottom padding so navigation does not cover final controls.

## Preference persistence

The demo stores only appearance in `ifagrithm-appearance-v1`:

```json
{ "version": 1, "theme": "ifagrithm", "mode": "dark" }
```

The earlier `ifagrithm-theme` light preference is read as a migration fallback; saved company memory (`ifagrithm-memory-v1`) is never changed. Invalid appearance data falls back safely. Storage denial leaves the selection available for the visit and reports that it cannot be persisted. Other tabs receive preference changes through the storage event. System mode responds to operating-system colour changes. Switching to Paper/Terminal keeps the Ifagrithm mode preference for switching back.

A future profile preference adapter should return this typed `Appearance` value and persist it through an authenticated profile endpoint. Keep preference validation separate from workspace authority. No preference field, database migration, role change or Supabase write is introduced now.

## Verification

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Run `npm run start` and open `/demo/worker`, `/demo/admin`, `/sign-in`, and `/demo`. Check theme persistence after reload and route changes, filter/draft preservation while switching, company → observation → author navigation, native radio keyboard controls and Escape focus restoration. Review 320px, 390px, 768px and desktop layouts in all themes. Read-only previews cannot verify real Google provider configuration or uploads; those remain part of activation.
