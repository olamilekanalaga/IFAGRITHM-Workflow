export const roles = ["Research Scout", "Analyst", "Admin"] as const;
export type Role = (typeof roles)[number];
export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  avatar_path: string | null;
  role: Role;
  requested_role: Role;
  access_status: "Pending" | "Approved" | "Suspended";
  setup_complete: boolean;
  is_owner: boolean;
  created_at: string;
};
export type Company = {
  id: string;
  name: string;
  domain: string;
  category: string;
  status: string;
  created_by: string;
  created_at: string;
  merged_into: string | null;
};
export type Observation = {
  id: string;
  company_id: string;
  behaviour: string;
  description: string;
  detail: string;
  observed_on: string;
  submitted_by: string;
  created_at: string;
  deleted_at: string | null;
  merged_into: string | null;
  duplicate_override: boolean;
};
export type ObservationSource = {
  id: string;
  observation_id: string;
  url: string;
  normalized_url: string;
  submitted_by: string;
  created_at: string;
  deleted_at: string | null;
};
export type LogEntry = {
  id: string;
  actor_id: string;
  event: string;
  entity_id: string;
  created_at: string;
  details: Record<string, unknown>;
};
export type Snapshot = {
  profile: Profile;
  profiles: Profile[];
  companies: Company[];
  observations: Observation[];
  sources: ObservationSource[];
  activity: LogEntry[];
  email: string;
};
export function suggestedUsername(email: string) {
  const name = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
  return name.length >= 3 ? name : `${name || "scout"}_user`;
}
export function normalizedSource(value: string) {
  const u = new URL(value.trim());
  if (!["https:", "http:"].includes(u.protocol) || u.username || u.password)
    throw Error("Use a complete http or https source URL.");
  u.hash = "";
  u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
  for (const key of [...u.searchParams.keys()])
    if (
      /^utm_/i.test(key) ||
      ["s", "ref", "fbclid", "gclid"].includes(key.toLowerCase())
    )
      u.searchParams.delete(key);
  if (
    ["twitter.com", "mobile.twitter.com", "mobile.x.com"].includes(u.hostname)
  )
    u.hostname = "x.com";
  u.searchParams.sort();
  u.pathname = u.pathname.replace(/\/$/, "") || "/";
  return u.href;
}
export function canEnter(profile: Profile) {
  return profile.access_status === "Approved" && profile.setup_complete;
}
export function canAdmin(profile: Profile) {
  return canEnter(profile) && profile.role === "Admin";
}
export function recentObservations(s: Snapshot, id: string) {
  return s.observations
    .filter((o) => o.company_id === id && !o.deleted_at && !o.merged_into)
    .sort(
      (a, b) =>
        b.observed_on.localeCompare(a.observed_on) ||
        b.created_at.localeCompare(a.created_at),
    );
}
export function duplicateObservations(s: Snapshot, id: string, url: string) {
  const norm = normalizedSource(url);
  const ids = new Set(
    s.sources
      .filter((source) => !source.deleted_at && source.normalized_url === norm)
      .map((source) => source.observation_id),
  );
  return recentObservations(s, id).filter((o) => ids.has(o.id));
}
