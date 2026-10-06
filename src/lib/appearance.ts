export const appearanceKey = "ifagrithm-appearance-v1";
export const themes = ["ifagrithm", "paper", "terminal"] as const;
export const modes = ["dark", "light", "system"] as const;
export type Theme = (typeof themes)[number];
export type ColourMode = (typeof modes)[number];
export type Appearance = { version: 1; theme: Theme; mode: ColourMode };
export const defaultAppearance: Appearance = {
  version: 1,
  theme: "ifagrithm",
  mode: "dark",
};

// A small preference boundary: a future profile adapter can supply this same value.
// No database fields, auth permissions or workspace records depend on appearance.
export function readAppearance(
  raw: string | null,
  legacyMode: string | null = null,
): Appearance {
  try {
    const value: unknown = raw ? JSON.parse(raw) : null;
    if (
      value &&
      typeof value === "object" &&
      "version" in value &&
      value.version === 1 &&
      "theme" in value &&
      themes.includes(value.theme as Theme) &&
      "mode" in value &&
      modes.includes(value.mode as ColourMode)
    ) {
      return {
        version: 1,
        theme: value.theme as Theme,
        mode: value.mode as ColourMode,
      };
    }
  } catch {
    /* Invalid preferences must never prevent workspace access. */
  }
  return {
    ...defaultAppearance,
    mode: legacyMode === "light" ? "light" : "dark",
  };
}
export function resolvedMode(
  preference: Appearance,
  systemDark: boolean,
): "dark" | "light" {
  if (preference.theme === "paper") return "light";
  if (preference.theme === "terminal") return "dark";
  return preference.mode === "system"
    ? systemDark
      ? "dark"
      : "light"
    : preference.mode;
}

// Static pre-paint bootstrap; only validated enum values reach HTML attributes.
export const appearanceBootstrap = `(() => {
  let p = { theme: 'ifagrithm', mode: 'dark' };
  try {
    const raw = localStorage.getItem('ifagrithm-appearance-v1');
    let v; try { v = raw ? JSON.parse(raw) : null; } catch {}
    if (v && v.version === 1 && ['ifagrithm','paper','terminal'].includes(v.theme) && ['dark','light','system'].includes(v.mode)) p = v;
    else if (localStorage.getItem('ifagrithm-theme') === 'light') p.mode = 'light';
  } catch {}
  const dark = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)').matches : true;
  document.documentElement.dataset.theme = p.theme;
  document.documentElement.dataset.mode = p.theme === 'paper' ? 'light' : p.theme === 'terminal' ? 'dark' : p.mode === 'system' ? (dark ? 'dark' : 'light') : p.mode;
})();`;
