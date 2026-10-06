"use client";
import {
  approachRoutes,
  dispositions,
  Memory,
  operatingStages,
  RecordItem,
} from "@/lib/model";
import { companyStage, updateRecord } from "@/lib/operations";
export default function CompanyWorkflow({
  memory,
  record,
  commit,
}: {
  memory: Memory;
  record: RecordItem;
  commit: (memory: Memory) => void;
}) {
  const update = (patch: Partial<RecordItem>) =>
    commit(updateRecord(memory, record.id, patch));
  if (record.kind === "Decision")
    return (
      <section className="workflow-controls">
        <h2>Commercial / content decision</h2>
        <p className="muted">
          Research may support either branch or both. A commercial decision does
          not validate a client problem.
        </p>
        <label>
          Disposition
          <select
            value={record.disposition || "Pending"}
            onChange={(e) =>
              update({
                disposition: e.target.value as RecordItem["disposition"],
                status:
                  e.target.value === "Pending" ? "Pending review" : "Decided",
              })
            }
          >
            {dispositions.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
      </section>
    );
  if (
    ["Content", "Delivery", "Task", "Research", "Action"].includes(record.kind)
  )
    return (
      <section className="workflow-controls">
        <label>
          {record.kind === "Content"
            ? "Content queue status"
            : record.kind + " status"}
          <select
            value={record.status}
            onChange={(e) => update({ status: e.target.value })}
          >
            {Array.from(
              new Set([
                record.status,
                ...(record.kind === "Content"
                  ? [
                      "Idea",
                      "Draft",
                      "Ready to publish",
                      "Published",
                      "Archived",
                    ]
                  : record.kind === "Delivery"
                    ? ["Scoped", "Active", "Review", "Completed", "Cancelled"]
                    : [
                        "Open",
                        "Planned",
                        "In progress",
                        "Completed",
                        "Archived",
                        "Cancelled",
                      ]),
              ]),
            ).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <>
          {record.kind === "Task" && (
            <label>
              Assignment queue
              <select
                value={record.assigneeRole || ""}
                onChange={(e) => update({ assigneeRole: e.target.value })}
              >
                <option value="">General</option>
                <option>Ola</option>
                <option>Analyst</option>
                <option>Scout</option>
              </select>
            </label>
          )}
        </>
        {record.contentFormat && (
          <p className="muted">Format: {record.contentFormat}</p>
        )}
        {record.analysisApproach && (
          <p className="muted">Analysis: {record.analysisApproach}</p>
        )}
        {record.deliveryOutput && (
          <p className="muted">Deliverable: {record.deliveryOutput}</p>
        )}
      </section>
    );
  if (record.kind !== "Company") return null;
  return (
    <section className="workflow-controls">
      <h2>Company operating state</h2>
      <div className="control-grid">
        <label>
          Operating stage
          <select
            value={companyStage(record)}
            onChange={(e) =>
              update({
                workflowStage: e.target.value as RecordItem["workflowStage"],
              })
            }
          >
            {operatingStages.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Approach route
          <select
            value={record.approachRoute || ""}
            onChange={(e) => update({ approachRoute: e.target.value })}
          >
            <option value="">Not selected</option>
            {approachRoutes.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="epistemic-note">
        Stage tracks company work. It is not evidence that the company has a
        problem, budget or intent to buy.
      </p>
      {["Convert", "Deliver"].includes(companyStage(record)) && (
        <form
          className="discovery-notes"
          key={record.id}
          onSubmit={(e) => {
            e.preventDefault();
            const values = new FormData(e.currentTarget);
            update({
              currentSolution: String(values.get("currentSolution")),
              clientDecision: String(values.get("clientDecision")),
              availableData: String(values.get("availableData")),
              commercialFit: String(values.get("commercialFit")),
              proposalScope: String(values.get("proposalScope")),
            });
          }}
        >
          <h3>Discovery / commercial fit</h3>
          <p className="muted">
            Document what the company says. Use a linked Problem record and
            conversation evidence to confirm a problem.
          </p>
          {(
            [
              ["currentSolution", "Current solution"],
              ["clientDecision", "Decision they need to make"],
              ["availableData", "Data available"],
              ["commercialFit", "Budget / commercial fit"],
              ["proposalScope", "Scope / proposal"],
            ] as const
          ).map(([field, label]) => (
            <label key={field}>
              {label}
              <textarea
                name={field}
                defaultValue={record[field] || ""}
                rows={2}
              />
            </label>
          ))}
          <button className="primary" type="submit">
            Save discovery notes
          </button>
        </form>
      )}
    </section>
  );
}
