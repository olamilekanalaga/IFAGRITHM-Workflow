import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
mkdirSync(".test-build/scout", { recursive: true });
for (const name of ["model", "scout", "intervention-model"])
  writeFileSync(
    `.test-build/scout/${name}.js`,
    ts.transpileModule(readFileSync(`src/lib/${name}.ts`, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
  );
const require = createRequire(import.meta.url);
const {
  saveObservation,
  companyObservations,
  filterCompanies,
  approached,
  domainOf,
  sourceUrl,
  metricLabel,
} = require("../.test-build/scout/scout.js");
const memory = { version: 1, records: [], relations: [], activity: [] };
const input = {
  company: "Test Protocol",
  website: "https://www.example.com/news",
  category: "Protocol",
  behaviour: "Bounty",
  description: "Announced a bounty.",
  source: "https://example.com/announcement",
  detail: "$20,000",
  observedAt: "2026-10-06",
  owner: "Scout",
};
test("capture creates linked company, observation, label and evidence atomically", () => {
  const r = saveObservation(memory, input);
  assert.equal(memory.records.length, 0);
  assert.equal(r.memory.records.length, 4);
  assert.equal(r.memory.relations.length, 3);
  assert.equal(companyObservations(r.memory, r.companyId).length, 1);
  assert.equal(r.memory.activity[0].actor, "Scout");
});
test("domain deduplication preserves company status and older observations", () => {
  const first = saveObservation(memory, input);
  first.memory.records.find((r) => r.id === first.companyId).status =
    "Conversation";
  const next = saveObservation(first.memory, {
    ...input,
    company: "Different spelling",
    website: "example.com",
    behaviour: "Fundraise",
    detail: "$8M",
  });
  assert.equal(next.companyId, first.companyId);
  assert.equal(
    next.memory.records.filter((r) => r.kind === "Company").length,
    1,
  );
  assert.equal(companyObservations(next.memory, next.companyId).length, 2);
  assert.equal(
    next.memory.records.find((r) => r.id === next.companyId).status,
    "Conversation",
  );
  assert.equal(
    filterCompanies(next.memory, "", "Bounty", "Protocol", "Conversation")
      .length,
    1,
  );
  assert.equal(
    filterCompanies(next.memory, "", "Bounty", "Protocol", "Not Approached")
      .length,
    0,
  );
});
test("invalid source or credentials cannot partially create records", () => {
  assert.throws(() =>
    saveObservation(memory, { ...input, source: "javascript:alert(1)" }),
  );
  assert.throws(() => sourceUrl("https://user:password@example.com"));
  assert.throws(() => domainOf("javascript:bad"));
  assert.equal(memory.records.length, 0);
});
test("different company domain is not silently merged by name", () => {
  const first = saveObservation(memory, input);
  assert.throws(
    () => saveObservation(first.memory, { ...input, website: "other.example" }),
    /another domain/,
  );
});
test("adaptive details and approach states are explicit", () => {
  assert.equal(metricLabel("KOL Campaign"), "Creators observed");
  assert.equal(metricLabel("Fundraise"), "Raised");
  assert.equal(approached("Researching"), false);
  assert.equal(approached("Completed"), true);
  assert.throws(
    () =>
      saveObservation(memory, {
        ...input,
        behaviour: "KOL Campaign",
        detail: "many",
      }),
    /whole number/,
  );
});
test("same-day history uses capture time to put the newest observation first", () => {
  const first = saveObservation(memory, input);
  first.memory.records.find((r) => r.kind === "Observation").createdAt =
    "2026-10-06T08:00:00.000Z";
  const second = saveObservation(first.memory, {
    ...input,
    behaviour: "Fundraise",
  });
  second.memory.records.find(
    (r) => r.kind === "Observation" && r.behaviourLabel === "Fundraise",
  ).createdAt = "2026-10-06T09:00:00.000Z";
  assert.equal(
    companyObservations(second.memory, first.companyId)[0].behaviourLabel,
    "Fundraise",
  );
  assert.equal(
    filterCompanies(second.memory, "", "Bounty", "Protocol", "Not Approached")
      .length,
    1,
  );
});
