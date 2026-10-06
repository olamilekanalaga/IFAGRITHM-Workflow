"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import MemoryMotion from "./memory-motion";
import OperatingBoard from "./operating-board";
import CompanyWorkflow from "./company-workflow";
import {
  attention,
  companyStage,
  validateProblem,
  matchesStage,
  mergeDemo,
} from "@/lib/operations";
import {
  Activity,
  capture,
  Kind,
  kinds,
  Memory,
  neighbours,
  RecordItem,
  relatedIds,
  search,
  sections,
  statuses,
  operatingStages,
  OperatingStage,
  approachRoutes,
  dispositions,
  contentFormats,
} from "@/lib/model";
import { seed } from "@/lib/seed";
const key = "ifagrithm-memory-v1";
const captureDefaults: Partial<Record<Kind, string>> = {
  Company: "Discovered",
  Research: "In progress",
  Decision: "Pending review",
  Content: "Draft",
  Delivery: "Scoped",
  Task: "Open",
  Action: "Planned",
  Problem: "Needs validation",
};
export default function Workspace() {
  const [theme, setTheme] = useState("light");
  const [paused, setPaused] = useState(false);
  const [memory, setMemory] = useState<Memory>(seed);
  const [ready, setReady] = useState(false);
  const [section, setSection] = useState<string>("Command Centre");
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [actor, setActor] = useState("");
  const [company, setCompany] = useState("");
  const [strategy, setStrategy] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("");
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const [captureKind, setCaptureKind] = useState<Kind>("Observation");
  const [captureRelated, setCaptureRelated] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [problemState, setProblemState] = useState("Hypothesis");
  const [captureStatus, setCaptureStatus] = useState("Recorded");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.version !== 1 ||
          !Array.isArray(parsed.records) ||
          !Array.isArray(parsed.relations) ||
          !Array.isArray(parsed.activity)
        )
          throw new Error("Invalid saved memory");
        setMemory(parsed);
      }
    } catch {
      setNotice(
        "Saved memory could not be loaded. Sample data is shown; export before overwriting any saved data.",
      );
    }
    setReady(true);
    const read = () => {
      const p = new URLSearchParams(location.hash.slice(1));
      setSelected(p.get("record") || "");
      setSection(p.get("view") || "Command Centre");
      setStageFilter(
        operatingStages.includes(p.get("stage") as OperatingStage)
          ? p.get("stage")!
          : "",
      );
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  useEffect(() => {
    try {
      setTheme(localStorage.getItem("ifagrithm-theme") || "light");
      setPaused(localStorage.getItem("ifagrithm-motion") === "paused");
    } catch {}
  }, []);
  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      localStorage.setItem("ifagrithm-theme", next);
    } catch {}
  }
  function toggleMotion() {
    setPaused(!paused);
    try {
      localStorage.setItem("ifagrithm-motion", !paused ? "paused" : "playing");
    } catch {}
  }
  function commit(next: Memory) {
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setMemory(next);
      setNotice("Saved to this browser.");
      return true;
    } catch {
      setNotice("Storage unavailable or full. Changes were not saved.");
      return false;
    }
  }
  function open(id: string) {
    location.hash = `record=${encodeURIComponent(id)}`;
    setSelected(id);
    setQuery("");
  }
  function beginCapture(kind: Kind = "Observation") {
    setNotice("");
    setCaptureKind(kind);
    setCaptureStatus(captureDefaults[kind] || "Recorded");
    setCaptureRelated(selected);
    setProblemState("Hypothesis");
    dialog.current?.showModal();
  }
  function navigate(view: string, stage?: OperatingStage) {
    setStageFilter(stage || "");
    location.hash = `view=${encodeURIComponent(view)}${stage ? `&stage=${stage}` : ""}`;
    setSection(view);
    setSelected("");
    setQuery("");
    setStatus("");
    setType("");
  }
  function exportMemory() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(memory, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "ifagrithm-memory.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const title = String(values.get("title")).trim();
    if (!title) return;
    const source = String(values.get("source")).trim();
    if (source) {
      try {
        const url = new URL(source);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      } catch {
        setNotice("Source must be a valid https:// or http:// URL.");
        return;
      }
    }
    const item: RecordItem = {
      id: crypto.randomUUID(),
      kind: captureKind,
      title,
      body: String(values.get("body")).trim(),
      owner: String(values.get("owner")).trim(),
      status: String(values.get("status")),
      source,
      confidence: String(values.get("confidence")),
      createdAt: new Date().toISOString(),
      disposition: String(
        values.get("disposition") || "Pending",
      ) as RecordItem["disposition"],
      approachRoute: String(values.get("approachRoute") || ""),
      contentFormat: String(values.get("contentFormat") || ""),
      assigneeRole: String(values.get("assigneeRole") || ""),
      researchQuestion: String(values.get("researchQuestion") || ""),
      observedFacts: String(values.get("observedFacts") || ""),
      actors: String(values.get("actors") || ""),
      encouragedBehaviour: String(values.get("encouragedBehaviour") || ""),
      publicUnknowns: String(values.get("publicUnknowns") || ""),
      problemState: problemState as RecordItem["problemState"],
      validationEvidenceId: String(values.get("validationEvidenceId") || ""),
      evidenceType: String(values.get("evidenceType") || ""),
      category: String(values.get("category") || ""),
      analysisApproach: String(values.get("analysisApproach") || ""),
      deliveryOutput: String(values.get("deliveryOutput") || ""),
      strategyType: String(
        values.get("strategyType") || "Research recommendation",
      ) as RecordItem["strategyType"],
    };
    let next: Memory;
    try {
      validateProblem(memory, item, captureRelated);
      next = capture(
        memory,
        item,
        captureRelated,
        String(values.get("label")).trim() || "related to",
      );
      if (
        item.kind === "Problem" &&
        item.problemState === "Client-confirmed" &&
        item.validationEvidenceId
      )
        next.relations.push({
          id: crypto.randomUUID(),
          from: item.validationEvidenceId,
          to: item.id,
          label: "supports confirmation",
        });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Capture failed");
      return;
    }
    if (!commit(next)) return;
    dialog.current?.close();
    form.reset();
    open(item.id);
  }
  const record = memory.records.find((r) => r.id === selected);
  const links = record ? neighbours(memory, record.id) : [];
  const connected = record ? relatedIds(memory, record.id) : new Set<string>();
  const mapping: Record<string, Kind[]> = {
    Companies: ["Company"],
    Relationships: ["Person"],
    People: ["Person"],
    Discover: ["Observation", "Behaviour", "Evidence"],
    Observations: ["Observation", "Behaviour", "Evidence"],
    Research: ["Research", "Problem"],
    Recommendations: ["Strategy"],
    Strategies: ["Strategy"],
    Decisions: ["Decision"],
    Content: ["Content"],
    Pipeline: ["Company", "Action", "Strategy"],
    Delivery: ["Delivery"],
    Knowledge: ["Insight", "Learning", "Playbook", "Decision"],
  };
  const results = search(memory, query).filter(
    (r) =>
      (query ||
        section === "Command Centre" ||
        !mapping[section] ||
        mapping[section].includes(r.kind)) &&
      (!status || r.status === status) &&
      (!type || r.kind === type) &&
      (!stageFilter ||
        matchesStage(memory, r, stageFilter as OperatingStage)) &&
      (query ||
        section !== "Knowledge" ||
        r.kind !== "Decision" ||
        r.disposition === "Archive / Knowledge") &&
      (query ||
        section !== "Recommendations" ||
        r.strategyType !== "Outreach strategy") &&
      (query ||
        section !== "Pipeline" ||
        r.kind === "Action" ||
        (r.kind === "Strategy" && r.strategyType === "Outreach strategy") ||
        ["Approach", "Convert", "Deliver"].includes(companyStage(r))),
  );
  function activityMatches(a: Activity) {
    const r = memory.records.find((r) => r.id === a.recordId);
    return (
      (!actor || a.actor === actor) &&
      (!date || a.date.slice(0, 10) === date) &&
      (!type || r?.kind === type) &&
      (!company || relatedIds(memory, company).has(a.recordId)) &&
      (!strategy || relatedIds(memory, strategy).has(a.recordId))
    );
  }
  function row(r: RecordItem) {
    return (
      <button className="record-row" key={r.id} onClick={() => open(r.id)}>
        <span className="kind">{r.kind}</span>
        <span>
          <strong>{r.title}</strong>
          <small>
            {r.owner} · {r.category || r.body.slice(0, 90)}
          </small>
        </span>
        <span className="badge">{r.status}</span>
        <span aria-hidden="true">↗</span>
      </button>
    );
  }
  function timeline(items: Activity[]) {
    return (
      <div className="timeline">
        {[...items]
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((a) => (
            <button key={a.id} onClick={() => open(a.recordId)}>
              <time>
                {new Date(a.date).toLocaleString("en-GB", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
              <span>
                <strong>{a.description}</strong>
                <small>{a.actor}</small>
              </span>
            </button>
          ))}
        {!items.length && (
          <p className="empty">No activity matches these filters.</p>
        )}
      </div>
    );
  }
  return (
    <div className={`shell ${theme} ${paused ? "motion-paused" : ""}`}>
      <aside>
        <a className="brand" href="#view=Command%20Centre">
          <Image
            src="/brand-symbol-transparent.png"
            alt=""
            width={32}
            height={44}
            priority
          />
          <div>
            IFAGRITHM<span>INTERNAL OPERATING SYSTEM</span>
          </div>
        </a>
        <div className="workspace-label">COMPANY MEMORY / MVP</div>
        <nav aria-label="Workspace">
          {sections.map((s, i) => (
            <button
              key={s}
              className={!selected && section === s ? "active" : ""}
              onClick={() => navigate(s)}
            >
              <span className="nav-icon">
                {["◈", "⌁", "▦", "⌕", "▤", "⇥", "▣", "◇"][i]}
              </span>
              {s}
            </button>
          ))}
        </nav>
        <div className="secondary-nav">
          <button onClick={() => navigate("Relationships")}>
            Relationships
          </button>
          <button onClick={() => navigate("Recommendations")}>
            Recommendations
          </button>
          <button onClick={() => navigate("Decisions")}>Decisions</button>
          <button onClick={() => navigate("Activity")}>
            Activity timeline
          </button>
        </div>
        <div className="sidebar-bottom">
          <span className="dot" /> Local workspace
          <button onClick={exportMemory}>Export memory ↓</button>
          <small>Sample data · no shared backend</small>
        </div>
      </aside>
      <main>
        <header>
          <label className="search">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="Search all company memory"
              placeholder="Search company memory…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected("");
                setStatus("");
                setType("");
                setStageFilter("");
              }}
            />
          </label>
          <div className="header-actions">
            <button
              className="mode-button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? "◐" : "☀"}
            </button>
            <button
              className="mode-button motion-control"
              onClick={toggleMotion}
              aria-label={paused ? "Play animations" : "Pause animations"}
            >
              {paused ? "▷" : "Ⅱ"}
            </button>
            <button
              className="primary"
              disabled={!ready}
              onClick={() => beginCapture()}
            >
              + Quick Capture
            </button>
          </div>
        </header>
        <div className="demo">
          DEMONSTRATION WORKSPACE{" "}
          <span>
            All seeded companies, activity and findings are fictional. Your
            captures stay in this browser.
          </span>
          {seed.records.some(
            (r) => !memory.records.some((existing) => existing.id === r.id),
          ) && (
            <button
              className="demo-merge"
              onClick={() => commit(mergeDemo(memory, seed))}
            >
              Add updated demo examples · keep my records
            </button>
          )}
        </div>
        {notice && (
          <div className="notice" role="status">
            {notice}
            <button
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
            >
              ×
            </button>
          </div>
        )}
        <div className="content" key={selected || section}>
          {record && !query ? (
            <>
              <div className="eyebrow">{record.kind} / CONNECTED RECORD</div>
              <div className="title-line">
                <h1>{record.title}</h1>
                <span className="badge">{record.status}</span>
              </div>
              <p className="lead">{record.body}</p>
              <div className="metadata">
                <span>Contributor: {record.owner}</span>
                <span>
                  Recorded:{" "}
                  {new Date(record.createdAt).toLocaleDateString("en-GB")}
                </span>
                {record.strategyType && record.kind === "Strategy" && (
                  <span>{record.strategyType}</span>
                )}
                {record.confidence && (
                  <span>Confidence: {record.confidence}</span>
                )}
              </div>
              {record.source && (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={record.source}
                >
                  Open source ↗
                </a>
              )}
              {record.kind === "Company" && (
                <label className="status-edit">
                  Commercial status{" "}
                  <select
                    value={record.status}
                    onChange={(e) => {
                      const next = {
                        ...memory,
                        records: memory.records.map((r) =>
                          r.id === record.id
                            ? {
                                ...r,
                                status: e.target.value,
                                workflowStage: undefined,
                              }
                            : r,
                        ),
                        activity: [
                          {
                            id: crypto.randomUUID(),
                            recordId: record.id,
                            actor: "Ola",
                            date: new Date().toISOString(),
                            description: `Commercial status changed to ${e.target.value}`,
                          },
                          ...memory.activity,
                        ],
                      };
                      commit(next);
                    }}
                  >
                    {statuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              )}
              <CompanyWorkflow
                memory={memory}
                record={record}
                commit={commit}
              />
              {record.kind === "Research" && (
                <div className="branch-actions">
                  <button onClick={() => beginCapture("Content")}>
                    + Content from this research
                  </button>
                  <button onClick={() => beginCapture("Decision")}>
                    + Record a decision
                  </button>
                  <button onClick={() => beginCapture("Action")}>
                    + Research-led approach
                  </button>
                </div>
              )}
              {record.kind === "Decision" && (
                <div className="branch-actions">
                  <button onClick={() => beginCapture("Content")}>
                    + Create linked content
                  </button>
                  <button onClick={() => beginCapture("Action")}>
                    + Create linked approach
                  </button>
                  <span className="muted">
                    Capture the branch you chose; no outreach is sent
                    automatically.
                  </span>
                </div>
              )}
              {record.kind === "Research" && (
                <section className="research-framing">
                  <h2>Investigation framing</h2>
                  {[
                    ["Research question", record.researchQuestion],
                    ["What happened / observed facts", record.observedFacts],
                    ["Actors", record.actors],
                    ["Behaviour being encouraged", record.encouragedBehaviour],
                    ["What we cannot know publicly", record.publicUnknowns],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <strong>{label}</strong>
                      <p>{value || "Not yet documented — do not assume."}</p>
                    </div>
                  ))}
                </section>
              )}
              {record.kind === "Problem" && (
                <div className="epistemic-note">
                  <strong>{record.problemState || "Hypothesis"}</strong>
                  <p>
                    {record.problemState === "Client-confirmed"
                      ? "Confirmation is attributed to the linked founder/client conversation. Sample records are fictional."
                      : "This is a question or hypothesis, not an established client problem."}
                  </p>
                  {record.validationEvidenceId && (
                    <button onClick={() => open(record.validationEvidenceId!)}>
                      View confirmation evidence ↗
                    </button>
                  )}
                </div>
              )}
              <MemoryMotion
                memory={memory}
                selected={record.id}
                onOpen={open}
              />
              <div className="detail-grid">
                <section>
                  <h2>Why / where this came from</h2>
                  <p className="muted">
                    Incoming relationships preserve the evidence and work behind
                    this record.
                  </p>
                  {links
                    .filter((l) => l.to === record.id)
                    .map((l) => (
                      <div className="edge" key={l.id}>
                        <small>{l.label} ←</small>
                        {row(memory.records.find((r) => r.id === l.from)!)}
                      </div>
                    ))}
                </section>
                <section>
                  <h2>What happened next</h2>
                  <p className="muted">
                    Follow actions, outcomes and learning forward.
                  </p>
                  {links
                    .filter((l) => l.from === record.id)
                    .map((l) => (
                      <div className="edge" key={l.id}>
                        <small>→ {l.label}</small>
                        {row(memory.records.find((r) => r.id === l.to)!)}
                      </div>
                    ))}
                </section>
              </div>
              <section>
                <h2>Connected history</h2>
                <p className="muted">
                  Reachable records, including shared contributors. Direct links
                  above show the precise attribution.
                </p>
                {[
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
                ]
                  .filter((k) => k !== record.kind)
                  .map((k) => {
                    const items = memory.records.filter(
                      (r) => connected.has(r.id) && r.kind === k,
                    );
                    return items.length ? (
                      <details key={k}>
                        <summary>
                          {k} <span>{items.length}</span>
                        </summary>
                        {items.map(row)}
                      </details>
                    ) : null;
                  })}
              </section>
              <section>
                <h2>Activity trail</h2>
                {timeline(
                  memory.activity.filter((a) => a.recordId === record.id),
                )}
              </section>
            </>
          ) : (
            <>
              <div className="eyebrow">
                IFAGRITHM / {query ? "SEARCH" : section.toUpperCase()}
              </div>
              <div className="title-line">
                <h1>
                  {query
                    ? `Results for “${query}”`
                    : section === "Command Centre"
                      ? "What is moving at IFAGRITHM?"
                      : section}
                </h1>
                <span className="date">COMPANY OPERATING SYSTEM</span>
              </div>
              <p className="lead">
                {query
                  ? "Matches and directly connected records across company memory."
                  : section === "Command Centre"
                    ? "Discover → Investigate → Decide → Approach → Convert → Deliver → Learn."
                    : "Explore records and follow their relationships to evidence, decisions and outcomes."}
              </p>
              {!query &&
                ["Research", "Strategies", "Knowledge"].includes(section) && (
                  <MemoryMotion memory={memory} onOpen={open} />
                )}{" "}
              {section === "Command Centre" && !query ? (
                <>
                  <OperatingBoard memory={memory} navigate={navigate} />
                  <div className="dashboard operating-queues">
                    <section>
                      <div className="section-heading">
                        <h2>Content queue</h2>
                        <button onClick={() => navigate("Content")}>
                          Open content ↗
                        </button>
                      </div>
                      <p className="muted">
                        {
                          memory.records.filter(
                            (r) =>
                              r.kind === "Content" &&
                              r.status === "Ready to publish",
                          ).length
                        }{" "}
                        research-derived items ready to publish
                      </p>
                      {memory.records
                        .filter(
                          (r) =>
                            r.kind === "Content" &&
                            !["Published", "Archived"].includes(r.status),
                        )
                        .map(row)}
                      {!memory.records.some((r) => r.kind === "Content") && (
                        <p className="empty">
                          No content yet. Open research and capture a linked
                          publication.
                        </p>
                      )}
                      <h2>Needs Analyst</h2>
                      {attention(memory, "Analyst").map(row)}
                      {!attention(memory, "Analyst").length && (
                        <p className="muted">No analyst assignments waiting.</p>
                      )}
                    </section>
                    <section>
                      <h2>Needs Ola</h2>
                      {attention(memory, "Ola").map(row)}
                      {!attention(memory, "Ola").length && (
                        <p className="muted">No Ola assignments waiting.</p>
                      )}
                      <div className="section-heading">
                        <h2>Recent activity</h2>
                        <button onClick={() => navigate("Activity")}>
                          Full timeline ↗
                        </button>
                      </div>
                      {timeline(
                        [...memory.activity]
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .slice(0, 6),
                      )}
                    </section>
                  </div>
                </>
              ) : section === "Activity" && !query ? (
                <>
                  <div className="filters">
                    <select
                      aria-label="Contributor filter"
                      value={actor}
                      onChange={(e) => setActor(e.target.value)}
                    >
                      <option value="">All contributors</option>
                      {Array.from(
                        new Set(memory.activity.map((a) => a.actor)),
                      ).map((a) => (
                        <option key={a}>{a}</option>
                      ))}
                    </select>
                    <select
                      aria-label="Company filter"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    >
                      <option value="">All companies</option>
                      {memory.records
                        .filter((r) => r.kind === "Company")
                        .map((r) => (
                          <option value={r.id} key={r.id}>
                            {r.title}
                          </option>
                        ))}
                    </select>
                    <select
                      aria-label="Strategy filter"
                      value={strategy}
                      onChange={(e) => setStrategy(e.target.value)}
                    >
                      <option value="">All strategies</option>
                      {memory.records
                        .filter((r) => r.kind === "Strategy")
                        .map((r) => (
                          <option value={r.id} key={r.id}>
                            {r.title}
                          </option>
                        ))}
                    </select>
                    <select
                      aria-label="Activity type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="">All types</option>
                      {kinds.map((k) => (
                        <option key={k}>{k}</option>
                      ))}
                    </select>
                    <input
                      aria-label="Activity date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                    <button
                      onClick={() => {
                        setActor("");
                        setCompany("");
                        setStrategy("");
                        setDate("");
                        setType("");
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                  {timeline(memory.activity.filter(activityMatches))}
                </>
              ) : (
                <>
                  <div className="filters">
                    {!["Content", "Relationships", "Recommendations"].includes(
                      section,
                    ) && (
                      <select
                        aria-label="Operating stage filter"
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value)}
                      >
                        <option value="">All operating stages</option>
                        {operatingStages.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    )}
                    <select
                      aria-label="Filter status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="">All statuses</option>
                      {Array.from(
                        new Set(memory.records.map((r) => r.status)),
                      ).map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <select
                      aria-label="Filter record type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="">All record types</option>
                      {kinds.map((k) => (
                        <option key={k}>{k}</option>
                      ))}
                    </select>
                    <span>{results.length} records</span>
                    {stageFilter && (
                      <button onClick={() => setStageFilter("")}>
                        Clear stage
                      </button>
                    )}
                  </div>
                  <div className="record-list">
                    {results.map(row)}
                    {!results.length && (
                      <p className="empty">
                        No matching records. Try another search or capture a new
                        record.
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
        <footer>
          IFAGRITHM · From behaviour to decisions.
          <span>Local prototype / Evidence before assumptions</span>
        </footer>
      </main>
      <dialog
        ref={dialog}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close();
        }}
      >
        <form onSubmit={submit}>
          <div className="section-heading">
            <h2>Quick Capture</h2>
            <button
              type="button"
              aria-label="Close capture"
              onClick={() => dialog.current?.close()}
            >
              ×
            </button>
          </div>
          <p className="muted">
            Record the work. Connect it to what came before.
          </p>
          {notice && (
            <div className="capture-notice" role="status">
              {notice}
            </div>
          )}
          <label>
            Record type
            <select
              value={captureKind}
              onChange={(e) => {
                const kind = e.target.value as Kind;
                setCaptureKind(kind);
                setCaptureStatus(captureDefaults[kind] || "Recorded");
                setProblemState("Hypothesis");
              }}
            >
              {kinds.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          {captureKind === "Research" && (
            <fieldset>
              <legend>Investigation framing</legend>
              <label>
                Research question
                <input name="researchQuestion" required />
              </label>
              <label>
                What happened? Observable facts
                <textarea name="observedFacts" rows={2} />
              </label>
              <label>
                Who are the actors?
                <input name="actors" />
              </label>
              <label>
                What behaviour is being encouraged?
                <input name="encouragedBehaviour" />
              </label>
              <label>
                What cannot be known publicly?
                <textarea name="publicUnknowns" rows={2} />
              </label>
            </fieldset>
          )}
          {captureKind === "Decision" && (
            <label>
              Commercial / content disposition
              <select name="disposition">
                {dispositions.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
          )}
          {captureKind === "Content" && (
            <label>
              Publication format
              <select name="contentFormat">
                {contentFormats.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
          )}
          {captureKind === "Action" && (
            <label>
              Approach route
              <select name="approachRoute">
                <option value="">Not outreach / not selected</option>
                {approachRoutes.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
          )}
          {captureKind === "Task" && (
            <label>
              Assignment queue
              <select name="assigneeRole">
                <option value="">General</option>
                <option>Ola</option>
                <option>Analyst</option>
                <option>Scout</option>
              </select>
            </label>
          )}
          {captureKind === "Evidence" && (
            <label>
              Evidence type
              <select name="evidenceType">
                <option>Public source</option>
                <option>Founder / client conversation</option>
                <option>Dataset / analysis</option>
                <option>Document / note</option>
              </select>
            </label>
          )}
          {captureKind === "Problem" && (
            <>
              <p className="epistemic-note">
                Observed behaviour alone does not prove a problem.
              </p>
              <label>
                Problem state
                <select
                  value={problemState}
                  onChange={(e) => setProblemState(e.target.value)}
                >
                  <option>Hypothesis</option>
                  <option>Client-confirmed</option>
                </select>
              </label>
              {problemState === "Client-confirmed" && (
                <label>
                  Confirmation conversation evidence
                  <select name="validationEvidenceId" required>
                    <option value="">
                      Choose company conversation evidence
                    </option>
                    {memory.records
                      .filter(
                        (r) =>
                          r.kind === "Evidence" &&
                          r.evidenceType === "Founder / client conversation",
                      )
                      .map((r) => (
                        <option value={r.id} key={r.id}>
                          {r.title}
                        </option>
                      ))}
                  </select>
                </label>
              )}
            </>
          )}
          <>
            {captureKind === "Strategy" && (
              <label>
                Strategy context
                <select name="strategyType">
                  <option>Research recommendation</option>
                  <option>Outreach strategy</option>
                </select>
              </label>
            )}
          </>
          {captureKind === "Company" && (
            <label>
              Company category
              <input
                name="category"
                placeholder="Protocol, Consumer App, RWA, Exchange…"
                required
              />
            </label>
          )}
          {captureKind === "Delivery" && (
            <>
              <label>
                Analysis approach
                <select name="analysisApproach">
                  <option>To be determined by the question</option>
                  <option>Off-chain analysis</option>
                  <option>On-chain analysis</option>
                  <option>Combined on-chain / off-chain</option>
                </select>
              </label>
              <label>
                Client deliverable
                <input
                  name="deliveryOutput"
                  placeholder="Decision brief, research report…"
                  required
                />
              </label>
            </>
          )}
          <label>
            Title
            <input name="title" required maxLength={240} />
          </label>
          <label>
            Details / hypothesis / limitations
            <textarea name="body" required rows={3} />
          </label>
          <div className="form-grid">
            <label>
              Contributor
              <input name="owner" defaultValue="Ola" required />
            </label>
            <label>
              Status
              <select
                name="status"
                value={captureStatus}
                onChange={(e) => setCaptureStatus(e.target.value)}
              >
                {[
                  "Recorded",
                  "Active",
                  "Open",
                  "In progress",
                  "Planned",
                  "Completed",
                  "Draft",
                  "Idea",
                  "Ready to publish",
                  "Published",
                  "Archived",
                  "Scoped",
                  "Review",
                  "Cancelled",
                  "Pending review",
                  "Decided",
                  "Needs validation",
                  ...statuses,
                ].map((s, i) => (
                  <option key={`${s}-${i}`}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Link to existing record
            <select
              name="related"
              value={captureRelated}
              onChange={(e) => setCaptureRelated(e.target.value)}
            >
              <option value="">No connection yet</option>
              {memory.records.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.kind} · {r.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Relationship (existing record → new record)
            <input name="label" defaultValue="supports" />
          </label>
          <div className="form-grid">
            <label>
              Source URL
              <input name="source" type="url" placeholder="https://…" />
            </label>
            <label>
              Confidence
              <select name="confidence">
                <option>Unassessed</option>
                <option>Tentative</option>
                <option>Supported</option>
                <option>Validated</option>
              </select>
            </label>
          </div>
          <small>
            Timestamp recorded automatically. No uploads or external outreach
            are performed.
          </small>
          <button className="primary" type="submit">
            Save connected record
          </button>
        </form>
      </dialog>
    </div>
  );
}
