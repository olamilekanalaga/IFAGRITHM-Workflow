"use client";
import Image from "next/image";
import { useState } from "react";
import { Company, Observation } from "@/lib/identity";
import { metricLabel } from "@/lib/scout";
export function CompanyLogo({
  company,
  logoUrl,
}: {
  company: Company;
  logoUrl?: string;
}) {
  const [failed, setFailed] = useState(false);
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;
  const imageUrl =
    logoUrl ||
    (token
      ? `https://img.logo.dev/${company.domain}?token=${encodeURIComponent(token)}&size=128`
      : "");
  return (
    <span
      className="sc-logo"
      aria-label={!imageUrl || failed ? `${company.name} initials` : undefined}
    >
      {imageUrl && !failed ? (
        <Image
          unoptimized
          src={imageUrl}
          width={64}
          height={64}
          alt={`${company.name} logo`}
          onError={() => setFailed(true)}
        />
      ) : (
        company.name.slice(0, 2).toUpperCase()
      )}
    </span>
  );
}
function sourceLabel(source?: string) {
  if (!source) return "No source attached";
  try {
    return new URL(source).hostname.replace(/^www\./, "");
  } catch {
    return "Source attached";
  }
}
// One content structure, shared by every theme and by worker/admin directories.
export function CompanyCard({
  company,
  observations,
  history,
  source,
  open,
}: {
  company: Company;
  observations: Observation[];
  history: string;
  source?: string;
  open: () => void;
}) {
  const latest = observations[0];
  return (
    <button type="button" className="sc-card company-card" onClick={open}>
      <span className="sc-card-top">
        <CompanyLogo company={company} />
        <span className="company-card-identity">
          <strong>{company.name}</strong>
          <span>{company.category}</span>
        </span>
        <span className="sc-arrow" aria-hidden="true">
          ↗
        </span>
      </span>
      <span className="company-card-domain">{company.domain}</span>
      <span className="company-card-observation">
        <small>LATEST OBSERVED BEHAVIOUR</small>
        <strong>
          <span className="sc-dot" aria-hidden="true" />
          {latest?.behaviour || "No observations yet"}
        </strong>
        <span>
          {latest
            ? `${sourceLabel(source)} · ${latest.observed_on}`
            : "Add an observation to begin its history."}
        </span>
      </span>
      {latest?.detail && (
        <span className="company-card-value">
          <small>{metricLabel(latest.behaviour)}</small>
          <strong>{latest.detail}</strong>
        </span>
      )}
      <span className="company-card-history">
        <small>BEHAVIOURAL HISTORY</small>
        <span>{history || "No observations yet"}</span>
      </span>
      <span className="sc-card-bottom">
        <span className="company-card-status">{company.status}</span>
        <span>
          {observations.length}{" "}
          {observations.length === 1 ? "observation" : "observations"}{" "}
          <span aria-hidden="true">→</span>
        </span>
      </span>
    </button>
  );
}
