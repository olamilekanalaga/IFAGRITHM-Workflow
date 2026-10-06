export const interventionStatuses = ["Unknown", "Active", "Ended"] as const;
export const intentBases = ["Unknown", "Declared", "Inferred"] as const;
export type InterventionStatus = (typeof interventionStatuses)[number];
export type IntentBasis = (typeof intentBases)[number];
// Additional context on an observation; never the company's commercial status.
export type InterventionFields = {
  resource?: string;
  desired_behaviour?: string;
  intent_basis?: IntentBasis;
  started_on?: string | null;
  intervention_status?: InterventionStatus;
};
export type InterventionInput = {
  resource: string;
  desiredBehaviour: string;
  intentBasis: IntentBasis;
  startedOn: string;
  interventionStatus: InterventionStatus;
};
export const emptyIntervention: InterventionInput = {
  resource: "",
  desiredBehaviour: "",
  intentBasis: "Unknown",
  startedOn: "",
  interventionStatus: "Unknown",
};
export function normalizeIntervention(
  input: Partial<InterventionInput>,
): InterventionInput {
  const field = (value: unknown, max: number) => {
    if (value === undefined || value === null) return "";
    if (typeof value !== "string" || value.length > max)
      throw Error("Intervention context exceeds the field limit.");
    return value.trim();
  };
  const resource = field(input.resource, 200),
    desiredBehaviour = field(input.desiredBehaviour, 80),
    startedOn = field(input.startedOn, 10);
  const intentBasis = input.intentBasis || "Unknown",
    interventionStatus = input.interventionStatus || "Unknown";
  if (
    !intentBases.includes(intentBasis) ||
    !interventionStatuses.includes(interventionStatus)
  )
    throw Error("Choose a valid intervention status and objective basis.");
  if (desiredBehaviour && intentBasis === "Unknown")
    throw Error("Mark the desired behaviour as Declared or Inferred.");
  if (
    startedOn &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(startedOn) ||
      +startedOn.slice(0, 4) < 1 ||
      !Number.isFinite(Date.parse(startedOn + "T00:00:00Z")) ||
      new Date(startedOn + "T00:00:00Z").toISOString().slice(0, 10) !==
        startedOn)
  )
    throw Error("Choose a valid intervention start date, or leave it unknown.");
  return {
    resource,
    desiredBehaviour,
    intentBasis: desiredBehaviour ? intentBasis : "Unknown",
    startedOn,
    interventionStatus,
  };
}
export function storedIntervention(
  input: Partial<InterventionInput>,
): InterventionFields {
  const v = normalizeIntervention(input);
  return {
    resource: v.resource,
    desired_behaviour: v.desiredBehaviour,
    intent_basis: v.intentBasis,
    started_on: v.startedOn || null,
    intervention_status: v.interventionStatus,
  };
}
