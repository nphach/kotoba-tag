import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SETTINGS,
  type GameSettings,
  getSettings,
  setSettings,
  type JlptLevel,
  type Theme,
  type TimerSeconds,
} from "./settings.ts";

type SettingsContextValue = {
  settings: GameSettings;
  setDifficulty: (difficulty: JlptLevel) => void;
  setShowRomaji: (showRomaji: boolean) => void;
  setTimerSeconds: (timerSeconds: TimerSeconds) => void;
  setTheme: (theme: Theme) => void;
  setFlipDesktopLayout: (flipDesktopLayout: boolean) => void;
  resetSettings: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<GameSettings>(getSettings);

  const commit = useCallback((next: GameSettings) => {
    setSettings(next);
    setSettingsState(next);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      setDifficulty: (difficulty) =>
        commit({ ...settings, difficulty }),
      setShowRomaji: (showRomaji) =>
        commit({ ...settings, showRomaji }),
      setTimerSeconds: (timerSeconds) =>
        commit({ ...settings, timerSeconds }),
      setTheme: (theme) => commit({ ...settings, theme }),
      setFlipDesktopLayout: (flipDesktopLayout) =>
        commit({ ...settings, flipDesktopLayout }),
      resetSettings: () => commit({ ...DEFAULT_SETTINGS }),
    }),
    [commit, settings],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
