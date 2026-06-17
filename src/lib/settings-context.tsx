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
} from "./settings.ts";

type SettingsContextValue = {
  settings: GameSettings;
  updateSetting: <K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K],
  ) => void;
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
      updateSetting: (key, value) => commit({ ...settings, [key]: value }),
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
