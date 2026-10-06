"use client";
import { ReactNode } from "react";
export function WorkspaceIcon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    Overview: (
      <>
        <path d="M3 11 12 3l9 8v10h-6v-7H9v7H3z" />
      </>
    ),
    Observe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
    Directory: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    "My Work": (
      <>
        <path d="M8 4h8v3H8zM7 5H4v16h16V5h-3M8 12h8M8 16h5" />
      </>
    ),
    Categories: (
      <>
        <path d="m12 3 9 9-9 9-9-9zM8 12h8" />
      </>
    ),
    Approached: (
      <>
        <path d="M5 18 19 4M9 4h10v10M5 8v12h12" />
      </>
    ),
    Completed: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m7 12 3 3 7-7" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.Directory}
    </svg>
  );
}
export function MetricCards({
  metrics,
}: {
  metrics: { label: string; count: number; open: () => void }[];
}) {
  return (
    <div className="metric-cards" aria-label="Workspace overview">
      {metrics.map((metric, index) => (
        <button
          type="button"
          className={`metric-card tone-${index % 4}`}
          key={metric.label}
          onClick={metric.open}
          aria-label={`${metric.label}: ${metric.count}. Explore directory.`}
        >
          <span className="metric-icon">
            <WorkspaceIcon name={metric.label} />
          </span>
          <span className="metric-label">{metric.label}</span>
          <strong>{metric.count}</strong>
          <span className="metric-arrow" aria-hidden="true">
            ↗
          </span>
        </button>
      ))}
    </div>
  );
}
export function BehaviourCards({
  items,
  selected,
  choose,
}: {
  items: { label: string; count: number }[];
  selected: string;
  choose: (label: string) => void;
}) {
  return (
    <section className="behaviour-section" aria-label="Interventions observed">
      <div className="sc-section-title">
        <h2>Interventions observed</h2>
        <span>Tap an intervention to explore</span>
      </div>
      <div className="behaviour-cards">
        {items
          .filter((item) => item.count > 0)
          .map((item, index) => (
            <button
              type="button"
              className={`behaviour-card tone-${index % 4}`}
              key={item.label}
              aria-pressed={selected === item.label}
              onClick={() => choose(item.label)}
            >
              <span>{item.label}</span>
              <strong>{item.count}</strong>
              <span className="behaviour-arrow" aria-hidden="true">
                ↗
              </span>
            </button>
          ))}
      </div>
      <p className="directory-filter-note">
        Counts refer to observations. Multiple sources count as one event.
      </p>
    </section>
  );
}
export function MobileNavigation({
  current,
  navigate,
  legacy = false,
}: {
  current: string;
  navigate: (screen: string) => void;
  legacy?: boolean;
}) {
  const active = ["Approached", "Completed"].includes(current)
    ? "Directory"
    : current;
  const items = legacy
    ? ["Overview", "Observe", "Directory"]
    : ["Overview", "Observe", "Directory", "My Work"];
  return (
    <nav className="mobile-work-nav" aria-label="Mobile workspace navigation">
      {items.map((item) => (
        <button
          type="button"
          key={item}
          className={item === "Observe" ? "mobile-observe" : ""}
          aria-current={active === item ? "page" : undefined}
          onClick={() => navigate(item)}
        >
          <WorkspaceIcon name={item} />
          <span>{item}</span>
        </button>
      ))}
    </nav>
  );
}
function toneOf(id: string) {
  return (
    [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 4
  );
}
export function ProjectCard({
  id,
  name,
  category,
  domain,
  logo,
  behaviour,
  valueLabel,
  value,
  source,
  date,
  history,
  status,
  count,
  open,
}: {
  id: string;
  name: string;
  category: string;
  domain: string;
  logo: ReactNode;
  behaviour?: string;
  valueLabel?: string;
  value?: string;
  source?: string;
  date?: string;
  history?: string;
  status: string;
  count: number;
  open: () => void;
}) {
  return (
    <button
      type="button"
      className={`sc-card company-card project-card tone-${toneOf(id)}`}
      onClick={open}
    >
      <span className="project-identity-mark">
        {logo}
        <span className="project-mark" aria-hidden="true">
          ↗
        </span>
      </span>
      <span className="company-card-identity">
        <strong>{name}</strong>
        <span>{category}</span>
      </span>
      <span className="company-card-domain">{domain}</span>
      <span className="company-card-observation">
        <small>LATEST INTERVENTION</small>
        <strong>
          <span className="sc-dot" aria-hidden="true" />
          {behaviour || "No observations yet"}
        </strong>
      </span>
      {value && (
        <span className="company-card-value">
          <small>{valueLabel}</small>
          <strong>{value}</strong>
        </span>
      )}
      {history && (
        <span className="company-card-history" title={history}>
          <small>HISTORY</small>
          <span>{history}</span>
        </span>
      )}
      <span className="project-source">
        {behaviour ? source || "No source attached" : "History starts here"}
        {date && <span>{date}</span>}
      </span>
      <span className="sc-card-bottom">
        <span className="company-card-status">{status}</span>
        <span>
          {count} {count === 1 ? "observation" : "observations"}
        </span>
        <span className="project-open" aria-hidden="true">
          →
        </span>
      </span>
    </button>
  );
}
