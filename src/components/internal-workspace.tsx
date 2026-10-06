"use client";
import { useCallback, useEffect, useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppearanceSwitcher } from "./appearance";
import { CompanyCard, CompanyLogo } from "./company-card";
import { calendarDate, timestamp } from "@/lib/presentation";
import {
  MetricCards,
  BehaviourCards,
  MobileNavigation,
} from "./directory-visuals";
import {
  Snapshot,
  Profile,
  Observation,
  Company,
  recentObservations,
  duplicateObservations,
  roles,
} from "@/lib/identity";
import {
  behaviours,
  categories,
  directoryStatuses,
  metricLabel,
  approached,
} from "@/lib/scout";
import {
  AccessGate,
  Avatar,
  ProfileForm,
  SignOut,
  workflowRequest,
  canAdmin,
  canEnter,
} from "./profile";
const blank = {
  companyId: "",
  company: "",
  website: "",
  category: "Protocol",
  behaviour: "Bounty",
  description: "",
  detail: "",
  source: "",
  observedAt: new Date().toISOString().slice(0, 10),
};
export default function InternalWorkspace({
  admin = false,
  demonstration,
}: {
  admin?: boolean;
  demonstration?: Snapshot;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(
      demonstration || null,
    ),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [screen, setScreen] = useState("Overview"),
    [companyId, setCompanyId] = useState(""),
    [observationId, setObservationId] = useState(""),
    [personId, setPersonId] = useState(""),
    [q, setQ] = useState(""),
    [bf, setBf] = useState(""),
    [cf, setCf] = useState(""),
    [sf, setSf] = useState(""),
    [form, setForm] = useState(blank),
    [companyQuery, setCompanyQuery] = useState(""),
    [creating, setCreating] = useState(false),
    [duplicates, setDuplicates] = useState<string[]>([]),
    [source, setSource] = useState("");
  const load = useCallback(async () => {
    if (demonstration) return;
    const response = await fetch("/api/workflow", { cache: "no-store" }),
      body = await response.json();
    if (response.status === 401) {
      location.assign("/sign-in");
      return;
    }
    if (!response.ok)
      throw Error(body.error || "Workspace could not be loaded.");
    setSnapshot(body);
  }, [demonstration]);
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);
  async function mutate(body: unknown) {
    if (demonstration)
      throw Error(
        "This is a read-only fictional demonstration. Connect Supabase and sign in to submit.",
      );
    setBusy(true);
    setError("");
    try {
      const result = await workflowRequest(body);
      await load();
      return result;
    } finally {
      setBusy(false);
    }
  }
  function report(e: unknown) {
    setError(e instanceof Error ? e.message : "Request failed.");
  }
  if (!snapshot)
    return (
      <main className="identity-page">
        <div className="identity-card">
          <h1>
            {error ? "Workspace unavailable." : "Loading your workspace…"}
          </h1>
          {error && <p role="alert">{error}</p>}
          <a href="/sign-in">Return to sign-in</a>
        </div>
      </main>
    );
  const s = snapshot,
    me = s.profile,
    isAdmin = canAdmin(me),
    activeCompanies = s.companies.filter((c) => !c.merged_into),
    activeObservations = s.observations.filter(
      (o) => !o.deleted_at && !o.merged_into,
    ),
    company = activeCompanies.find((c) => c.id === companyId),
    observation = s.observations.find((o) => o.id === observationId),
    person = s.profiles.find((p) => p.id === personId);
  if (!canEnter(me)) return <AccessGate snapshot={s} onRefresh={load} />;
  const labels = [
    ...behaviours,
    ...activeObservations.map((o) => o.behaviour),
  ].filter(
    (v, i, a) => a.findIndex((b) => b.toLowerCase() === v.toLowerCase()) === i,
  );
  const cats = Array.from(
    new Set([...categories, ...activeCompanies.map((c) => c.category)]),
  );
  function author(id: string) {
    return s.profiles.find((p) => p.id === id);
  }
  function profileLink(id: string) {
    const p = author(id);
    return (
      <button
        type="button"
        className="author-link"
        onClick={() => {
          setPersonId(id);
          setObservationId("");
          setCompanyId("");
        }}
      >
        {p ? `@${p.username}` : "Legacy contributor"}
      </button>
    );
  }
  function resetView(next: string) {
    setScreen(next);
    setCompanyId("");
    setObservationId("");
    setPersonId("");
    setNotice("");
    setError("");
  }
  function selectCompany(c: Company) {
    setCreating(false);
    setCompanyQuery(c.name);
    setForm({
      ...form,
      companyId: c.id,
      company: c.name,
      website: c.domain,
      category: c.category,
    });
    setDuplicates([]);
  }
  async function submit(e: FormEvent, override = false) {
    e.preventDefault();
    setError("");
    try {
      if (!creating && !form.companyId)
        throw Error("Select an existing company or choose Create new company.");
      const result = await mutate({
        action: "observe",
        ...form,
        allowDuplicate: override,
      });
      if (result?.duplicate_id) {
        setDuplicates([result.duplicate_id]);
        setNotice(
          "Possible duplicate observation. Review it or explicitly submit as new.",
        );
        return;
      }
      setCompanyId(result.company_id);
      setScreen("Directory");
      setForm(blank);
      setCompanyQuery("");
      setCreating(false);
      setDuplicates([]);
      setNotice("Observation saved with your authenticated authorship.");
    } catch (e) {
      report(e);
    }
  }
  const filtered = activeCompanies.filter((c) => {
    const obs = recentObservations(s, c.id);
    return (
      (!q ||
        [c.name, c.domain, c.category, ...obs.map((o) => o.description)]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase())) &&
      (!bf ||
        obs.some((o) => o.behaviour.toLowerCase() === bf.toLowerCase())) &&
      (!cf || c.category === cf) &&
      (!sf ||
        (sf === "Not Approached" ? !approached(c.status) : c.status === sf))
    );
  });
  const prospectiveCompany =
    form.companyId ||
    activeCompanies.find(
      (c) => c.domain === form.website.toLowerCase().replace(/^www\./, ""),
    )?.id ||
    "";
  let possible: Observation[] = [];
  try {
    if (prospectiveCompany && form.source)
      possible = duplicateObservations(s, prospectiveCompany, form.source);
  } catch {}
  const duplicateRows = duplicates.length
    ? activeObservations.filter((o) => duplicates.includes(o.id))
    : possible;
  function observationList(items: Observation[]) {
    return (
      <div className="int-list">
        {items.map((o) => (
          <div key={o.id} className="int-observation-row">
            <button
              type="button"
              onClick={() => {
                setObservationId(o.id);
                setCompanyId("");
                setPersonId("");
              }}
            >
              <strong>{o.behaviour}</strong>
              <span>
                {s.companies.find((c) => c.id === o.company_id)?.name} ·{" "}
                {o.observed_on}
              </span>
              <p>{o.description}</p>
            </button>
            <div>
              {profileLink(o.submitted_by)}
              <small>
                {
                  s.sources.filter(
                    (src) => src.observation_id === o.id && !src.deleted_at,
                  ).length
                }{" "}
                sources
              </small>
            </div>
          </div>
        ))}
        {!items.length && <p className="sc-empty">No observations yet.</p>}
      </div>
    );
  }
  const nav = admin
    ? [
        "Overview",
        "All Companies",
        "All Observations",
        "Workers",
        "Role Requests",
        "Duplicates / Review",
        "Approached",
        "Completed",
        "Settings",
      ]
    : ["Overview", "Observe", "Directory", "My Work", "Profile"];
  return (
    <div className={`scout ${admin ? "admin-workspace" : "worker-workspace"}`}>
      {demonstration && (
        <div className="demo-banner">
          READ-ONLY FICTIONAL {admin ? "ADMIN" : "WORKER"} DEMONSTRATION ·
          Google authentication is not simulated ·{" "}
          <a href="/sign-in">Sign in</a>
        </div>
      )}
      <div className="sc-top">
        <a className="sc-brand" href={admin ? "/admin" : "/"}>
          <Image
            src="/brand-symbol-transparent.png"
            alt=""
            width={32}
            height={32}
          />
          IFAGRITHM{" "}
          <small>
            {admin ? "ADMIN / CONTROL ROOM" : "SCOUT WORKSPACE / 1A"}
          </small>
        </a>
        <div className="sc-tools">
          {!admin && isAdmin && <a href="/admin">Admin</a>}
          {admin && <Link href="/">Worker app</Link>}
          <AppearanceSwitcher />
          <button
            type="button"
            onClick={() => resetView("Profile")}
            aria-label="Open your profile"
            className="top-profile"
            title={`${me.display_name} · @${me.username}`}
          >
            <Avatar profile={me} />
          </button>
          {demonstration ? <a href="/sign-in">Sign in</a> : <SignOut />}
        </div>
      </div>
      <div className="sc-frame">
        <div className="sc-rail">
          <p className="sc-eyebrow">
            {admin ? "ADMINISTRATION" : "COMPANY INTELLIGENCE"}
          </p>
          <nav aria-label="Main navigation">
            {nav.map((n) => (
              <button
                key={n}
                className={screen === n ? "active" : ""}
                aria-current={screen === n ? "page" : undefined}
                onClick={() => resetView(n)}
              >
                {n}
              </button>
            ))}
          </nav>
          <div className="sc-rail-note">
            <Avatar profile={me} />
            <p>
              {me.display_name}
              <br />@{me.username}
            </p>
            <small>
              {me.role}
              <br />
              {demonstration
                ? "Read-only sample records"
                : "Shared workspace · authenticated contributions"}
            </small>
          </div>
        </div>
        <main className="sc-main">
          {error && (
            <p role="alert" className="sc-alert">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="sc-notice">
              {notice}
            </p>
          )}
          {person ? (
            <>
              <button className="sc-back" onClick={() => setPersonId("")}>
                ← Back
              </button>
              <div className="profile-heading">
                <Avatar profile={person} />
                <div>
                  <h1>{person.display_name}</h1>
                  <p className="sc-muted">
                    @{person.username} · {person.role}
                  </p>
                </div>
              </div>
              <div className="sc-stats">
                <div>
                  <span>Observations</span>
                  <strong>
                    {
                      activeObservations.filter(
                        (o) => o.submitted_by === person.id,
                      ).length
                    }
                  </strong>
                </div>
                <div>
                  <span>Companies discovered</span>
                  <strong>
                    {
                      activeCompanies.filter((c) => c.created_by === person.id)
                        .length
                    }
                  </strong>
                </div>
                <div>
                  <span>Sources contributed</span>
                  <strong>
                    {
                      s.sources.filter(
                        (src) =>
                          src.submitted_by === person.id && !src.deleted_at,
                      ).length
                    }
                  </strong>
                </div>
              </div>
              <div className="sc-behaviour-summary">
                {labels
                  .map(
                    (b) =>
                      [
                        b,
                        activeObservations.filter(
                          (o) =>
                            o.submitted_by === person.id &&
                            o.behaviour.toLowerCase() === b.toLowerCase(),
                        ).length,
                      ] as const,
                  )
                  .filter(([, n]) => n)
                  .map(([b, n]) => (
                    <span key={b}>
                      {b} {n} ·{" "}
                    </span>
                  ))}
              </div>
              <h2 className="int-subheading">Contributions</h2>
              {observationList(
                activeObservations.filter((o) => o.submitted_by === person.id),
              )}
            </>
          ) : observation ? (
            <>
              <button className="sc-back" onClick={() => setObservationId("")}>
                ← Back
              </button>
              <p className="sc-eyebrow">
                OBSERVATION / {observation.observed_on}
              </p>
              <h1>{observation.behaviour}</h1>
              <button
                type="button"
                className="author-link"
                onClick={() => {
                  setCompanyId(observation.company_id);
                  setObservationId("");
                }}
              >
                {s.companies.find((c) => c.id === observation.company_id)?.name}{" "}
                ↗
              </button>
              <p className="sc-intro">{observation.description}</p>
              <p>
                Submitted by {profileLink(observation.submitted_by)} ·{" "}
                {timestamp(observation.created_at)}
              </p>
              {observation.detail && (
                <p>
                  {metricLabel(observation.behaviour)}: {observation.detail}
                </p>
              )}
              <h2 className="int-subheading">Evidence / sources</h2>
              <div className="int-sources">
                {s.sources
                  .filter(
                    (src) =>
                      src.observation_id === observation.id && !src.deleted_at,
                  )
                  .map((src) => (
                    <div key={src.id}>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {src.url} ↗
                      </a>
                      <small>Added by {profileLink(src.submitted_by)}</small>
                    </div>
                  ))}
              </div>
              <form
                className="int-source-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await mutate({
                      action: "source",
                      observationId: observation.id,
                      source,
                    });
                    setSource("");
                    setNotice("Source added to the existing observation.");
                  } catch (e) {
                    report(e);
                  }
                }}
              >
                <label>
                  Add another source to this observation
                  <input
                    required
                    type="url"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="https://…"
                  />
                </label>
                <button
                  className="sc-primary"
                  disabled={busy || !!demonstration}
                >
                  Add source
                </button>
              </form>
              <p className="sc-muted">
                Multiple sources can support one event. Recorded sources are not
                automatically verified.
              </p>
              {s.observations.filter((o) => o.merged_into === observation.id)
                .length > 0 && (
                <div>
                  <h2 className="int-subheading">Merged contributions</h2>
                  {s.observations
                    .filter((o) => o.merged_into === observation.id)
                    .map((o) => (
                      <p key={o.id}>
                        {o.description} · {profileLink(o.submitted_by)}
                      </p>
                    ))}
                </div>
              )}
            </>
          ) : company ? (
            <>
              <button className="sc-back" onClick={() => setCompanyId("")}>
                ← Directory
              </button>
              <div className="sc-company-heading">
                <CompanyLogo company={company} />
                <div>
                  <h1>{company.name}</h1>
                  <p className="sc-muted">
                    {company.category} ·{" "}
                    <a
                      href={`https://${company.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {company.domain} ↗
                    </a>
                  </p>
                </div>
              </div>
              <div className="sc-detail-bar">
                <span>Status: {company.status}</span>
                <button
                  className="sc-primary"
                  onClick={() => {
                    selectCompany(company);
                    setCompanyId("");
                    setScreen("Observe");
                  }}
                >
                  + Record observation this company
                </button>
              </div>
              <h2 className="int-subheading">Observed behaviour</h2>
              {observationList(recentObservations(s, company.id))}
              {admin && (
                <AdminCompany
                  company={company}
                  disabled={busy || !!demonstration}
                  submit={mutate}
                  report={report}
                />
              )}
            </>
          ) : screen === "Profile" ? (
            <ProfileForm
              snapshot={s}
              onSaved={load}
              disabled={!!demonstration}
            />
          ) : screen === "Observe" ? (
            <>
              <p className="sc-eyebrow">STAGE 1A / CAPTURE</p>
              <h1>What did you observe?</h1>
              <p className="sc-intro">
                Find the company, label the behaviour, keep the evidence.
              </p>
              <form className="sc-form" onSubmit={submit}>
                <div className="sc-form-grid">
                  <label className="sc-full">
                    Find a company
                    <input
                      value={companyQuery}
                      placeholder="Company name or domain…"
                      onChange={(e) => {
                        setCompanyQuery(e.target.value);
                        setForm({
                          ...form,
                          companyId: "",
                          company: "",
                          website: "",
                        });
                        setCreating(false);
                        setDuplicates([]);
                      }}
                      autoComplete="off"
                    />
                  </label>
                </div>
                {!creating && !form.companyId && (
                  <div
                    className="company-autocomplete"
                    aria-label="Matching companies"
                  >
                    {activeCompanies
                      .filter((c) =>
                        [c.name, c.domain, c.category]
                          .join(" ")
                          .toLowerCase()
                          .includes(companyQuery.toLowerCase()),
                      )
                      .slice(0, 8)
                      .map((c) => (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => selectCompany(c)}
                        >
                          <CompanyLogo company={c} />
                          <span className="company-match-identity">
                            <strong>{c.name}</strong>
                            <span>
                              {c.category} · {c.domain}
                            </span>
                          </span>
                          <small>✓ Already in directory</small>
                        </button>
                      ))}
                    <button
                      type="button"
                      onClick={() => {
                        setCreating(true);
                        setForm({ ...blank, company: companyQuery });
                      }}
                    >
                      + Create new company
                    </button>
                  </div>
                )}
                {form.companyId && (
                  <div className="sc-notice">
                    ✓ {form.company} · {form.website} · {form.category}
                    <button
                      type="button"
                      className="author-link"
                      onClick={() => {
                        setForm(blank);
                        setCompanyQuery("");
                      }}
                    >
                      Change
                    </button>
                  </div>
                )}
                <div className="sc-form-grid">
                  {creating && (
                    <>
                      <label>
                        Company name
                        <input
                          required
                          maxLength={120}
                          value={form.company}
                          onChange={(e) =>
                            setForm({ ...form, company: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        Website / domain
                        <input
                          required
                          value={form.website}
                          placeholder="across.to"
                          onChange={(e) =>
                            setForm({ ...form, website: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        Category
                        <input
                          required
                          list="int-categories"
                          value={form.category}
                          onChange={(e) =>
                            setForm({ ...form, category: e.target.value })
                          }
                        />
                        <datalist id="int-categories">
                          {cats.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </datalist>
                      </label>
                    </>
                  )}
                  <label>
                    Behaviour
                    <input
                      required
                      list="int-behaviours"
                      value={form.behaviour}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          behaviour: e.target.value,
                          detail: "",
                        })
                      }
                    />
                    <datalist id="int-behaviours">
                      {labels.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </datalist>
                  </label>
                  <label>
                    {metricLabel(form.behaviour)} <small>Optional</small>
                    <input
                      value={form.detail}
                      maxLength={200}
                      onChange={(e) =>
                        setForm({ ...form, detail: e.target.value })
                      }
                    />
                  </label>
                  <label className="sc-full">
                    What happened?
                    <textarea
                      required
                      maxLength={4000}
                      rows={3}
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
                      value={form.source}
                      onChange={(e) => {
                        setForm({ ...form, source: e.target.value });
                        setDuplicates([]);
                      }}
                      placeholder="https://…"
                    />
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
                  <div className="capture-author">
                    <small>AUTOMATIC AUTHORSHIP</small>
                    <p>
                      {profileLink(me.id)} · {me.display_name}
                    </p>
                    <small>
                      Account identity and timestamp are set by the backend.
                    </small>
                  </div>
                </div>
                {prospectiveCompany && (
                  <div className="int-recent">
                    <h2>Recent observations for {form.company}</h2>
                    {observationList(
                      recentObservations(s, prospectiveCompany).slice(0, 5),
                    )}
                    <p className="sc-muted">
                      Found another source for the same event? Open the existing
                      observation and add evidence.
                    </p>
                  </div>
                )}
                {duplicateRows.length > 0 && (
                  <div className="sc-alert">
                    <h2>Possible duplicate observation</h2>
                    {duplicateRows.map((o) => (
                      <div key={o.id}>
                        <p>
                          {o.behaviour} · {o.observed_on} ·{" "}
                          {profileLink(o.submitted_by)}
                        </p>
                        <button
                          type="button"
                          className="author-link"
                          onClick={() => setObservationId(o.id)}
                        >
                          View existing observation ↗
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="sc-primary"
                      disabled={busy || !!demonstration}
                      onClick={(e) => submit(e, true)}
                    >
                      Submit as new observation
                    </button>
                  </div>
                )}
                <div className="sc-form-end">
                  <span>One event can have multiple sources.</span>
                  <button
                    className="sc-primary"
                    disabled={busy || !!demonstration}
                  >
                    {busy ? "Saving…" : "Submit observation"}
                  </button>
                </div>
              </form>
            </>
          ) : admin && ["Workers", "Role Requests"].includes(screen) ? (
            <>
              <p className="sc-eyebrow">ADMIN / ACCESS</p>
              <h1>{screen}</h1>
              <p className="sc-intro">
                Approve accounts and assign permissions. Requested roles grant
                no access by themselves.
              </p>
              <div className="int-list">
                {s.profiles
                  .filter(
                    (p) =>
                      screen !== "Role Requests" ||
                      p.access_status === "Pending" ||
                      p.requested_role !== p.role,
                  )
                  .map((p) => (
                    <WorkerReview
                      key={p.id}
                      profile={p}
                      snapshot={s}
                      disabled={busy || !!demonstration}
                      submit={mutate}
                      report={report}
                      open={() => setPersonId(p.id)}
                    />
                  ))}
              </div>
            </>
          ) : admin && screen === "Duplicates / Review" ? (
            <>
              <p className="sc-eyebrow">ADMIN / RECORD QUALITY</p>
              <h1>Duplicates / Review</h1>
              <p className="sc-intro">
                Merge only after reviewing the records. Contributor identities
                and an activity trail remain attached.
              </p>
              <MergeForm
                snapshot={s}
                disabled={busy || !!demonstration}
                submit={mutate}
                report={report}
              />
              <h2 className="int-subheading">Explicit duplicate submissions</h2>
              {observationList(
                activeObservations.filter((o) => o.duplicate_override),
              )}
              <h2 className="int-subheading">Remove a bad submission</h2>
              <RemoveForm
                snapshot={s}
                disabled={busy || !!demonstration}
                submit={mutate}
                report={report}
              />
            </>
          ) : admin && screen === "Settings" ? (
            <>
              <p className="sc-eyebrow">ADMIN / SETTINGS</p>
              <h1>Workspace boundary</h1>
              <p className="sc-intro">
                One internal workspace. Google identity. Approved accounts.
                Server-enforced permissions.
              </p>
              <div className="int-list">
                <p>
                  Core records: profiles, companies, observations,
                  observation_sources.
                </p>
                <p>
                  Account emails stay in Supabase Auth and appear only in the
                  signed-in user&apos;s own profile.
                </p>
                <p>
                  The public IFAGRITHM website has no access to these records.
                </p>
                <p>
                  Owner/admin bootstrap and provider configuration are
                  documented in the repository. Secrets are managed outside this
                  interface.
                </p>
                <p>
                  Existing local records remain in the local demonstration. They
                  are not automatically attributed to authenticated accounts or
                  imported into shared storage.
                </p>
              </div>
            </>
          ) : screen === "My Work" || screen === "All Observations" ? (
            <>
              <p className="sc-eyebrow">CONTRIBUTIONS / OBSERVATIONS</p>
              <h1>{screen}</h1>
              {observationList(
                screen === "My Work"
                  ? activeObservations.filter((o) => o.submitted_by === me.id)
                  : activeObservations,
              )}
            </>
          ) : (
            <>
              <p className="sc-eyebrow">STAGE 1A / COMPANY MEMORY</p>
              <div className="sc-heading">
                <div>
                  <h1>
                    {screen === "Overview"
                      ? "Market observations."
                      : screen === "Approached"
                        ? "Approached companies"
                        : screen === "Completed"
                          ? "Completed companies"
                          : "Company directory"}
                  </h1>
                  <p className="sc-intro">
                    What we saw, where we saw it, and who documented it.
                  </p>
                </div>
                {!admin && (
                  <button
                    className="sc-primary"
                    onClick={() => resetView("Observe")}
                  >
                    + Record observation
                  </button>
                )}
              </div>
              {screen === "Overview" && (
                <>
                  <MetricCards
                    metrics={[
                      {
                        label: "Companies",
                        count: activeCompanies.length,
                        open: () => {
                          setQ("");
                          setBf("");
                          setCf("");
                          setSf("");
                          resetView(admin ? "All Companies" : "Directory");
                        },
                      },
                      {
                        label: "Categories",
                        count: new Set(
                          activeCompanies.map((c) => c.category.toLowerCase()),
                        ).size,
                        open: () => {
                          document
                            .querySelector('[aria-label="Filter by category"]')
                            ?.scrollIntoView({ block: "center" });
                          (
                            document.querySelector(
                              '[aria-label="Filter by category"] button',
                            ) as HTMLButtonElement
                          )?.focus({ preventScroll: true });
                        },
                      },
                      {
                        label: "Approached",
                        count: activeCompanies.filter((c) =>
                          approached(c.status),
                        ).length,
                        open: () => {
                          setQ("");
                          setBf("");
                          setCf("");
                          setSf("");
                          resetView("Approached");
                        },
                      },
                      {
                        label: "Completed",
                        count: activeCompanies.filter(
                          (c) => c.status === "Completed",
                        ).length,
                        open: () => {
                          setQ("");
                          setBf("");
                          setCf("");
                          setSf("");
                          resetView("Completed");
                        },
                      },
                    ]}
                  />
                  <BehaviourCards
                    items={labels.map((label) => ({
                      label,
                      count: activeObservations.filter(
                        (o) =>
                          o.behaviour.toLowerCase() === label.toLowerCase(),
                      ).length,
                    }))}
                    selected={bf}
                    choose={(label) => {
                      setBf(label);
                      document
                        .getElementById("company-directory")
                        ?.scrollIntoView({ block: "start" });
                    }}
                  />
                </>
              )}
              <div className="sc-section-title" id="company-directory">
                <h2>Company directory</h2>
                <span>
                  {
                    filtered
                      .filter(
                        (c) => screen !== "Approached" || approached(c.status),
                      )
                      .filter(
                        (c) =>
                          screen !== "Completed" || c.status === "Completed",
                      ).length
                  }{" "}
                  companies shown
                </span>
              </div>
              <div className="sc-filters">
                <input
                  aria-label="Search companies"
                  value={q}
                  placeholder="Search companies or domains…"
                  onChange={(e) => setQ(e.target.value)}
                />
                <select
                  aria-label="Status filter"
                  value={sf}
                  onChange={(e) => setSf(e.target.value)}
                >
                  <option value="">All statuses</option>
                  {[...directoryStatuses, "Not Approached"].map((st) => (
                    <option key={st}>{st}</option>
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
              <div className="directory-facets">
                <div
                  className="directory-chip-row"
                  role="group"
                  aria-label="Filter by behaviour"
                >
                  <span className="directory-filter-label">BEHAVIOUR</span>
                  {["", ...labels].map((b) => {
                    const count = b
                      ? activeObservations.filter(
                          (o) => o.behaviour.toLowerCase() === b.toLowerCase(),
                        ).length
                      : activeObservations.length;
                    return (
                      <button
                        type="button"
                        key={b}
                        aria-pressed={bf === b}
                        onClick={() => setBf(b)}
                      >
                        {b || "All"}
                        <span>{count}</span>
                      </button>
                    );
                  })}
                </div>
                <div
                  className="directory-chip-row"
                  role="group"
                  aria-label="Filter by category"
                >
                  <span className="directory-filter-label">CATEGORY</span>
                  {["", ...cats].map((c) => (
                    <button
                      type="button"
                      key={c}
                      aria-pressed={cf === c}
                      onClick={() => setCf(c)}
                    >
                      {c || "All"}
                    </button>
                  ))}
                </div>
                <p className="directory-filter-note">
                  Behaviour counts refer to observations. Multiple sources count
                  as one event.
                </p>
              </div>
              <div className="sc-cards">
                {filtered
                  .filter(
                    (c) => screen !== "Approached" || approached(c.status),
                  )
                  .filter(
                    (c) => screen !== "Completed" || c.status === "Completed",
                  )
                  .map((c) => {
                    const obs = recentObservations(s, c.id),
                      latest = obs[0];
                    return (
                      <CompanyCard
                        key={c.id}
                        company={c}
                        observations={obs}
                        source={
                          s.sources.find(
                            (src) =>
                              src.observation_id === latest?.id &&
                              !src.deleted_at,
                          )?.url
                        }
                        history={labels
                          .map(
                            (b) =>
                              [
                                b,
                                obs.filter(
                                  (o) =>
                                    o.behaviour.toLowerCase() ===
                                    b.toLowerCase(),
                                ).length,
                              ] as const,
                          )
                          .filter(([, n]) => n)
                          .map(([b, n]) => `${b} × ${n}`)
                          .join(" · ")}
                        open={() => setCompanyId(c.id)}
                      />
                    );
                  })}
              </div>
              {!!activeCompanies.length &&
                !filtered
                  .filter(
                    (c) => screen !== "Approached" || approached(c.status),
                  )
                  .filter(
                    (c) => screen !== "Completed" || c.status === "Completed",
                  ).length && (
                  <p className="sc-empty" role="status">
                    No companies match this view. Adjust or reset the filters.
                  </p>
                )}
              {!activeCompanies.length && (
                <p className="sc-empty">
                  No companies yet. The first scout observation creates the
                  directory.
                </p>
              )}
              {admin && screen === "Overview" && (
                <>
                  <h2 className="int-subheading">Recent activity</h2>
                  <div className="int-list">
                    {s.activity.map((a) => (
                      <p key={a.id}>
                        {a.event} · {profileLink(a.actor_id)} ·{" "}
                        {timestamp(a.created_at)}
                      </p>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
      {!admin && (
        <MobileNavigation
          current={company || observation || person ? "Directory" : screen}
          navigate={(next) => {
            resetView(next);
            window.scrollTo({ top: 0 });
          }}
        />
      )}
    </div>
  );
}

type AdminProps = {
  disabled: boolean;
  submit: (body: unknown) => Promise<unknown>;
  report: (e: unknown) => void;
};
function WorkerReview({
  profile: p,
  snapshot: s,
  disabled,
  submit,
  report,
  open,
}: AdminProps & { profile: Profile; snapshot: Snapshot; open: () => void }) {
  const [role, setRole] = useState(p.role),
    [status, setStatus] = useState(p.access_status);
  const observations = s.observations.filter(
      (o) => o.submitted_by === p.id && !o.deleted_at,
    ),
    last = s.activity.find((a) => a.actor_id === p.id);
  return (
    <form
      className="worker-review"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await submit({ action: "access", profileId: p.id, role, status });
        } catch (e) {
          report(e);
        }
      }}
    >
      <div className="profile-heading">
        <Avatar profile={p} />
        <div>
          <button type="button" className="author-link" onClick={open}>
            {p.display_name} · @{p.username}
          </button>
          <p className="sc-muted">
            {p.role} · {p.access_status} · Requested: {p.requested_role}
            {p.is_owner ? " · Owner" : ""}
          </p>
          <small>
            {observations.length} observations ·{" "}
            {s.companies.filter((c) => c.created_by === p.id).length} companies
            discovered ·{" "}
            {observations.filter((o) => o.duplicate_override).length} duplicate
            overrides
          </small>
          <p className="sc-muted">
            Last contribution: {last ? calendarDate(last.created_at) : "None"}
          </p>
        </div>
      </div>
      <div className="worker-review-controls">
        <label>
          Approved role
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Profile["role"])}
          >
            {roles.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label>
          Access
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as Profile["access_status"])
            }
          >
            {["Pending", "Approved", "Suspended"].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <button className="sc-primary" disabled={disabled || p.is_owner}>
          Save access
        </button>
      </div>
    </form>
  );
}
function AdminCompany({
  company: c,
  disabled,
  submit,
  report,
}: AdminProps & { company: Company }) {
  const [category, setCategory] = useState(c.category),
    [status, setStatus] = useState(c.status);
  return (
    <form
      className="worker-review-controls"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await submit({
            action: "company",
            companyId: c.id,
            category,
            status,
          });
        } catch (e) {
          report(e);
        }
      }}
    >
      <label>
        Correct category
        <input
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </label>
      <label>
        Commercial status
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {directoryStatuses.map((st) => (
            <option key={st}>{st}</option>
          ))}
        </select>
      </label>
      <button className="sc-primary" disabled={disabled}>
        Save correction
      </button>
    </form>
  );
}
function MergeForm({
  snapshot: s,
  disabled,
  submit,
  report,
}: AdminProps & { snapshot: Snapshot }) {
  const [type, setType] = useState("mergeCompanies"),
    [from, setFrom] = useState(""),
    [into, setInto] = useState(""),
    [reason, setReason] = useState(""),
    [confirm, setConfirm] = useState(false);
  const options =
    type === "mergeCompanies"
      ? s.companies
          .filter((c) => !c.merged_into)
          .map((c) => ({ id: c.id, label: `${c.name} — ${c.domain}` }))
      : s.observations
          .filter((o) => !o.deleted_at && !o.merged_into)
          .map((o) => ({
            id: o.id,
            label: `${s.companies.find((c) => c.id === o.company_id)?.name} — ${o.behaviour} — ${o.observed_on} — ${o.id.slice(0, 8)}`,
          }));
  return (
    <form
      className="sc-form"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await submit({ action: type, from, into, reason });
          setFrom("");
          setInto("");
          setReason("");
          setConfirm(false);
        } catch (e) {
          report(e);
        }
      }}
    >
      <div className="sc-form-grid">
        <label>
          Record type
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setFrom("");
              setInto("");
            }}
          >
            <option value="mergeCompanies">Companies</option>
            <option value="mergeObservations">Observations</option>
          </select>
        </label>
        <label>
          Merge from
          <select
            required
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          >
            <option value="">Select record</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Keep this record
          <select
            required
            value={into}
            onChange={(e) => setInto(e.target.value)}
          >
            <option value="">Select canonical record</option>
            {options
              .filter((o) => o.id !== from)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
          </select>
        </label>
        <label>
          Review reason
          <input
            required
            minLength={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
      </div>
      <label className="int-confirm">
        <input
          required
          type="checkbox"
          checked={confirm}
          onChange={(e) => setConfirm(e.target.checked)}
        />
        I reviewed both records and want to merge them.
      </label>
      <button className="sc-primary" disabled={disabled || !confirm}>
        Merge reviewed records
      </button>
    </form>
  );
}
function RemoveForm({
  snapshot: s,
  disabled,
  submit,
  report,
}: AdminProps & { snapshot: Snapshot }) {
  const [id, setId] = useState(""),
    [reason, setReason] = useState("");
  return (
    <form
      className="worker-review-controls"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await submit({ action: "remove", observationId: id, reason });
          setId("");
          setReason("");
        } catch (e) {
          report(e);
        }
      }}
    >
      <label>
        Observation
        <select required value={id} onChange={(e) => setId(e.target.value)}>
          <option value="">Select observation</option>
          {s.observations
            .filter((o) => !o.deleted_at && !o.merged_into)
            .map((o) => (
              <option key={o.id} value={o.id}>
                {s.companies.find((c) => c.id === o.company_id)?.name} —{" "}
                {o.behaviour} — {o.id.slice(0, 8)}
              </option>
            ))}
        </select>
      </label>
      <label>
        Removal reason
        <input
          required
          minLength={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <button className="sc-primary" disabled={disabled}>
        Remove from active records
      </button>
    </form>
  );
}
