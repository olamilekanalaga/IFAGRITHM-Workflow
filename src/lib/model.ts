import type { InterventionFields } from "./intervention-model";
export const kinds = [
  "Company",
  "Person",
  "Observation",
  "Behaviour",
  "Research",
  "Evidence",
  "Insight",
  "Strategy",
  "Action",
  "Outcome",
  "Learning",
  "Playbook",
  "Task",
  "Decision",
  "Content",
  "Delivery",
  "Problem",
] as const;
export type Kind = (typeof kinds)[number];
export type RecordItem = InterventionFields & {
  id: string;
  kind: Kind;
  title: string;
  body: string;
  status: string;
  owner: string;
  createdAt: string;
  website?: string;
  observedAt?: string;
  behaviourLabel?: string;
  behaviourDetail?: string;
  category?: string;
  confidence?: string;
  source?: string;
  workflowStage?: OperatingStage;
  disposition?: Disposition;
  approachRoute?: string;
  contentFormat?: string;
  assigneeRole?: string;
  researchQuestion?: string;
  observedFacts?: string;
  actors?: string;
  encouragedBehaviour?: string;
  publicUnknowns?: string;
  problemState?: "Hypothesis" | "Client-confirmed";
  validationEvidenceId?: string;
  evidenceType?: string;
  currentSolution?: string;
  clientDecision?: string;
  availableData?: string;
  commercialFit?: string;
  proposalScope?: string;
  analysisApproach?: string;
  deliveryOutput?: string;
  strategyType?: "Research recommendation" | "Outreach strategy";
};
export type Relation = { id: string; from: string; to: string; label: string };
export type Activity = {
  id: string;
  recordId: string;
  actor: string;
  date: string;
  description: string;
};
export type Memory = {
  version: 1;
  records: RecordItem[];
  relations: Relation[];
  activity: Activity[];
};
export const operatingStages = [
  "Discover",
  "Investigate",
  "Decide",
  "Approach",
  "Convert",
  "Deliver",
  "Learn",
] as const;
export type OperatingStage = (typeof operatingStages)[number];
export const dispositions = [
  "Pending",
  "Archive / Knowledge",
  "Content",
  "Potential client",
  "Commercial + Content",
] as const;
export type Disposition = (typeof dispositions)[number];
export const approachRoutes = [
  "Direct IFAGRITHM DM",
  "KOL introduction",
  "BD introduction",
  "Founder introduction",
  "VC / Ecosystem introduction",
] as const;
export const contentFormats = [
  "Behaviour Post",
  "Technical Post",
  "Campaign Breakdown",
  "Decision Brief",
  "Research Article",
] as const;
export const sections = [
  "Command Centre",
  "Discover",
  "Companies",
  "Research",
  "Content",
  "Pipeline",
  "Delivery",
  "Knowledge",
] as const;
export const statuses = [
  "Discovered",
  "Observed",
  "Researching",
  "Qualified",
  "Contacted",
  "Replied",
  "Conversation",
  "Opportunity",
  "Client",
  "Delivery",
  "Completed",
  "Lost",
  "No Response",
  "Not Qualified",
  "Future Opportunity",
];
export function neighbours(memory: Memory, id: string) {
  return memory.relations.filter((r) => r.from === id || r.to === id);
}
export function relatedIds(memory: Memory, id: string) {
  const found = new Set([id]);
  const queue = [id];
  while (queue.length) {
    const current = queue.shift()!;
    if (
      current !== id &&
      memory.records.find((r) => r.id === current)?.kind === "Person"
    )
      continue;
    for (const link of neighbours(memory, current)) {
      const next = link.from === current ? link.to : link.from;
      if (!found.has(next)) {
        found.add(next);
        queue.push(next);
      }
    }
  }
  return found;
}
export function search(memory: Memory, query: string) {
  const q = query.toLowerCase().trim();
  const direct = memory.records.filter((r) =>
    Object.values(r).join(" ").toLowerCase().includes(q),
  );
  if (!q) return direct;
  const ids = new Set(direct.map((r) => r.id));
  for (const edge of memory.relations)
    if (ids.has(edge.from) || ids.has(edge.to)) {
      const match = memory.records.find(
        (r) => r.id === (ids.has(edge.from) ? edge.to : edge.from),
      );
      if (match && !direct.some((r) => r.id === match.id)) direct.push(match);
    }
  return direct;
}
export function capture(
  memory: Memory,
  item: RecordItem,
  related: string,
  label: string,
): Memory {
  if (memory.records.some((r) => r.id === item.id))
    throw new Error("Duplicate record");
  if (related && !memory.records.some((r) => r.id === related))
    throw new Error("Missing related record");
  return {
    ...memory,
    records: [item, ...memory.records],
    relations: related
      ? [
          ...memory.relations,
          { id: crypto.randomUUID(), from: related, to: item.id, label },
        ]
      : memory.relations,
    activity: [
      {
        id: crypto.randomUUID(),
        recordId: item.id,
        actor: item.owner,
        date: item.createdAt,
        description: `Captured ${item.kind.toLowerCase()}: ${item.title}`,
      },
      ...memory.activity,
    ],
  };
}
