import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DesktopGameGrid,
  DesktopGameShell,
  DesktopWordHistoryAside,
} from "@/components/desktop-game-shell.tsx";
import { GameHudSlot } from "@/components/game-hud.tsx";
import { MysteryWordToast, useGameToast } from "@/components/game-toast.tsx";
import {
  LastTagWordCard,
  MysteryWordDisplay,
} from "@/components/mystery-word-display.tsx";
import { Input } from "@/components/ui/input";
import { SiteTitle } from "@/components/site-chrome.tsx";
import { WordHistoryPanel } from "@/components/word-history-panel.tsx";
import { getPhaseLabel } from "@/lib/game-display.ts";
import { useGame } from "@/lib/game-context.tsx";
import { layoutClasses } from "@/lib/layout-classes.ts";
import { useSettings } from "@/lib/settings-context.tsx";
import type { Hiragana } from "@/lib/types.ts";
import { useWordDetails } from "@/lib/word-details-context.tsx";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import * as wanakana from "wanakana";

const { toHiragana } = wanakana;

export function PlayScreen() {
  const [state, send] = useGame();
  const { settings } = useSettings();
  const { handleWordClick, wordDetailDialog } = useWordDetails();
  const defInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const visibleToast = useGameToast(state.context.toast);

  const {
    mysteryWord,
    score,
    multiplier,
    timer,
    wordHistory,
    tagWord,
    tagDefinitions,
  } = state.context;

  const inDefPhase = state.matches({ playRound: { presentMystery: "part1" } });
  const inTagPhase = state.matches({ playRound: { presentMystery: "part2" } });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    flushSync(() => {
      const rawTag = inTagPhase ? String(formData.get("t") ?? "") : "";
      send({
        type: "SUBMIT",
        definition: inDefPhase ? formData.get("d") : undefined,
        tagWord: inTagPhase
          ? ((settings.showRomaji ? toHiragana(rawTag) : rawTag) as Hiragana)
          : undefined,
      });
    });
  };

  useEffect(() => {
    if (inTagPhase && tagInputRef.current && !settings.showRomaji) {
      const input = tagInputRef.current;
      wanakana.bind(input);
      return () => wanakana.unbind(input);
    }
  }, [inTagPhase, settings.showRomaji]);

  useEffect(() => {
    if (inDefPhase) {
      defInputRef.current?.focus();
    } else if (inTagPhase) {
      tagInputRef.current?.focus();
    }
  }, [inDefPhase, inTagPhase]);

  return (
    <DesktopGameShell variant="play">
      <div className="shrink-0 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <SiteTitle />
          <p
            className={cn(
              "text-sm font-medium",
              inDefPhase ? "text-phase-def" : "text-phase-tag",
            )}
          >
            {getPhaseLabel(inDefPhase)}
          </p>
        </div>
        <GameHudSlot
          placement="tablet"
          score={score}
          multiplier={multiplier}
          timer={timer}
        />
        <GameHudSlot
          placement="desktop"
          score={score}
          multiplier={multiplier}
          timer={timer}
        />
      </div>

      <DesktopGameGrid
        flipDesktopLayout={settings.flipDesktopLayout}
        variant="play"
        mainClassName="lg:px-1 lg:pb-1"
        main={
          <>
            <GameHudSlot
              placement="mobile"
              score={score}
              multiplier={multiplier}
              timer={timer}
            />

            <Card className={layoutClasses.mysteryWordCard}>
              <CardHeader className="shrink-0 border-b bg-muted/50 px-4 py-2.5 text-center lg:px-6 lg:py-4">
                <CardTitle className="text-lg lg:text-xl">mystery word</CardTitle>
              </CardHeader>
              <CardContent className="relative flex min-h-0 flex-1 flex-col justify-center overflow-hidden px-0 pb-2 pt-0 lg:px-6 lg:pb-0 lg:pt-0">
                <MysteryWordDisplay
                  mysteryWord={mysteryWord}
                  definitions={mysteryWord.definitions.join(", ")}
                  showDefinitions={inTagPhase}
                  showRomaji={settings.showRomaji}
                />
                {visibleToast && <MysteryWordToast toast={visibleToast} />}
              </CardContent>
            </Card>

            <form
              onSubmit={handleSubmit}
              id="form"
              className="w-full max-w-full min-w-0 shrink-0 space-y-4 px-0.5"
            >
              {inDefPhase && (
                <>
                  <label htmlFor="definition-input" className="sr-only">
                    English definition
                  </label>
                  <Input
                    ref={defInputRef}
                    id="definition-input"
                    name="d"
                    placeholder="enter definition..."
                    className="w-full max-w-full min-w-0 border-phase-def-border text-lg focus-visible:ring-inset lg:text-xl"
                  />
                </>
              )}

              {inTagPhase && (
                <>
                  <label htmlFor="tag-input" className="sr-only">
                    Japanese tag word
                  </label>
                  <Input
                    ref={tagInputRef}
                    id="tag-input"
                    name="t"
                    placeholder={
                      settings.showRomaji
                        ? "enter tag word (romaji ok)..."
                        : "enter tag word..."
                    }
                    className="w-full max-w-full min-w-0 border-phase-tag-border text-lg focus-visible:ring-inset lg:text-xl"
                  />
                </>
              )}

              <div className="flex w-full min-w-0 gap-2">
                <Button type="submit" size="lg" className="min-w-0 flex-1">
                  submit
                </Button>

                <Button
                  type="button"
                  onClick={() => send({ type: "SKIP" })}
                  className={cn("min-w-0 flex-1", inTagPhase && "hidden")}
                  variant="outline"
                  tabIndex={inTagPhase ? -1 : undefined}
                  aria-hidden={inTagPhase || undefined}
                >
                  skip
                </Button>
              </div>
            </form>

            <LastTagWordCard
              tagWord={tagWord}
              tagDefinitions={tagDefinitions}
              showRomaji={settings.showRomaji}
            />
          </>
        }
        sidebar={
          <DesktopWordHistoryAside flipDesktopLayout={settings.flipDesktopLayout}>
            <WordHistoryPanel
              wordHistory={wordHistory}
              sidebar
              clickable
              showArrow
              onWordClick={handleWordClick}
              className="min-h-[10rem] lg:h-full lg:min-h-0 lg:flex-1"
            />
          </DesktopWordHistoryAside>
        }
      />

      {wordDetailDialog}
    </DesktopGameShell>
  );
}
