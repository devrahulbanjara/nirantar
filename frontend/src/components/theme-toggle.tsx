"use client";

import {
  DesktopIcon,
  MoonIcon,
  SunIcon,
} from "@phosphor-icons/react/dist/ssr";

import { useTheme } from "@/components/theme-provider";
import type { ThemePreference } from "@/lib/theme";
import { THEME_PREFERENCES } from "@/lib/theme";

const LABELS: Record<ThemePreference, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

const ICONS = {
  system: DesktopIcon,
  light: SunIcon,
  dark: MoonIcon,
} as const;

function nextPreference(current: ThemePreference): ThemePreference {
  const index = THEME_PREFERENCES.indexOf(current);
  return THEME_PREFERENCES[(index + 1) % THEME_PREFERENCES.length];
}

/**
 * Theme control. Appearance is owned here; callers only choose presentation.
 * `cycle` is the compact account-area control. `options` is the settings field.
 */
export function ThemeToggle({
  presentation = "cycle",
}: {
  presentation?: "cycle" | "options";
}) {
  const { preference, setPreference } = useTheme();

  if (presentation === "options") {
    return (
      <div className="theme-options" role="radiogroup" aria-label="Theme">
        {THEME_PREFERENCES.map((value) => {
          const Icon = ICONS[value];
          const selected = value === preference;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              className="theme-option"
              data-selected={selected ? "true" : undefined}
              onClick={() => setPreference(value)}
            >
              <Icon size={18} weight={selected ? "fill" : "regular"} aria-hidden="true" />
              {LABELS[value]}
            </button>
          );
        })}
      </div>
    );
  }

  const Icon = ICONS[preference];
  const upcoming = nextPreference(preference);

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Theme: ${LABELS[preference]}. Switch to ${LABELS[upcoming]}.`}
      onClick={() => setPreference(upcoming)}
    >
      <Icon size={20} weight="regular" aria-hidden="true" />
      <span className="theme-toggle-label">{LABELS[preference]}</span>
    </button>
  );
}
