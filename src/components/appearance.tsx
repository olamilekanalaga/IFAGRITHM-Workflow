"use client";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  Appearance,
  appearanceKey,
  ColourMode,
  defaultAppearance,
  modes,
  readAppearance,
  resolvedMode,
  Theme,
  themes,
} from "@/lib/appearance";

const AppearanceContext = createContext<{
  preference: Appearance;
  ready: boolean;
  storageBlocked: boolean;
  update: (next: Appearance) => void;
} | null>(null);
export function AppearanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preference, setPreference] = useState(defaultAppearance);
  const [ready, setReady] = useState(false);
  const [storageBlocked, setStorageBlocked] = useState(false);
  useEffect(() => {
    function read() {
      try {
        setPreference(
          readAppearance(
            localStorage.getItem(appearanceKey),
            localStorage.getItem("ifagrithm-theme"),
          ),
        );
      } catch {
        setStorageBlocked(true);
      }
    }
    read();
    setReady(true);
    const changed = (event: StorageEvent) => {
      if (event.key === appearanceKey || event.key === null) read();
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function apply() {
      document.documentElement.dataset.theme = preference.theme;
      document.documentElement.dataset.mode = resolvedMode(
        preference,
        media.matches,
      );
    }
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preference, ready]);
  function update(next: Appearance) {
    setPreference(next);
    try {
      localStorage.setItem(appearanceKey, JSON.stringify(next));
      setStorageBlocked(false);
    } catch {
      setStorageBlocked(true);
    }
  }
  return (
    <AppearanceContext.Provider
      value={{ preference, ready, storageBlocked, update }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}
const descriptions: Record<Theme, { name: string; description: string }> = {
  ifagrithm: {
    name: "Ifagrithm",
    description: "Charcoal. Clear signals. A little yellow.",
  },
  paper: {
    name: "Paper",
    description: "Editorial type, paper grain and fine rules.",
  },
  terminal: {
    name: "Terminal",
    description: "Compact, technical and focused.",
  },
};
export function AppearanceSwitcher() {
  const context = useContext(AppearanceContext);
  const [open, setOpen] = useState(false);
  const [panelTop, setPanelTop] = useState(150);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    const resize = () => setOpen(false);
    window.addEventListener("resize", resize);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", keyboard);
    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", keyboard);
    };
  }, [open]);
  if (!context) return null;
  const { preference, ready, storageBlocked, update } = context;
  return (
    <div
      className="appearance"
      ref={wrapper}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setOpen(false);
      }}
    >
      <button
        type="button"
        ref={trigger}
        className="appearance-trigger"
        disabled={!ready}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          if (!open && trigger.current)
            setPanelTop(
              Math.min(
                trigger.current.getBoundingClientRect().bottom + 12,
                Math.max(80, window.innerHeight - 240),
              ),
            );
          setOpen(!open);
        }}
      >
        <span aria-hidden="true">◐</span> Appearance{" "}
        <span className="appearance-current">
          / {ready ? descriptions[preference.theme].name : "…"}
        </span>
      </button>
      {open && (
        <section
          className="appearance-panel"
          style={{ "--appearance-top": `${panelTop}px` } as React.CSSProperties}
          id={id}
          aria-label="Appearance preferences"
        >
          <div className="appearance-heading">
            <span>YOUR WORKSPACE, YOUR VIEW</span>
            <button
              type="button"
              aria-label="Close appearance preferences"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              ×
            </button>
          </div>
          <fieldset className="appearance-themes">
            <legend>Theme</legend>
            {themes.map((theme) => (
              <label
                className={`appearance-choice preview-${theme}`}
                key={theme}
              >
                <input
                  type="radio"
                  name={`${id}-theme`}
                  value={theme}
                  checked={preference.theme === theme}
                  onChange={() => update({ ...preference, theme })}
                />
                <span className="appearance-swatch" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span>
                  <strong>{descriptions[theme].name}</strong>
                  <small>{descriptions[theme].description}</small>
                </span>
              </label>
            ))}
          </fieldset>
          {preference.theme === "ifagrithm" ? (
            <fieldset className="appearance-modes">
              <legend>Colour mode</legend>
              {modes.map((mode) => (
                <label key={mode}>
                  <input
                    type="radio"
                    name={`${id}-mode`}
                    checked={preference.mode === mode}
                    onChange={() =>
                      update({ ...preference, mode: mode as ColourMode })
                    }
                  />
                  {mode[0].toUpperCase() + mode.slice(1)}
                </label>
              ))}
            </fieldset>
          ) : (
            <p className="appearance-note">
              {preference.theme === "paper"
                ? "Paper uses a light canvas."
                : "Terminal uses a dark canvas."}{" "}
              Your Ifagrithm colour-mode preference is kept.
            </p>
          )}
          <p className="appearance-note" role="status">
            {storageBlocked
              ? "Available for this visit. Browser storage is unavailable."
              : "Saved in this browser. Your records and workflow stay the same."}
          </p>
        </section>
      )}
    </div>
  );
}
