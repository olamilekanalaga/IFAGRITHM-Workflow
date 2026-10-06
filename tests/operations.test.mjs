import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
mkdirSync(".test-build", { recursive: true });
for (const name of ["model", "operations", "seed"])
  writeFileSync(
    `.test-build/${name}.js`,
    ts.transpileModule(readFileSync(`src/lib/${name}.ts`, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
  );
const require = createRequire(import.meta.url);
const { seed } = require("../.test-build/seed.js");
const {
  companyStage,
  stageRecords,
  attention,
  validateProblem,
  mergeDemo,
  matchesStage,
  updateRecord,
} = require("../.test-build/operations.js");
const { capture, relatedIds } = require("../.test-build/model.js");
test("operating counts reflect actual open work, not illustrative metrics", () => {
  assert.equal(stageRecords(seed, "Decide").length, 2);
  assert.equal(stageRecords(seed, "Deliver").length, 1);
  assert.equal(stageRecords(seed, "Approach").length, 1);
  assert.equal(stageRecords(seed, "Convert").length, 1);
  assert.equal(attention(seed, "Ola").length, 3);
  assert.equal(attention(seed, "Analyst").length, 2);
});
test("an observation and its tentative insight do not create a confirmed problem", () => {
  const nova = seed.records.find((r) => r.id === "nova");
  assert.equal(companyStage(nova), "Convert");
  assert.equal(
    seed.records.find((r) => r.id === "nova-problem").problemState,
    "Hypothesis",
  );
  const problem = {
    ...seed.records.find((r) => r.id === "nova-problem"),
    problemState: "Client-confirmed",
    validationEvidenceId: "nova-evidence",
  };
  assert.throws(
    () => validateProblem(seed, problem, "nova"),
    /conversation evidence/,
  );
  assert.throws(
    () => validateProblem(seed, problem, "tide"),
    /Convert, Deliver or Learn/,
  );
});
test("client confirmation requires connected client conversation evidence", () => {
  const problem = seed.records.find((r) => r.id === "vela-problem");
  assert.doesNotThrow(() => validateProblem(seed, problem, "vela"));
  assert.throws(
    () =>
      validateProblem(
        seed,
        { ...problem, validationEvidenceId: "nova-evidence" },
        "vela",
      ),
    /conversation evidence/,
  );
});
test("one investigation supports both content and commercial branches", () => {
  const connected = relatedIds(seed, "nova-research");
  assert.ok(connected.has("nova-content"));
  assert.ok(connected.has("nova-action"));
  assert.ok(connected.has("nova-decision"));
  assert.equal(
    seed.records.find((r) => r.id === "nova-decision").disposition,
    "Commercial + Content",
  );
});
test("additive demonstration upgrade preserves existing records and custom captures", () => {
  const existing = {
    ...seed,
    records: seed.records.filter(
      (r) => !["Content", "Delivery", "Decision", "Problem"].includes(r.kind),
    ),
    relations: [],
    activity: [],
  };
  const edited = { ...existing.records[0], body: "Custom notes must survive" };
  existing.records[0] = edited;
  const custom = {
    id: "custom",
    kind: "Observation",
    title: "Real user capture",
    body: "Do not overwrite",
    status: "Recorded",
    owner: "Scout",
    createdAt: "2026-10-06T10:00:00.000Z",
  };
  existing.records.push(custom);
  const merged = mergeDemo(existing, seed);
  assert.deepEqual(
    merged.records.find((r) => r.id === edited.id),
    edited,
  );
  assert.deepEqual(
    merged.records.find((r) => r.id === "custom"),
    custom,
  );
  assert.equal(mergeDemo(merged, seed).records.length, merged.records.length);
  for (const edge of merged.relations)
    assert.ok(
      merged.records.some((r) => r.id === edge.from) &&
        merged.records.some((r) => r.id === edge.to),
    );
});
test("stage change and content publication update counts and preserve an activity trail", () => {
  const changed = updateRecord(seed, "orbit", { workflowStage: "Convert" });
  assert.equal(stageRecords(changed, "Approach").length, 0);
  assert.equal(stageRecords(changed, "Convert").length, 2);
  assert.equal(changed.activity.length, seed.activity.length + 1);
  assert.ok(
    matchesStage(
      changed,
      changed.records.find((r) => r.id === "orbit"),
      "Convert",
    ),
  );
  const published = updateRecord(seed, "tide-content", { status: "Published" });
  assert.equal(
    published.records.filter(
      (r) => r.kind === "Content" && r.status === "Ready to publish",
    ).length,
    1,
  );
});
test("new content capture remains linked to its parent research and contributor", () => {
  const item = {
    id: "content-new",
    kind: "Content",
    title: "New brief",
    body: "Draft limitations",
    owner: "Sam",
    status: "Draft",
    createdAt: new Date().toISOString(),
  };
  const next = capture(seed, item, "tide-research", "content branch");
  assert.ok(
    next.relations.some((r) => r.from === "tide-research" && r.to === item.id),
  );
  assert.equal(next.activity[0].actor, "Sam");
  assert.equal(
    seed.records.some((r) => r.id === item.id),
    false,
  );
});
test("completed and archived assignments leave the operating attention queues", () => {
  const completed = updateRecord(seed, "approve-orbit", {
    status: "Completed",
  });
  assert.equal(attention(completed, "Ola").length, 2);
  const archived = updateRecord(seed, "analyse-tide", { status: "Archived" });
  assert.equal(attention(archived, "Analyst").length, 1);
});
