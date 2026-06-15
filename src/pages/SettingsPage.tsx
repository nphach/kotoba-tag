import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  JLPT_LEVELS,
  levelsUpTo,
  TIMER_OPTIONS,
} from "@/lib/settings.ts";
import { useSettings } from "@/lib/settings-context.tsx";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

function LabeledSwitch({
  checked,
  onCheckedChange,
  ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "min-w-6 text-xs font-medium",
          !checked ? "text-foreground" : "text-muted-foreground",
        )}
      >
        off
      </span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={ariaLabel}
      />
      <span
        className={cn(
          "min-w-6 text-xs font-medium",
          checked ? "text-foreground" : "text-muted-foreground",
        )}
      >
        on
      </span>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-5 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function ToggleButtons<T extends string | number>({
  value,
  options,
  onChange,
  format = (option) => String(option),
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  format?: (option: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={String(option)}
          type="button"
          size="sm"
          variant={value === option ? "default" : "outline"}
          onClick={() => onChange(option)}
        >
          {format(option)}
        </Button>
      ))}
    </div>
  );
}

function SettingsPage() {
  const {
    settings,
    setDifficulty,
    setShowRomaji,
    setTimerSeconds,
    setTheme,
    resetSettings,
  } = useSettings();

  const includedLevels = levelsUpTo(settings.difficulty).join(", ");

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] w-full items-center justify-center overflow-y-auto py-4 text-left sm:px-4 sm:py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-5">
        <div className="flex w-full flex-col gap-4 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div className="space-y-2">
            <p className="text-4xl font-kosugi">Kotoba Tag!</p>
            <p className="text-sm text-muted-foreground">
              <i>shiritori</i> for Japanese vocabulary practice
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/">back to game</Link>
          </Button>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-kosugi">settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <SettingRow
              label="difficulty"
              description={`includes ${includedLevels} vocabulary`}
            >
              <ToggleButtons
                value={settings.difficulty}
                options={JLPT_LEVELS}
                onChange={setDifficulty}
              />
            </SettingRow>

            <SettingRow
              label="romaji"
              description="show readings and allow romaji for tag words"
            >
              <LabeledSwitch
                checked={settings.showRomaji}
                onCheckedChange={setShowRomaji}
                ariaLabel="toggle romaji"
              />
            </SettingRow>

            <SettingRow
              label="timer"
              description="seconds per mystery word"
            >
              <ToggleButtons
                value={settings.timerSeconds}
                options={TIMER_OPTIONS}
                onChange={setTimerSeconds}
                format={(seconds) => `${seconds}s`}
              />
            </SettingRow>

            <SettingRow label="dark mode">
              <LabeledSwitch
                checked={settings.theme === "dark"}
                onCheckedChange={(checked) =>
                  setTheme(checked ? "dark" : "light")
                }
                ariaLabel="toggle dark mode"
              />
            </SettingRow>

            <div className="flex justify-end pt-2">
              <Button type="button" variant="outline" onClick={resetSettings}>
                reset to defaults
              </Button>
            </div>
          </CardContent>
        </Card>

        <a
          href="https://nphach.github.io"
          className="block text-center text-xs font-kosugi font-bold"
        >
          made by nphach
        </a>
      </div>
    </main>
  );
}

export default SettingsPage;
