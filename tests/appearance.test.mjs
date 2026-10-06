import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
const output = ".test-build/appearance";
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(
  `${output}/appearance.cjs`,
  ts.transpileModule(fs.readFileSync("src/lib/appearance.ts", "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText,
);
const require = createRequire(import.meta.url);
const {
  defaultAppearance,
  readAppearance,
  resolvedMode,
  appearanceBootstrap,
} = require(`../${output}/appearance.cjs`);
test("corrupt and old preferences recover without affecting workspace records", () => {
  for (const raw of [
    null,
    "{bad",
    "null",
    "[]",
    '{"version":2,"theme":"paper","mode":"light"}',
    '{"version":1,"theme":"admin","mode":"dark"}',
    '{"version":1,"theme":"paper","mode":"unknown"}',
  ]) {
    assert.deepEqual(readAppearance(raw), defaultAppearance);
    assert.equal(readAppearance(raw, "light").mode, "light");
  }
  assert.deepEqual(defaultAppearance, {
    version: 1,
    theme: "ifagrithm",
    mode: "dark",
  });
});
test("theme and mode round trips retain the Ifagrithm mode under fixed skins", () => {
  for (const theme of ["ifagrithm", "paper", "terminal"])
    for (const mode of ["dark", "light", "system"]) {
      const preference = { version: 1, theme, mode };
      assert.deepEqual(readAppearance(JSON.stringify(preference)), preference);
      for (const dark of [false, true])
        assert.equal(
          resolvedMode(preference, dark),
          theme === "paper"
            ? "light"
            : theme === "terminal"
              ? "dark"
              : mode === "system"
                ? dark
                  ? "dark"
                  : "light"
                : mode,
        );
    }
});
test("pre-paint bootstrap agrees with preference resolution including corrupt storage", () => {
  const fixtures = [
    null,
    "{broken",
    '{"version":2,"theme":"paper","mode":"system"}',
    ...["ifagrithm", "paper", "terminal"].flatMap((theme) =>
      ["dark", "light", "system"].map((mode) =>
        JSON.stringify({ version: 1, theme, mode }),
      ),
    ),
  ];
  for (const raw of fixtures)
    for (const legacy of [null, "light"])
      for (const dark of [true, false]) {
        const document = { documentElement: { dataset: {} } };
        vm.runInNewContext(appearanceBootstrap, {
          document,
          localStorage: {
            getItem: (key) =>
              key === "ifagrithm-appearance-v1" ? raw : legacy,
          },
          matchMedia: () => ({ matches: dark }),
        });
        const preference = readAppearance(raw, legacy);
        assert.equal(document.documentElement.dataset.theme, preference.theme);
        assert.equal(
          document.documentElement.dataset.mode,
          resolvedMode(preference, dark),
        );
      }
});
test("blocked browser storage still permits default appearance and page rendering", () => {
  const document = { documentElement: { dataset: {} } };
  vm.runInNewContext(appearanceBootstrap, {
    document,
    localStorage: {
      getItem: () => {
        throw Error("blocked");
      },
    },
  });
  assert.equal(document.documentElement.dataset.theme, "ifagrithm");
  assert.equal(document.documentElement.dataset.mode, "dark");
});
