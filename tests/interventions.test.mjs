import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
mkdirSync(".test-build/interventions", { recursive: true });
for (const name of [
  "identity",
  "model",
  "scout",
  "intervention-model",
  "intervention-report",
])
  writeFileSync(
    `.test-build/interventions/${name}.js`,
    ts.transpileModule(readFileSync(`src/lib/${name}.ts`, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
  );
const require = createRequire(import.meta.url);
const {
  snapshotInterventions,
  filterInterventions,
  memoryInterventions,
} = require("../.test-build/interventions/intervention-report.js");
const {
  normalizeIntervention,
} = require("../.test-build/interventions/intervention-model.js");
const { saveObservation } = require("../.test-build/interventions/scout.js");
const company = {
  id: "company-1",
  name: "NOVA",
  domain: "nova.example",
  category: "Protocol",
  status: "Completed",
  merged_into: null,
};
const obs = {
  id: "obs-1",
  company_id: "company-1",
  behaviour: "Bounty",
  description: "Developer bounty.",
  detail: "$20K",
  observed_on: "2026-10-06",
  deleted_at: null,
  merged_into: null,
};
const snapshot = {
  companies: [company],
  observations: [obs],
  sources: [
    { observation_id: "obs-1", deleted_at: null },
    { observation_id: "obs-1", deleted_at: null },
  ],
};
test("multiple sources remain one report event, and commercial completion cannot determine intervention status", () => {
  const rows = snapshotInterventions(snapshot);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].sourceCount, 2);
  assert.equal(rows[0].status, "Unknown");
  assert.equal(rows[0].startedOn, null);
  assert.equal(rows[0].desiredBehaviour, "");
  assert.equal(rows[0].resource, "$20K");
});
test("creator counts and partners are not silently converted into resources", () => {
  for (const [behaviour, detail] of [
    ["KOL Campaign", "8"],
    ["Partnership", "Another company"],
  ])
    assert.equal(
      snapshotInterventions({
        ...snapshot,
        observations: [{ ...obs, behaviour, detail }],
      })[0].resource,
      "",
    );
  assert.equal(
    snapshotInterventions({
      ...snapshot,
      observations: [{ ...obs, behaviour: "Fundraise", detail: "$8M" }],
    })[0].resource,
    "Raised: $8M",
  );
});
test("report filters combine search, intervention, lifecycle and individual desired behaviours", () => {
  const rows = snapshotInterventions({
    ...snapshot,
    observations: [
      {
        ...obs,
        desired_behaviour: "Development / Content",
        intent_basis: "Inferred",
        intervention_status: "Active",
        started_on: "2026-09-01",
      },
      {
        ...obs,
        id: "obs-2",
        behaviour: "KOL Campaign",
        desired_behaviour: "Attention",
        intent_basis: "Declared",
        intervention_status: "Ended",
      },
    ],
  });
  assert.equal(rows.length, 2);
  assert.equal(
    filterInterventions(rows, "bounty", "Bounty", "Active", "Content").length,
    1,
  );
  assert.equal(filterInterventions(rows, "", "Bounty", "Ended", "").length, 0);
  assert.equal(
    filterInterventions(rows, "NOVA", "", "Ended", "Attention").length,
    1,
  );
  assert.equal(filterInterventions(rows, "", "", "", "__unknown").length, 0);
});
test("same-name companies retain separate report identities, and removed or merged records stay excluded", () => {
  const rows = snapshotInterventions({
    ...snapshot,
    companies: [
      company,
      { ...company, id: "company-2", domain: "other.example" },
    ],
    observations: [
      obs,
      { ...obs, id: "obs-2", company_id: "company-2" },
      { ...obs, id: "deleted", deleted_at: "2026-10-06" },
      { ...obs, id: "merged", merged_into: "obs-1" },
    ],
  });
  assert.deepEqual(
    rows.map((r) => r.companyId),
    ["company-1", "company-2"],
  );
});
test("objective provenance and actual calendar dates are required instead of inferred defaults", () => {
  assert.throws(
    () => normalizeIntervention({ desiredBehaviour: "Trading" }),
    /Declared or Inferred/,
  );
  assert.throws(
    () => normalizeIntervention({ startedOn: "2026-02-31" }),
    /start date/,
  );
  assert.throws(
    () => normalizeIntervention({ interventionStatus: "Completed" }),
    /valid intervention status/,
  );
  assert.equal(
    normalizeIntervention({ desiredBehaviour: "", intentBasis: "Declared" })
      .intentBasis,
    "Unknown",
  );
  assert.equal(
    normalizeIntervention({ startedOn: "2024-02-29" }).startedOn,
    "2024-02-29",
  );
});
test("local capture preserves explicit context without changing company identity or commercial status", () => {
  const memory = { version: 1, records: [], relations: [], activity: [] };
  const input = {
    company: "NOVA",
    website: "nova.example",
    category: "Protocol",
    behaviour: "Bounty",
    description: "Developer bounty.",
    source: "https://news.example/bounty",
    detail: "$20K",
    observedAt: "2026-10-06",
    owner: "Scout",
    resource: "$20K",
    desiredBehaviour: "Development",
    intentBasis: "Declared",
    startedOn: "2026-09-01",
    interventionStatus: "Active",
  };
  const saved = saveObservation(memory, input);
  const rows = memoryInterventions(saved.memory);
  assert.equal(rows[0].status, "Active");
  assert.equal(rows[0].startedOn, "2026-09-01");
  assert.equal(rows[0].intentBasis, "Declared");
  assert.equal(
    saved.memory.records.find((r) => r.kind === "Company").status,
    "Saved",
  );
  assert.equal(memory.records.length, 0);
  assert.throws(() =>
    saveObservation(memory, { ...input, intentBasis: "Unknown" }),
  );
  assert.equal(memory.records.length, 0);
});
