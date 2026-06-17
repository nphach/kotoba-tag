import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LabeledSwitch,
  SettingRow,
  ToggleButtons,
} from "@/components/settings-controls.tsx";
import { SiteBranding, SiteFooter } from "@/components/site-chrome.tsx";
import {
  JLPT_LEVELS,
  levelsUpTo,
  TIMER_OPTIONS,
} from "@/lib/settings.ts";
import { useSettings } from "@/lib/settings-context.tsx";
import { Link } from "react-router-dom";

function SettingsPage() {
  const { settings, updateSetting, resetSettings } = useSettings();

  const includedLevels = levelsUpTo(settings.difficulty).join(", ");

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] w-full items-center justify-center overflow-y-auto py-4 text-left sm:px-4 sm:py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-5">
        <div className="flex w-full flex-col gap-4 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <SiteBranding className="text-center sm:text-left" />
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
                onChange={(value) => updateSetting("difficulty", value)}
              />
            </SettingRow>

            <SettingRow
              label="romaji"
              description="show readings and allow romaji for tag words"
            >
              <LabeledSwitch
                checked={settings.showRomaji}
                onCheckedChange={(value) => updateSetting("showRomaji", value)}
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
                onChange={(value) => updateSetting("timerSeconds", value)}
                format={(seconds) => `${seconds}s`}
              />
            </SettingRow>

            <SettingRow label="dark mode">
              <LabeledSwitch
                checked={settings.theme === "dark"}
                onCheckedChange={(checked) =>
                  updateSetting("theme", checked ? "dark" : "light")
                }
                ariaLabel="toggle dark mode"
              />
            </SettingRow>

            <SettingRow
              label="flip layout"
              description="move word history to the left on desktop"
            >
              <LabeledSwitch
                checked={settings.flipDesktopLayout}
                onCheckedChange={(value) =>
                  updateSetting("flipDesktopLayout", value)
                }
                ariaLabel="toggle flipped desktop layout"
              />
            </SettingRow>

            <div className="flex justify-end pt-2">
              <Button type="button" variant="outline" onClick={resetSettings}>
                reset to defaults
              </Button>
            </div>
          </CardContent>
        </Card>

        <SiteFooter />
      </div>
    </main>
  );
}

export default SettingsPage;
