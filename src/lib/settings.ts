export const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
export type JlptLevel = (typeof JLPT_LEVELS)[number];

export const TIMER_OPTIONS = [15, 30, 45, 60, 90] as const;
export type TimerSeconds = (typeof TIMER_OPTIONS)[number];

export type Theme = "light" | "dark";

export type GameSettings = {
  difficulty: JlptLevel;
  showRomaji: boolean;
  timerSeconds: TimerSeconds;
  theme: Theme;
  flipDesktopLayout: boolean;
};

export const DEFAULT_SETTINGS: GameSettings = {
  difficulty: "N5",
  showRomaji: false,
  timerSeconds: 30,
  theme: "light",
  flipDesktopLayout: false,
};

const STORAGE_KEY = "kotoba-tag-settings";

export function levelsUpTo(maxLevel: JlptLevel): JlptLevel[] {
  const index = JLPT_LEVELS.indexOf(maxLevel);
  return JLPT_LEVELS.slice(0, index + 1) as JlptLevel[];
}

export function isLevelWithinDifficulty(
  wordLevel: JlptLevel,
  difficulty: JlptLevel,
): boolean {
  return levelsUpTo(difficulty).includes(wordLevel);
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function isJlptLevel(value: unknown): value is JlptLevel {
  return (
    typeof value === "string" && JLPT_LEVELS.includes(value as JlptLevel)
  );
}

function isTimerSeconds(value: unknown): value is TimerSeconds {
  return (
    typeof value === "number" && TIMER_OPTIONS.includes(value as TimerSeconds)
  );
}

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };

    const parsed = JSON.parse(raw) as Partial<GameSettings>;

    return {
      difficulty: isJlptLevel(parsed.difficulty)
        ? parsed.difficulty
        : DEFAULT_SETTINGS.difficulty,
      showRomaji:
        typeof parsed.showRomaji === "boolean"
          ? parsed.showRomaji
          : DEFAULT_SETTINGS.showRomaji,
      timerSeconds: isTimerSeconds(parsed.timerSeconds)
        ? parsed.timerSeconds
        : DEFAULT_SETTINGS.timerSeconds,
      theme: isTheme(parsed.theme) ? parsed.theme : DEFAULT_SETTINGS.theme,
      flipDesktopLayout:
        typeof parsed.flipDesktopLayout === "boolean"
          ? parsed.flipDesktopLayout
          : DEFAULT_SETTINGS.flipDesktopLayout,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

let cachedSettings: GameSettings | null = null;

export function getSettings(): GameSettings {
  if (!cachedSettings) {
    cachedSettings = loadSettings();
  }
  return cachedSettings;
}

export function setSettings(next: GameSettings): void {
  cachedSettings = next;
  saveSettings(next);
  applyTheme(next.theme);
}

export function updateSettings(partial: Partial<GameSettings>): GameSettings {
  const next = { ...getSettings(), ...partial };
  setSettings(next);
  return next;
}

applyTheme(getSettings().theme);
