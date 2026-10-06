import {
  normalizeIntervention,
  storedIntervention,
  type InterventionInput,
} from "./intervention-model";
import { Memory, RecordItem } from "./model";
export const behaviours = [
  "Bounty",
  "KOL Campaign",
  "Fundraise",
  "Trading Competition",
  "Grant",
  "Ambassador",
  "Partnership",
];
export const categories = [
  "Protocol",
  "Consumer App",
  "RWA",
  "Infrastructure",
  "Exchange",
  "Ecosystem",
];
export const directoryStatuses = [
  "Saved",
  "Researching",
  "Approached",
  "Conversation",
  "Completed",
];
export function domainOf(value: string) {
  if (!value.trim()) return "";
  try {
    const u = new URL(value.includes("://") ? value : `https://${value}`);
    if (
      !["http:", "https:"].includes(u.protocol) ||
      !u.hostname.includes(".") ||
      u.username ||
      u.password
    )
      throw Error();
    return u.hostname
      .toLowerCase()
      .replace(/^www\./, "")
      .replace(/\.$/, "");
  } catch {
    throw new Error("Enter a valid company website, such as example.com.");
  }
}
export function sourceUrl(value: string) {
  try {
    const u = new URL(value);
    if (!["https:", "http:"].includes(u.protocol) || u.username || u.password)
      throw Error();
    return u.href;
  } catch {
    throw new Error("Enter a complete http or https source URL.");
  }
}
export function companyObservations(m: Memory, id: string) {
  const ids = new Set(
    m.relations
      .filter((r) => r.from === id || r.to === id)
      .map((r) => (r.from === id ? r.to : r.from)),
  );
  return m.records
    .filter((r) => r.kind === "Observation" && ids.has(r.id))
    .sort(
      (a, b) =>
        (b.observedAt || b.createdAt)
          .slice(0, 10)
          .localeCompare((a.observedAt || a.createdAt).slice(0, 10)) ||
        b.createdAt.localeCompare(a.createdAt),
    );
}
export function behaviourOf(m: Memory, o: RecordItem) {
  if (o.behaviourLabel) return o.behaviourLabel;
  const ids = new Set(
    m.relations
      .filter((r) => r.from === o.id || r.to === o.id)
      .map((r) => (r.from === o.id ? r.to : r.from)),
  );
  return (
    m.records.find((r) => r.kind === "Behaviour" && ids.has(r.id))?.title ||
    "Other"
  );
}
export function displayStatus(s: string) {
  if (["Discovered", "Observed"].includes(s)) return "Saved";
  if (["Contacted", "Replied"].includes(s)) return "Approached";
  return s;
}
export function approached(s: string) {
  return [
    "Approached",
    "Contacted",
    "Replied",
    "Conversation",
    "Opportunity",
    "Client",
    "Delivery",
    "Completed",
    "No Response",
    "Lost",
  ].includes(s);
}
export function metricLabel(b: string) {
  const k = b.toLowerCase();
  return k.includes("fundrais")
    ? "Raised"
    : k.includes("bounty")
      ? "Bounty"
      : k.includes("competition")
        ? "Prize pool"
        : k.includes("grant")
          ? "Grant pool"
          : k.includes("kol")
            ? "Creators observed"
            : k.includes("partnership")
              ? "Partner"
              : "Detail";
}
export function filterCompanies(
  m: Memory,
  q = "",
  b = "",
  category = "",
  status = "",
) {
  return m.records
    .filter((c) => c.kind === "Company")
    .filter((c) => {
      const obs = companyObservations(m, c.id);
      return (
        (!q ||
          [
            c.title,
            c.category,
            c.website,
            ...obs.flatMap((o) => [o.title, o.body, behaviourOf(m, o)]),
          ]
            .join(" ")
            .toLowerCase()
            .includes(q.toLowerCase())) &&
        (!category || c.category === category) &&
        (!b ||
          obs.some(
            (o) => behaviourOf(m, o).toLowerCase() === b.toLowerCase(),
          )) &&
        (!status ||
          (status === "Not Approached"
            ? !approached(c.status)
            : displayStatus(c.status) === status))
      );
    });
}
export type ObservationInput = Partial<InterventionInput> & {
  companyId?: string;
  company: string;
  website: string;
  category: string;
  behaviour: string;
  description: string;
  source: string;
  detail: string;
  observedAt: string;
  owner: string;
};
export function saveObservation(
  m: Memory,
  input: ObservationInput,
): { memory: Memory; companyId: string } {
  const context = normalizeIntervention(input);
  const company = input.company.trim(),
    behaviour = input.behaviour.trim(),
    category = input.category.trim();
  if (
    !company ||
    !behaviour ||
    !category ||
    !input.description.trim() ||
    !input.owner.trim()
  )
    throw new Error(
      "Complete company, category, behaviour, observation and scout.",
    );
  const source = sourceUrl(input.source),
    domain = domainOf(input.website);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.observedAt) ||
    !Number.isFinite(Date.parse(input.observedAt))
  )
    throw new Error("Choose a valid observation date.");
  if (
    metricLabel(behaviour) === "Creators observed" &&
    input.detail &&
    !/^\d+$/.test(input.detail.trim())
  )
    throw new Error("Creators observed must be a whole number.");
  const companies = m.records.filter((r) => r.kind === "Company");
  let existing = input.companyId
    ? companies.find((c) => c.id === input.companyId)
    : undefined;
  if (input.companyId && !existing)
    throw new Error("Selected company no longer exists.");
  if (!existing && domain)
    existing = companies.find(
      (c) => c.website && domainOf(c.website) === domain,
    );
  if (!existing) {
    const names = companies.filter(
      (c) => c.title.toLowerCase().trim() === company.toLowerCase(),
    );
    if (names.length > 1)
      throw new Error("Choose the existing company explicitly.");
    if (names.length === 1) {
      if (domain && names[0].website && domainOf(names[0].website) !== domain)
        throw new Error(
          "This name already has another domain. Choose the company or use a distinct name.",
        );
      existing = names[0];
    }
  }
  const now = new Date().toISOString(),
    id = () => crypto.randomUUID();
  const c: RecordItem = existing || {
    id: id(),
    kind: "Company",
    title: company,
    body: "Created from a scout observation.",
    category,
    status: "Saved",
    owner: input.owner,
    createdAt: now,
    website: domain ? `https://${domain}` : undefined,
  };
  const label = m.records.find(
    (r) =>
      r.kind === "Behaviour" &&
      r.title.toLowerCase() === behaviour.toLowerCase(),
  ) || {
    id: id(),
    kind: "Behaviour" as const,
    title: behaviour,
    body: "Scout behaviour label.",
    status: "Active",
    owner: input.owner,
    createdAt: now,
  };
  const o: RecordItem = {
    id: id(),
    kind: "Observation",
    title: input.description.trim(),
    body: input.description.trim(),
    status: "Recorded",
    owner: input.owner,
    createdAt: now,
    observedAt: input.observedAt,
    source,
    behaviourLabel: label.title,
    behaviourDetail: input.detail.trim(),
    ...storedIntervention(context),
  };
  const evidence: RecordItem = {
    id: id(),
    kind: "Evidence",
    title: `Source: ${o.title}`,
    body: "Source recorded by scout; not independently verified.",
    status: "Recorded",
    owner: input.owner,
    createdAt: now,
    source,
    evidenceType: "URL",
  };
  const additions = [
    ...(!existing ? [c] : []),
    ...(!m.records.some((r) => r.id === label.id) ? [label] : []),
    o,
    evidence,
  ];
  return {
    companyId: c.id,
    memory: {
      ...m,
      records: [...m.records, ...additions],
      relations: [
        ...m.relations,
        { id: id(), from: c.id, to: o.id, label: "observed in" },
        { id: id(), from: o.id, to: label.id, label: "exhibits" },
        { id: id(), from: evidence.id, to: o.id, label: "supports" },
      ],
      activity: [
        {
          id: id(),
          recordId: o.id,
          actor: input.owner,
          date: now,
          description: `Observed ${label.title} at ${c.title}`,
        },
        ...m.activity,
      ],
    },
  };
}
