"use client";
import { useId } from "react";
import {
  interventionStatuses,
  type InterventionInput,
  type InterventionFields,
  type IntentBasis,
} from "@/lib/intervention-model";
import { calendarDate } from "@/lib/presentation";
export function InterventionFieldsForm({
  value,
  update,
}: {
  value: InterventionInput;
  update: (value: InterventionInput) => void;
}) {
  const id = useId();
  return (
    <details className="capture-context">
      <summary>
        Intervention context <span>Optional · powers the report</span>
      </summary>
      <p>
        Record only what you know. Keep unknown dates and resources empty; label
        an objective as declared or inferred.
      </p>
      <div className="sc-form-grid">
        <label>
          Resource
          <input
            maxLength={200}
            value={value.resource}
            placeholder="e.g. $100K, tokens, creator fees"
            onChange={(e) => update({ ...value, resource: e.target.value })}
          />
        </label>
        <label>
          Desired behaviour
          <input
            list={id}
            maxLength={80}
            value={value.desiredBehaviour}
            placeholder="e.g. Trading, Attention, LP deposits"
            onChange={(e) =>
              update({
                ...value,
                desiredBehaviour: e.target.value,
                intentBasis: e.target.value ? value.intentBasis : "Unknown",
              })
            }
          />
          <datalist id={id}>
            {[
              "Attention",
              "Trading",
              "Development",
              "Content",
              "New users",
              "LP deposits",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </datalist>
        </label>
        <label>
          Objective basis
          <select
            value={value.intentBasis}
            onChange={(e) =>
              update({ ...value, intentBasis: e.target.value as IntentBasis })
            }
          >
            <option value="Unknown">Not recorded</option>
            <option value="Declared">Declared in source</option>
            <option value="Inferred">Inferred / hypothesis</option>
          </select>
        </label>
        <label>
          Start date (if known)
          <input
            type="date"
            min="0001-01-01"
            max="9999-12-31"
            value={value.startedOn}
            onChange={(e) => update({ ...value, startedOn: e.target.value })}
          />
        </label>
        <label>
          Intervention status
          <select
            value={value.interventionStatus}
            onChange={(e) =>
              update({
                ...value,
                interventionStatus: e.target
                  .value as InterventionInput["interventionStatus"],
              })
            }
          >
            {interventionStatuses.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      <small>
        Declared means the attached evidence states the objective. Inferred
        means your interpretation. This status describes the intervention, not
        the commercial pipeline.
      </small>
    </details>
  );
}
export function InterventionContext({
  observation,
  resource,
}: {
  observation: InterventionFields;
  resource?: string;
}) {
  return (
    <dl className="intervention-context">
      <div>
        <dt>Resource</dt>
        <dd>{observation.resource || resource || "Not recorded"}</dd>
      </div>
      <div>
        <dt>Desired behaviour</dt>
        <dd>
          {observation.desired_behaviour || "Not recorded"}
          {observation.desired_behaviour && (
            <small>{observation.intent_basis || "Basis not recorded"}</small>
          )}
        </dd>
      </div>
      <div>
        <dt>Started</dt>
        <dd>
          {observation.started_on
            ? calendarDate(observation.started_on)
            : "Unknown"}
        </dd>
      </div>
      <div>
        <dt>Intervention status</dt>
        <dd>{observation.intervention_status || "Unknown"}</dd>
      </div>
    </dl>
  );
}
