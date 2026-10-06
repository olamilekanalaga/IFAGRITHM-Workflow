"use client";
import { useId, useState } from "react";
import {
  filterInterventions,
  type InterventionRow,
} from "@/lib/intervention-report";
import { interventionStatuses } from "@/lib/intervention-model";
import { calendarDate } from "@/lib/presentation";
export function InterventionReport({
  rows,
  openCompany,
  openObservation,
  filterDirectory,
}: {
  rows: InterventionRow[];
  openCompany: (id: string) => void;
  openObservation: (id: string) => void;
  filterDirectory: (label: string) => void;
}) {
  const id = useId();
  const [query, setQuery] = useState(""),
    [intervention, setIntervention] = useState(""),
    [status, setStatus] = useState(""),
    [desired, setDesired] = useState("");
  const unique = (items: string[]) =>
    [...new Set(items.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const visible = filterInterventions(
    rows,
    query,
    intervention,
    status,
    desired,
  );
  const reset = () => {
    setQuery("");
    setIntervention("");
    setStatus("");
    setDesired("");
  };
  return (
    <section className="intervention-report" aria-labelledby={id}>
      <div className="sc-section-title">
        <h2 id={id}>Intervention report</h2>
        <span role="status">
          {visible.length} of {rows.length} observations
        </span>
      </div>
      <p className="report-explainer">
        What companies are doing, the resources recorded, and the behaviour they
        may be encouraging. Status is last recorded, not live monitoring.
      </p>
      <div className="report-filters">
        <label>
          Search
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search market activity…"
          />
        </label>
        <label>
          Intervention
          <select
            value={intervention}
            onChange={(e) => setIntervention(e.target.value)}
          >
            <option value="">All interventions</option>
            {unique(rows.map((r) => r.intervention)).map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Intervention status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {interventionStatuses.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Desired behaviour
          <select value={desired} onChange={(e) => setDesired(e.target.value)}>
            <option value="">All desired behaviours</option>
            {unique(
              rows.flatMap((r) => r.desiredBehaviour.split(/\s*\/\s*/)),
            ).map((v) => (
              <option key={v}>{v}</option>
            ))}
            <option value="__unknown">Not recorded</option>
          </select>
        </label>
        <button type="button" className="report-reset" onClick={reset}>
          Reset report
        </button>
      </div>
      <p className="report-scroll-hint" id={`${id}-scroll`}>
        Swipe across for all columns →
      </p>
      <div
        className="report-table-wrap"
        role="region"
        aria-label="Intervention report table"
        aria-describedby={`${id}-scroll`}
        tabIndex={0}
      >
        <table className="report-table" role="table">
          <caption className="report-caption">
            Recorded interventions, resources, desired behaviours, start dates
            and last known statuses. Desired behaviour is a stated objective or
            a labelled inference.
          </caption>
          <thead>
            <tr>
              <th scope="col">Project</th>
              <th scope="col">Intervention</th>
              <th scope="col">Resource</th>
              <th scope="col">Desired behaviour</th>
              <th scope="col">Started</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id}>
                <td data-label="Project">
                  <button
                    type="button"
                    className="report-project"
                    onClick={() => openCompany(row.companyId)}
                  >
                    {row.project}
                    <span aria-hidden="true">↗</span>
                  </button>
                  <small className="report-domain">{row.domain}</small>
                </td>
                <td data-label="Intervention">
                  <button
                    type="button"
                    className="report-link"
                    onClick={() => {
                      setIntervention(row.intervention);
                      filterDirectory(row.intervention);
                    }}
                    aria-label={`Filter directory by ${row.intervention}`}
                  >
                    {row.intervention}
                  </button>
                  <button
                    type="button"
                    className="report-evidence"
                    onClick={() => openObservation(row.id)}
                    aria-label={`View ${row.project} ${row.intervention} observation and evidence`}
                  >
                    {row.sourceCount}{" "}
                    {row.sourceCount === 1 ? "source" : "sources"} · View record
                    ↗
                  </button>
                </td>
                <td data-label="Resource">
                  {row.resource || (
                    <span className="report-unknown">Unknown</span>
                  )}
                </td>
                <td data-label="Desired behaviour">
                  {row.desiredBehaviour ? (
                    <>
                      <span>{row.desiredBehaviour}</span>
                      <small
                        className={`intent-label intent-${row.intentBasis.toLowerCase()}`}
                      >
                        {row.intentBasis === "Unknown"
                          ? "Basis not recorded"
                          : row.intentBasis}
                      </small>
                    </>
                  ) : (
                    <span className="report-unknown">Not recorded</span>
                  )}
                </td>
                <td data-label="Started">
                  {row.startedOn ? (
                    <time dateTime={row.startedOn}>
                      {calendarDate(row.startedOn)}
                    </time>
                  ) : (
                    <span className="report-unknown">Unknown</span>
                  )}
                  <small className="report-recorded">
                    Seen {calendarDate(row.observedOn)}
                  </small>
                </td>
                <td data-label="Status">
                  <button
                    type="button"
                    className="intervention-state"
                    data-status={row.status.toLowerCase()}
                    aria-pressed={status === row.status}
                    aria-label={`Show ${row.status.toLowerCase()} interventions`}
                    onClick={() => setStatus(row.status)}
                  >
                    {row.status}
                    <span aria-hidden="true">↗</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && (
          <div className="sc-empty" role="status">
            {rows.length
              ? "No interventions match this report. Adjust or reset its filters."
              : "No observations yet. Record an intervention and its evidence to build this report."}
          </div>
        )}
      </div>
      <p className="report-footnote">
        One company can have many interventions. Declared objectives are stated
        in a source; inferred objectives are hypotheses. A start date is never
        taken from the observation date.
      </p>
    </section>
  );
}
