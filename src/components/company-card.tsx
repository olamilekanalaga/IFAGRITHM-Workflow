"use client";
import Image from "next/image";
import { useState } from "react";
import { Company, Observation } from "@/lib/identity";
import { metricLabel } from "@/lib/scout";
import { ProjectCard } from "./directory-visuals";
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
    <ProjectCard
      id={company.id}
      name={company.name}
      category={company.category}
      domain={company.domain}
      logo={<CompanyLogo company={company} />}
      behaviour={latest?.behaviour}
      valueLabel={latest ? metricLabel(latest.behaviour) : undefined}
      value={latest?.detail}
      source={latest ? sourceLabel(source) : undefined}
      date={latest?.observed_on}
      history={history}
      status={company.status}
      count={observations.length}
      open={open}
    />
  );
}
