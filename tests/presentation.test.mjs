import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import path from "node:path";
import ts from "typescript";
const output = ".test-build/presentation";
fs.mkdirSync(output, { recursive: true });
const modulePath = path.resolve(output, "presentation.cjs");
fs.writeFileSync(
  modulePath,
  ts.transpileModule(fs.readFileSync("src/lib/presentation.ts", "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText,
);
const { calendarDate, timestamp } = createRequire(import.meta.url)(modulePath);
test("activity timestamps have explicit UTC text and handle date boundaries", () => {
  assert.equal(timestamp("2026-10-06T10:00:00Z"), "06 Oct 2026, 10:00 UTC");
  assert.equal(
    timestamp("2026-10-06T00:30:00+02:00"),
    "05 Oct 2026, 22:30 UTC",
  );
  assert.equal(calendarDate("2024-02-29T23:59:00Z"), "29 Feb 2024");
  assert.equal(timestamp("invalid"), "Date unavailable");
});
test("server and browser presentation is independent of machine timezone", () => {
  for (const timeZone of [
    "UTC",
    "Europe/London",
    "America/Los_Angeles",
    "Asia/Tokyo",
  ]) {
    const code = `const {timestamp}=require(${JSON.stringify(modulePath)}); process.stdout.write(timestamp('2026-10-06T10:00:00Z'));`;
    const value = execFileSync(process.execPath, ["-e", code], {
      env: { ...process.env, TZ: timeZone },
      encoding: "utf8",
    });
    assert.equal(value, "06 Oct 2026, 10:00 UTC");
  }
});
