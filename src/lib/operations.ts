import { Memory, RecordItem, OperatingStage, relatedIds } from "./model";
export function companyStage(record: RecordItem): OperatingStage {
  if (record.workflowStage) return record.workflowStage;
  if (["Client", "Delivery"].includes(record.status)) return "Deliver";
  if (["Replied", "Conversation", "Opportunity"].includes(record.status))
    return "Convert";
  if (["Qualified", "Contacted"].includes(record.status)) return "Approach";
  if (record.status === "Researching") return "Investigate";
  if (
    ["Lost", "No Response", "Not Qualified", "Completed"].includes(
      record.status,
    )
  )
    return "Learn";
  if (record.status === "Future Opportunity") return "Decide";
  return "Discover";
}
export function stageRecords(
  memory: Memory,
  stage: OperatingStage,
): RecordItem[] {
  const open = (r: RecordItem) =>
    !["Completed", "Published", "Archived", "Cancelled"].includes(r.status);
  switch (stage) {
    case "Discover":
      return memory.records.filter((r) => r.kind === "Observation" && open(r));
    case "Investigate":
      return memory.records.filter((r) => r.kind === "Research" && open(r));
    case "Decide":
      return memory.records.filter(
        (r) =>
          r.kind === "Decision" &&
          (!r.disposition || r.disposition === "Pending") &&
          open(r),
      );
    case "Approach":
    case "Convert":
      return memory.records.filter(
        (r) => r.kind === "Company" && companyStage(r) === stage,
      );
    case "Deliver":
      return memory.records.filter((r) => r.kind === "Delivery" && open(r));
    case "Learn":
      return memory.records.filter(
        (r) => ["Learning", "Playbook"].includes(r.kind) && open(r),
      );
  }
}
export function companyFor(memory: Memory, record: RecordItem) {
  if (record.kind === "Company") return record;
  const ids = relatedIds(memory, record.id);
  return memory.records.find((r) => r.kind === "Company" && ids.has(r.id));
}
export function validateProblem(
  memory: Memory,
  record: RecordItem,
  related: string,
) {
  if (record.kind !== "Problem" || record.problemState !== "Client-confirmed")
    return;
  const company = memory.records.find(
    (r) => r.id === related && r.kind === "Company",
  );
  if (
    !company ||
    !["Convert", "Deliver", "Learn"].includes(companyStage(company))
  )
    throw new Error(
      "A client-confirmed problem must link to a company in Convert, Deliver or Learn.",
    );
  const evidence = memory.records.find(
    (r) =>
      r.id === record.validationEvidenceId &&
      r.kind === "Evidence" &&
      r.evidenceType === "Founder / client conversation",
  );
  if (!evidence || !relatedIds(memory, company.id).has(evidence.id))
    throw new Error(
      "Link a founder/client conversation evidence record from this company before confirming a problem.",
    );
}
export function attention(memory: Memory, role: string) {
  return memory.records.filter(
    (r) =>
      r.kind === "Task" &&
      r.assigneeRole === role &&
      !["Completed", "Cancelled", "Archived"].includes(r.status),
  );
}
export function breakdown(memory: Memory, stage: OperatingStage) {
  const records = stageRecords(memory, stage);
  const groups = new Map<string, number>();
  for (const record of records) {
    let label = record.status;
    if (stage === "Discover") {
      const behaviour = memory.relations
        .filter((e) => e.from === record.id || e.to === record.id)
        .map((e) =>
          memory.records.find(
            (r) => r.id === (e.from === record.id ? e.to : e.from),
          ),
        )
        .find((r) => r?.kind === "Behaviour");
      label = behaviour?.title || "Unlabelled behaviour";
    }
    if (stage === "Approach")
      label = record.approachRoute || "Route not selected";
    if (stage === "Deliver") label = record.owner || "Unassigned";
    if (stage === "Learn") label = record.kind;
    groups.set(label, (groups.get(label) || 0) + 1);
  }
  return Array.from(groups.entries());
}
export function updateRecord(
  memory: Memory,
  id: string,
  patch: Partial<RecordItem>,
  actor = "Ola",
): Memory {
  const existing = memory.records.find((r) => r.id === id);
  if (!existing) throw new Error("Record not found");
  const updated = { ...existing, ...patch };
  return {
    ...memory,
    records: memory.records.map((r) => (r.id === id ? updated : r)),
    activity: [
      {
        id: crypto.randomUUID(),
        recordId: id,
        actor,
        date: new Date().toISOString(),
        description: `Updated ${existing.kind.toLowerCase()}: ${existing.title} — ${patch.workflowStage || patch.disposition || patch.status || "operating details"}`,
      },
      ...memory.activity,
    ],
  };
}
export function matchesStage(
  memory: Memory,
  record: RecordItem,
  stage: OperatingStage,
) {
  return record.kind === "Company"
    ? companyStage(record) === stage
    : stageRecords(memory, stage).some((r) => r.id === record.id);
}
export function mergeDemo(memory: Memory, demo: Memory): Memory {
  const ids = new Set(memory.records.map((r) => r.id));
  const additions = demo.records.filter((r) => !ids.has(r.id));
  const allIds = new Set([...ids, ...additions.map((r) => r.id)]);
  const existingLinks = new Set(memory.relations.map((r) => r.id));
  return {
    ...memory,
    records: [...memory.records, ...additions],
    relations: [
      ...memory.relations,
      ...demo.relations.filter(
        (r) =>
          !existingLinks.has(r.id) && allIds.has(r.from) && allIds.has(r.to),
      ),
    ],
    activity: [
      ...memory.activity,
      ...demo.activity.filter((a) =>
        additions.some((r) => r.id === a.recordId),
      ),
    ],
  };
}
