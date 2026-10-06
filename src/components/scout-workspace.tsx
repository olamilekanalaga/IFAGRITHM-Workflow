"use client";
import { useEffect, useState, FormEvent } from "react";
import Image from "next/image";
import { AppearanceSwitcher } from "./appearance";
import { Memory, RecordItem } from "@/lib/model";
import { seed } from "@/lib/seed";
import {
  behaviours,
  categories,
  directoryStatuses,
  companyObservations,
  behaviourOf,
  filterCompanies,
  displayStatus,
  approached,
  metricLabel,
  saveObservation,
  domainOf,
} from "@/lib/scout";
function Logo({ company }: { company: RecordItem }) {
  const [failed, setFailed] = useState(false);
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;
  let domain = "";
  try {
    domain = domainOf(company.website || "");
  } catch {}
  return (
    <div className="sc-logo">
      {token && domain && !failed ? (
        <Image
          unoptimized
          src={`https://img.logo.dev/${encodeURIComponent(domain)}?token=${encodeURIComponent(token)}&size=128`}
          alt={`${company.title} logo`}
          width={44}
          height={44}
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-label={`${company.title} initials`}>
          {company.title
            .split(/\s+/)
            .map((w) => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </span>
      )}
    </div>
  );
}
const empty = {
  companyId: "",
  company: "",
  website: "",
  category: "Protocol",
  behaviour: "Bounty",
  description: "",
  source: "",
  detail: "",
  observedAt: new Date().toISOString().slice(0, 10),
  owner: "Ola",
};
export default function ScoutWorkspace() {
  const [memory, setMemory] = useState<Memory>(seed),
    [ready, setReady] = useState(false),
    [storageBlocked, setStorageBlocked] = useState(false),
    [screen, setScreen] = useState("Overview"),
    [selected, setSelected] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [form, setForm] = useState(empty),
    [q, setQ] = useState(""),
    [bf, setBf] = useState(""),
    [cf, setCf] = useState(""),
    [sf, setSf] = useState("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ifagrithm-memory-v1");
      if (raw) {
        const m = JSON.parse(raw);
        if (
          m.version !== 1 ||
          !Array.isArray(m.records) ||
          !Array.isArray(m.relations) ||
          !Array.isArray(m.activity)
        )
          throw Error();
        setMemory(m);
      }
    } catch {
      setStorageBlocked(true);
      setError(
        "Saved memory could not be read. Export or recover it before saving; this view shows demonstration data.",
      );
    }
    setReady(true);
  }, []);
  function persist(m: Memory) {
    if (storageBlocked)
      throw new Error(
        "Existing memory could not be read; saving is blocked to preserve it.",
      );
    localStorage.setItem("ifagrithm-memory-v1", JSON.stringify(m));
    setMemory(m);
  }
  const companies = memory.records.filter((r) => r.kind === "Company");
  const labels = [
    ...behaviours,
    ...memory.records.filter((r) => r.kind === "Behaviour").map((r) => r.title),
  ].filter(
    (label, index, all) =>
      all.findIndex(
        (other) => other.trim().toLowerCase() === label.trim().toLowerCase(),
      ) === index,
  );
  const cats = Array.from(
    new Set([
      ...categories,
      ...companies.map((c) => c.category || "Uncategorised"),
    ]),
  );
  const company = companies.find((c) => c.id === selected);
  function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const result = saveObservation(memory, form);
      persist(result.memory);
      setSelected(result.companyId);
      setScreen("Overview");
      setForm({ ...empty, owner: form.owner });
      setNotice("Observation saved. Company history and overview updated.");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not save. Your brief remains in the form.",
      );
    }
  }
  function choose(id: string) {
    const c = companies.find((c) => c.id === id);
    setForm({
      ...form,
      companyId: id,
      company: c?.title || "",
      website: c?.website || "",
      category: c?.category || "Protocol",
    });
  }
  function safeHost(value?: string) {
    try {
      const u = new URL(value || "");
      return ["http:", "https:"].includes(u.protocol) &&
        !u.username &&
        !u.password
        ? u.hostname
        : "";
    } catch {
      return "";
    }
  }
  function source(o: RecordItem) {
    return safeHost(o.source) ? (
      <a href={o.source} target="_blank" rel="noopener noreferrer">
        {safeHost(o.source).replace(/^www\./, "")} ↗
      </a>
    ) : (
      <span className="sc-muted">Sample note · no source URL</span>
    );
  }
  function exportMemory() {
    const raw = storageBlocked
      ? localStorage.getItem("ifagrithm-memory-v1")
      : null;
    const u = URL.createObjectURL(
      new Blob([raw || JSON.stringify(memory, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = u;
    a.download = "ifagrithm-memory.json";
    a.click();
    URL.revokeObjectURL(u);
  }
  return (
    <div className="scout">
      <div className="sc-top">
        <a
          className="sc-brand"
          href="#"
          onClick={() => {
            setSelected("");
            setScreen("Overview");
          }}
        >
          <Image
            src="/brand-symbol-transparent.png"
            alt=""
            width={32}
            height={32}
          />
          IFAGRITHM <small>SCOUT WORKSPACE / 1A</small>
        </a>
        <div className="sc-tools">
          <button onClick={exportMemory}>Export memory</button>
          <AppearanceSwitcher />
        </div>
      </div>
      <div className="sc-frame">
        <div className="sc-rail">
          <p className="sc-eyebrow">COMPANY INTELLIGENCE</p>
          <nav aria-label="Main navigation">
            {["Overview", "Observe"].map((s) => (
              <button
                key={s}
                className={screen === s ? "active" : ""}
                aria-current={screen === s ? "page" : undefined}
                onClick={() => {
                  setScreen(s);
                  setSelected("");
                  setNotice("");
                }}
              >
                {s === "Observe" ? "+ " : ""}
                {s}
                <span>{s === "Overview" ? "01" : "02"}</span>
              </button>
            ))}
          </nav>
          <div className="sc-rail-note">
            <span className="sc-dot" /> LOCAL COMPANY MEMORY
            <p>
              Observe the market.
              <br />
              Keep the source.
              <br />
              Build the history.
            </p>
            <small>
              Browser storage · no shared database
              <br />
              Seed records are fictional.
            </small>
          </div>
        </div>
        <main className="sc-main">
          {error && (
            <div role="alert" className="sc-alert">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" className="sc-notice">
              {notice}
            </div>
          )}
          {screen === "Observe" ? (
            <>
              <p className="sc-eyebrow">STAGE 1A / CAPTURE</p>
              <h1>What did you observe?</h1>
              <p className="sc-intro">
                Record the behaviour and its source. The company directory takes
                care of itself.
              </p>
              <div className="sc-flow">
                NEWS <span>→</span> BEHAVIOUR <span>→</span> COMPANY{" "}
                <span>→</span> SOURCE <span>→</span> MEMORY
              </div>
              <form className="sc-form" onSubmit={submit}>
                <div className="sc-form-grid">
                  <label>
                    Behaviour
                    <input
                      required
                      list="sc-behaviours"
                      value={form.behaviour}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          behaviour: e.target.value,
                          detail: "",
                        })
                      }
                    />
                    <datalist id="sc-behaviours">
                      {labels.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                    <small>Choose a label or create your own.</small>
                  </label>
                  <label>
                    Existing company
                    <select
                      value={form.companyId}
                      onChange={(e) => choose(e.target.value)}
                    >
                      <option value="">
                        New company / match by name or domain
                      </option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Company name
                    <input
                      required
                      value={form.company}
                      readOnly={!!form.companyId}
                      onChange={(e) =>
                        setForm({ ...form, company: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Company website <small>Optional</small>
                    <input
                      placeholder="example.com"
                      value={form.website}
                      readOnly={!!form.companyId}
                      onChange={(e) =>
                        setForm({ ...form, website: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Category
                    <input
                      required
                      list="sc-categories"
                      value={form.category}
                      readOnly={!!form.companyId}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                    />
                    <datalist id="sc-categories">
                      {cats.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </label>
                  <label>
                    {metricLabel(form.behaviour)} <small>Optional</small>
                    <input
                      value={form.detail}
                      placeholder={
                        metricLabel(form.behaviour) === "Creators observed"
                          ? "12"
                          : "Amount, name or observed detail"
                      }
                      onChange={(e) =>
                        setForm({ ...form, detail: e.target.value })
                      }
                    />
                  </label>
                  <label className="sc-full">
                    What happened?
                    <textarea
                      required
                      rows={3}
                      placeholder="Describe what you saw, without assuming why it happened."
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                    />
                  </label>
                  <label className="sc-full">
                    Source URL
                    <input
                      required
                      type="url"
                      placeholder="https://…"
                      value={form.source}
                      onChange={(e) =>
                        setForm({ ...form, source: e.target.value })
                      }
                    />
                    <small>
                      A source is recorded, not automatically verified.
                    </small>
                  </label>
                  <label>
                    Observed on
                    <input
                      required
                      type="date"
                      value={form.observedAt}
                      onChange={(e) =>
                        setForm({ ...form, observedAt: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Scout
                    <input
                      required
                      value={form.owner}
                      onChange={(e) =>
                        setForm({ ...form, owner: e.target.value })
                      }
                    />
                    <small>
                      Timestamp is saved automatically. This is attribution, not
                      authentication.
                    </small>
                  </label>
                </div>
                <div className="sc-form-end">
                  <span>One observation. A growing company history.</span>
                  <button
                    className="sc-primary"
                    disabled={!ready}
                    type="submit"
                  >
                    Save observation ↗
                  </button>
                </div>
              </form>
            </>
          ) : company ? (
            <>
              <button className="sc-back" onClick={() => setSelected("")}>
                ← Company directory
              </button>
              <div className="sc-company-heading">
                <Logo key={company.website || company.id} company={company} />
                <div>
                  <p className="sc-eyebrow">COMPANY RECORD</p>
                  <h1>{company.title}</h1>
                  <p className="sc-muted">
                    {company.category || "Uncategorised"}
                    {company.website && (
                      <>
                        {" "}
                        ·{" "}
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Website ↗
                        </a>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="sc-detail-bar">
                <label>
                  Commercial status{" "}
                  <select
                    value={displayStatus(company.status)}
                    onChange={(e) => {
                      try {
                        const status = e.target.value;
                        persist({
                          ...memory,
                          records: memory.records.map((r) =>
                            r.id === company.id ? { ...r, status } : r,
                          ),
                          activity: [
                            {
                              id: crypto.randomUUID(),
                              recordId: company.id,
                              actor: form.owner,
                              date: new Date().toISOString(),
                              description: `${company.title} status changed to ${status}`,
                            },
                            ...memory.activity,
                          ],
                        });
                      } catch {
                        setError(
                          "Status could not be saved. Browser storage may be full.",
                        );
                      }
                    }}
                  >
                    {Array.from(
                      new Set([
                        ...directoryStatuses,
                        displayStatus(company.status),
                      ]),
                    ).map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <button
                  className="sc-primary"
                  onClick={() => {
                    choose(company.id);
                    setScreen("Observe");
                  }}
                >
                  + Add observation
                </button>
              </div>
              <div className="sc-section-title">
                <h2>Observed behaviour</h2>
                <span>
                  {companyObservations(memory, company.id).length} observations
                </span>
              </div>
              <p className="sc-muted">
                Observed activity is evidence of behaviour; it does not
                establish a business problem.
              </p>
              <div className="sc-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Behaviour / observation</th>
                      <th>Detail</th>
                      <th>Source / scout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyObservations(memory, company.id).map((o) => (
                      <tr key={o.id}>
                        <td>
                          {new Date(
                            o.observedAt || o.createdAt,
                          ).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td>
                          <strong>{behaviourOf(memory, o)}</strong>
                          <p>{o.title}</p>
                        </td>
                        <td>
                          {o.behaviourDetail ? (
                            <>
                              <small>
                                {metricLabel(behaviourOf(memory, o))}
                              </small>
                              <br />
                              {o.behaviourDetail}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          {source(o)}
                          <small>{o.owner}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!companyObservations(memory, company.id).length && (
                  <p className="sc-empty">No observations recorded yet.</p>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="sc-eyebrow">STAGE 1A / COMPANY MEMORY</p>
              <div className="sc-heading">
                <div>
                  <h1>
                    Market observations.
                    <br />
                    <span>Company intelligence.</span>
                  </h1>
                  <p className="sc-intro">
                    What we saw, where we saw it, and the companies behind it.
                  </p>
                </div>
                <button
                  className="sc-primary"
                  onClick={() => setScreen("Observe")}
                >
                  + Observe
                </button>
              </div>
              <div className="sc-stats">
                {[
                  ["Companies", companies.length],
                  [
                    "Categories",
                    new Set(
                      companies
                        .map((c) => c.category?.trim().toLowerCase())
                        .filter(Boolean),
                    ).size,
                  ],
                  [
                    "Approached",
                    companies.filter((c) => approached(c.status)).length,
                  ],
                  [
                    "Completed",
                    companies.filter((c) => c.status === "Completed").length,
                  ],
                ].map(([label, count]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
              <div className="sc-behaviour-summary">
                <span className="sc-eyebrow">BEHAVIOURS OBSERVED</span>
                <div>
                  {labels
                    .filter((b) =>
                      memory.records.some(
                        (o) =>
                          o.kind === "Observation" &&
                          behaviourOf(memory, o).toLowerCase() ===
                            b.toLowerCase(),
                      ),
                    )
                    .map((b) => (
                      <button key={b} onClick={() => setBf(b)}>
                        {b}{" "}
                        <b>
                          {
                            memory.records.filter(
                              (o) =>
                                o.kind === "Observation" &&
                                behaviourOf(memory, o).toLowerCase() ===
                                  b.toLowerCase(),
                            ).length
                          }
                        </b>
                      </button>
                    ))}
                </div>
                <small>
                  Counts are observations; a company can appear under several
                  behaviours.
                </small>
              </div>
              <div className="sc-section-title">
                <h2>Company directory</h2>
                <span>
                  {filterCompanies(memory, q, bf, cf, sf).length} companies
                </span>
              </div>
              <div className="sc-filters">
                <input
                  aria-label="Search companies"
                  placeholder="Search company, domain or observation…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <select
                  aria-label="Behaviour filter"
                  value={bf}
                  onChange={(e) => setBf(e.target.value)}
                >
                  <option value="">All behaviours</option>
                  {labels.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
                <select
                  aria-label="Category filter"
                  value={cf}
                  onChange={(e) => setCf(e.target.value)}
                >
                  <option value="">All categories</option>
                  {cats.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <select
                  aria-label="Status filter"
                  value={sf}
                  onChange={(e) => setSf(e.target.value)}
                >
                  <option value="">All statuses</option>
                  {Array.from(
                    new Set([
                      ...directoryStatuses,
                      "Not Approached",
                      ...companies.map((c) => displayStatus(c.status)),
                    ]),
                  ).map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setQ("");
                    setBf("");
                    setCf("");
                    setSf("");
                  }}
                >
                  Reset
                </button>
              </div>
              <div className="sc-cards">
                {filterCompanies(memory, q, bf, cf, sf).map((c) => {
                  const o = companyObservations(memory, c.id)[0];
                  return (
                    <button
                      className="sc-card"
                      key={c.id}
                      onClick={() => setSelected(c.id)}
                    >
                      <div className="sc-card-top">
                        <Logo company={c} />
                        <div>
                          <h3>{c.title}</h3>
                          <span>{c.category || "Uncategorised"}</span>
                        </div>
                        <span className="sc-arrow">↗</span>
                      </div>
                      <div className="sc-card-field">
                        <small>BEHAVIOUR / LATEST OBSERVATION</small>
                        <strong>
                          <span className="sc-dot" />
                          {o
                            ? behaviourOf(memory, o)
                            : "No observations recorded"}
                        </strong>
                      </div>
                      {o?.behaviourDetail && (
                        <div className="sc-card-field">
                          <small>
                            {metricLabel(behaviourOf(memory, o)).toUpperCase()}
                          </small>
                          <strong>{o.behaviourDetail}</strong>
                        </div>
                      )}
                      <div className="sc-card-field">
                        <small>SOURCE</small>
                        <span>
                          {o?.source && /^https?:\/\//.test(o.source)
                            ? safeHost(o.source)
                            : "Sample note / no URL"}
                        </span>
                      </div>
                      <div className="sc-card-bottom">
                        <span>{displayStatus(c.status)}</span>
                        <small>
                          {companyObservations(memory, c.id).length}{" "}
                          observations
                        </small>
                      </div>
                    </button>
                  );
                })}
              </div>
              {!filterCompanies(memory, q, bf, cf, sf).length && (
                <div className="sc-empty">
                  No companies match these filters. Reset filters or capture a
                  new observation.
                </div>
              )}
              <p className="sc-footnote">
                Demonstration records are fictional. Your captures stay in this
                browser; export regularly.
              </p>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
