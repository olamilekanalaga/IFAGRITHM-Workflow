"use client";
import { Memory, OperatingStage, operatingStages } from "@/lib/model";
import { breakdown, stageRecords } from "@/lib/operations";
const details: Record<
  OperatingStage,
  { view: string; unit: string; owner: string; copy: string }
> = {
  Discover: {
    view: "Discover",
    unit: "observations",
    owner: "Research Scout",
    copy: "Observe behaviour. Capture the company, category and source.",
  },
  Investigate: {
    view: "Research",
    unit: "investigations",
    owner: "Research Scout",
    copy: "What happened? Who acted? What can and can’t we know publicly?",
  },
  Decide: {
    view: "Decisions",
    unit: "pending decisions",
    owner: "Ola + Analyst as needed",
    copy: "Archive, content, potential client — or both content and commercial.",
  },
  Approach: {
    view: "Pipeline",
    unit: "companies",
    owner: "Ola / introductions",
    copy: "Direct DM, KOL, BD, founder or ecosystem introduction.",
  },
  Convert: {
    view: "Pipeline",
    unit: "companies",
    owner: "Ola",
    copy: "Discovery → actual problem → commercial fit → scope / proposal.",
  },
  Deliver: {
    view: "Delivery",
    unit: "engagements",
    owner: "Research Scout + Analyst",
    copy: "Research, analysis where required, findings and client deliverables.",
  },
  Learn: {
    view: "Knowledge",
    unit: "learning records",
    owner: "The team",
    copy: "Record outcomes, what worked and what failed. Feed learning into Discover.",
  },
};
export default function OperatingBoard({
  memory,
  navigate,
}: {
  memory: Memory;
  navigate: (view: string, stage?: OperatingStage) => void;
}) {
  return (
    <section
      className="operating-board"
      aria-label="Company operating workflow"
    >
      <div className="section-heading">
        <h2>The company in motion</h2>
        <span className="muted">Counts come from workspace records</span>
      </div>
      <div className="operating-stages">
        {operatingStages.map((stage, i) => {
          const info = details[stage];
          const records = stageRecords(memory, stage);
          return (
            <button
              className="operating-stage"
              key={stage}
              onClick={() => navigate(info.view, stage)}
            >
              <div className="stage-label">
                <span>
                  {String(i + 1).padStart(2, "0")} {stage.toUpperCase()}
                </span>
                <span aria-hidden="true">↗</span>
              </div>
              <strong>
                {records.length}
                <small>{info.unit}</small>
              </strong>
              <ul>
                {breakdown(memory, stage)
                  .slice(0, 3)
                  .map(([label, count]) => (
                    <li key={label}>
                      <span>{label}</span>
                      <b>{count}</b>
                    </li>
                  ))}
              </ul>
              <p>{info.owner}</p>
            </button>
          );
        })}
      </div>
      <details className="operating-guide">
        <summary>How the operating stages work</summary>
        <div className="guide-grid">
          {operatingStages.map((stage) => (
            <div key={stage}>
              <h3>{stage}</h3>
              <small>{details[stage].owner}</small>
              <p>{details[stage].copy}</p>
            </div>
          ))}
        </div>
        <p className="epistemic-note">
          Observed behaviour does not establish a problem. Investigation creates
          questions and hypotheses; discovery with the company can confirm a
          problem.
        </p>
      </details>
      <button className="learn-loop" onClick={() => navigate("Discover")}>
        ↶ LEARN → DISCOVER <span>Outcomes inform the next investigation.</span>
      </button>
    </section>
  );
}
