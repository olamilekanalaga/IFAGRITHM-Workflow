import type { Snapshot } from "./identity";
import type { Memory } from "./model";
import type {
  InterventionFields,
  InterventionStatus,
  IntentBasis,
} from "./intervention-model";
import { behaviourOf, companyObservations } from "./scout";
export type InterventionRow = {
  id: string;
  companyId: string;
  project: string;
  domain: string;
  category: string;
  intervention: string;
  resource: string;
  desiredBehaviour: string;
  intentBasis: IntentBasis;
  startedOn: string | null;
  status: InterventionStatus;
  observedOn: string;
  description: string;
  sourceCount: number;
};
// Reuse only an existing monetary pool/raised amount. Creator counts and partner names are not resources.
function resourceOf(
  fields: InterventionFields,
  label: string,
  detail?: string,
) {
  if (fields.resource?.trim()) return fields.resource.trim();
  if (!detail?.trim()) return "";
  if (/bounty|competition|grant/i.test(label)) return detail.trim();
  if (/fundrais/i.test(label)) return `Raised: ${detail.trim()}`;
  return "";
}
function context(fields: InterventionFields, label: string, detail?: string) {
  const desired = fields.desired_behaviour?.trim() || "";
  return {
    resource: resourceOf(fields, label, detail),
    desiredBehaviour: desired,
    intentBasis:
      desired &&
      (fields.intent_basis === "Declared" || fields.intent_basis === "Inferred")
        ? fields.intent_basis
        : ("Unknown" as IntentBasis),
    startedOn: fields.started_on || null,
    status: fields.intervention_status || ("Unknown" as InterventionStatus),
  };
}
export function snapshotInterventions(s: Snapshot): InterventionRow[] {
  return s.observations
    .filter((o) => !o.deleted_at && !o.merged_into)
    .flatMap((o) => {
      const c = s.companies.find(
        (c) => c.id === o.company_id && !c.merged_into,
      );
      return c
        ? [
            {
              id: o.id,
              companyId: c.id,
              project: c.name,
              domain: c.domain,
              category: c.category,
              intervention: o.behaviour,
              ...context(o, o.behaviour, o.detail),
              observedOn: o.observed_on,
              description: o.description,
              sourceCount: s.sources.filter(
                (src) => src.observation_id === o.id && !src.deleted_at,
              ).length,
            },
          ]
        : [];
    })
    .sort((a, b) => b.observedOn.localeCompare(a.observedOn));
}
export function memoryInterventions(m: Memory): InterventionRow[] {
  const seen = new Set<string>();
  return m.records
    .filter((c) => c.kind === "Company")
    .flatMap((c) =>
      companyObservations(m, c.id)
        .filter((o) => !seen.has(o.id))
        .map((o) => {
          seen.add(o.id);
          const label = behaviourOf(m, o);
          return {
            id: o.id,
            companyId: c.id,
            project: c.title,
            domain: c.website || "",
            category: c.category || "",
            intervention: label,
            ...context(o, label, o.behaviourDetail),
            observedOn: (o.observedAt || o.createdAt).slice(0, 10),
            description: o.body || o.title,
            sourceCount: o.source ? 1 : 0,
          };
        }),
    )
    .sort((a, b) => b.observedOn.localeCompare(a.observedOn));
}
export function filterInterventions(
  rows: InterventionRow[],
  query = "",
  intervention = "",
  status = "",
  desired = "",
) {
  const q = query.trim().toLowerCase();
  return rows.filter(
    (r) =>
      (!q ||
        [
          r.project,
          r.domain,
          r.category,
          r.intervention,
          r.resource,
          r.desiredBehaviour,
          r.intentBasis,
          r.startedOn,
          r.status,
          r.description,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)) &&
      (!intervention ||
        r.intervention.toLowerCase() === intervention.toLowerCase()) &&
      (!status || r.status === status) &&
      (!desired ||
        (desired === "__unknown"
          ? !r.desiredBehaviour
          : r.desiredBehaviour
              .split(/\s*\/\s*/)
              .some((v) => v.toLowerCase() === desired.toLowerCase()))),
  );
}
