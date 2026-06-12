import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prefetchModel } from "@/lib/api.ts";
import { machine } from "@/lib/machine.ts";
import { EndReason, Hiragana } from "@/lib/types.ts";
import { cn } from "@/lib/utils";
import { useMachine } from "@xstate/react";
import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { Link } from "react-router-dom";
import * as wanakana from "wanakana";

function WordHistoryPanel({
  wordHistory,
  className,
  sidebar = false,
}: {
  wordHistory: string[];
  className?: string;
  sidebar?: boolean;
}) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          word history
          {wordHistory.length > 0 && (
            <span className="ml-1.5 font-normal text-muted-foreground">
              ({wordHistory.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pt-0">
        {wordHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">no words yet</p>
        ) : sidebar ? (
          <ol className="flex flex-col gap-1.5">
            {wordHistory.map((word, index) => (
              <li
                key={index}
                className="flex items-center gap-3 rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2"
              >
                <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {wordHistory.length - index}
                </span>
                <span className="text-base font-medium">{word}</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="flex flex-wrap gap-2">
            {wordHistory.map((word, index) => (
              <span
                key={index}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium"
              >
                {word}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GameHud({
  score,
  multiplier,
  timer,
  compact = false,
}: {
  score: number;
  multiplier: number;
  timer: number;
  compact?: boolean;
}) {
  const timerUrgent = timer <= 10;

  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border bg-card px-2 py-2 text-center shadow-sm">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            score
          </p>
          <p className="text-lg font-bold tabular-nums leading-tight">
            {score}
          </p>
        </div>
        <div className="rounded-lg border bg-card px-2 py-2 text-center shadow-sm">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            mult
          </p>
          <p className="text-lg font-bold tabular-nums leading-tight">
            {multiplier}x
          </p>
        </div>
        <div
          className={cn(
            "rounded-lg border bg-card px-2 py-2 text-center shadow-sm",
            timerUrgent && "border-red-300 bg-red-50",
          )}
        >
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            time
          </p>
          <p
            className={cn(
              "text-lg font-bold tabular-nums leading-tight",
              timerUrgent && "text-red-600",
            )}
          >
            {timer}s
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-lg border bg-card px-4 py-3 text-left shadow-sm">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          score
        </p>
        <p className="text-2xl font-bold tabular-nums">{score}</p>
      </div>
      <div className="rounded-lg border bg-card px-4 py-3 text-left shadow-sm">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          multiplier
        </p>
        <p className="text-2xl font-bold tabular-nums">{multiplier}x</p>
      </div>
      <div
        className={cn(
          "rounded-lg border bg-card px-4 py-3 text-left shadow-sm",
          timerUrgent && "border-red-300 bg-red-50",
        )}
      >
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          timer
        </p>
        <p
          className={cn(
            "text-2xl font-bold tabular-nums",
            timerUrgent && "text-red-600",
          )}
        >
          {timer}s
        </p>
      </div>
    </div>
  );
}

function getEndGameMessage(endReason: EndReason, errorMessage: string) {
  if (endReason === "timeout") {
    return "time ran out!";
  }
  if (endReason === "error") {
    return errorMessage || "something went wrong while loading the next word.";
  }
  return "time ran out!";
}

function countWordsPlayed(
  wordsPlayed: number | undefined,
  wordHistory: string[],
) {
  const played = wordsPlayed ?? 0;
  if (played > 0) return played;
  if (wordHistory.length === 0) return 0;
  return Math.floor((wordHistory.length + 1) / 2);
}

function getRoundSummary(
  wordsPlayed: number | undefined,
  correctDefinitions: number | undefined,
) {
  const played = wordsPlayed ?? 0;
  const definitions = correctDefinitions ?? 0;
  const wordLabel = played === 1 ? "word" : "words";
  const definitionLabel = definitions === 1 ? "definition" : "definitions";
  return `you played ${played} ${wordLabel} this round and guessed ${definitions} correct ${definitionLabel}.`;
}

function EndGameActions({
  onRestart,
  onReturnHome,
}: {
  onRestart: () => void;
  onReturnHome: () => void;
}) {
  return (
    <>
      <Button onClick={onRestart}>restart!</Button>
      <Button variant="outline" asChild>
        <Link to="/" onClick={onReturnHome}>
          home
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link to="/rules">view rules</Link>
      </Button>
    </>
  );
}

function EndGameLayout({
  title,
  children,
  actions,
  wordHistory,
}: {
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
  wordHistory: string[];
}) {
  return (
    <main className="flex min-h-[calc(100dvh-4rem)] w-full items-center justify-center overflow-y-auto px-2 py-6 sm:px-4 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 xl:max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)] lg:items-start">
          <div className="flex flex-col gap-5 text-left">
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-slate-50/80 pb-4">
                <CardTitle className="text-3xl font-kosugi">{title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">{children}</CardContent>
            </Card>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
              {actions}
            </div>
          </div>

          <WordHistoryPanel
            wordHistory={wordHistory}
            sidebar
            className="min-h-[12rem] lg:sticky lg:top-6 lg:min-h-[20rem] lg:max-h-[calc(100dvh-8rem)] lg:self-start"
          />
        </div>

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

function GamePage() {
  const [state, send] = useMachine(machine);
  const defInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const {
    mysteryWord,
    score,
    multiplier,
    timer,
    wordHistory,
    tagWord,
    tagDefinitions,
    errorMessage,
    wordsPlayed,
    correctDefinitions,
    endReason,
  } = state.context;

  const inDefPhase = state.matches({ playRound: { presentMystery: "part1" } });
  const inTagPhase = state.matches({ playRound: { presentMystery: "part2" } });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    flushSync(() => {
      send({
        type: "SUBMIT",
        definition: inDefPhase ? formData.get("d") : undefined,
        tagWord: inTagPhase ? (formData.get("t") as Hiragana) : undefined,
      });
    });
  };

  const handleReturnHome = () => {
    send({ type: "RETURN_HOME" });
  };

  useEffect(() => {
    prefetchModel();
  }, []);

  useEffect(() => {
    if (inTagPhase && tagInputRef.current) {
      const input = tagInputRef.current;
      wanakana.bind(input);
      return () => wanakana.unbind(input);
    }
  }, [inTagPhase]);

  useEffect(() => {
    if (inDefPhase) {
      defInputRef.current?.focus();
    } else if (inTagPhase) {
      tagInputRef.current?.focus();
    }
  }, [inDefPhase, inTagPhase]);

  if (state.matches("idle")) {
    return (
      <div className="mx-auto flex w-72 flex-col space-y-6 px-2 md:w-96">
        <div className="space-y-2 text-center">
          <p className="text-4xl font-kosugi">Kotoba Tag!</p>
          <p className="text-sm text-gray-600">
            <i>shiritori</i> for Japanese vocabulary practice
          </p>
        </div>
        <Button onClick={() => send({ type: "START" })}>start!</Button>
        <Button variant="outline" asChild>
          <Link to="/rules">view rules</Link>
        </Button>
        {errorMessage && (
          <p className="text-center text-xs font-bold text-red-500">
            {errorMessage}
          </p>
        )}
        <a
          href="https://nphach.github.io"
          className="block text-center text-xs font-kosugi font-bold"
        >
          made by nphach
        </a>
      </div>
    );
  }

  if (state.matches("prepareGame")) {
    return (
      <div className="mx-auto flex w-72 flex-col space-y-6 px-2 md:w-96">
        <p className="text-4xl font-kosugi">Kotoba Tag!</p>
        <p className="text-sm text-gray-600">preparing game...</p>
        <a
          href="https://nphach.github.io"
          className="block text-center text-xs font-kosugi font-bold"
        >
          made by nphach
        </a>
      </div>
    );
  }

  if (state.matches("complete")) {
    return (
      <EndGameLayout
        title="nice!"
        wordHistory={wordHistory}
        actions={
          <EndGameActions
            onRestart={() => send({ type: "RESTART" })}
            onReturnHome={handleReturnHome}
          />
        }
      >
        <div className="space-y-4 text-sm text-balance">
          <p>there are no more tag words in the word bank.</p>
          <p className="font-kosugi">日本語が上手ですね ww</p>
        </div>
        <p className="text-4xl font-bold tabular-nums">final score: {score}</p>
        <p className="text-sm text-muted-foreground">
          {getRoundSummary(
            countWordsPlayed(wordsPlayed, wordHistory),
            correctDefinitions,
          )}
        </p>
      </EndGameLayout>
    );
  }

  if (state.matches("endGame")) {
    return (
      <EndGameLayout
        title="game over!"
        wordHistory={wordHistory}
        actions={
          <EndGameActions
            onRestart={() => send({ type: "RESTART" })}
            onReturnHome={handleReturnHome}
          />
        }
      >
        <p className="text-muted-foreground">
          {getEndGameMessage(endReason, errorMessage)}
        </p>
        <p className="text-4xl font-bold tabular-nums">final score: {score}</p>
        <p className="text-sm text-muted-foreground">
          {getRoundSummary(
            countWordsPlayed(wordsPlayed, wordHistory),
            correctDefinitions,
          )}
        </p>
      </EndGameLayout>
    );
  }

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] w-full flex-col overflow-y-auto px-2 py-4 sm:px-4 sm:py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 text-left lg:gap-6 xl:max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-4xl font-kosugi">Kotoba Tag!</p>
            <p
              className={cn(
                "text-sm font-medium",
                inDefPhase ? "text-purple-600" : "text-blue-600",
              )}
            >
              {inDefPhase
                ? "phase 1 — enter the English definition"
                : "phase 2 — enter a Japanese tag word"}
            </p>
          </div>
          <div className="hidden sm:block lg:hidden">
            <GameHud
              score={score}
              multiplier={multiplier}
              timer={timer}
              compact
            />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:gap-6">
          <div className="flex flex-col gap-5">
            <div className="sm:hidden">
              <GameHud
                score={score}
                multiplier={multiplier}
                timer={timer}
                compact
              />
            </div>

            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-slate-50/80 pb-4 text-center">
                <CardTitle>mystery word</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-6 text-center">
                {mysteryWord.kanji && (
                  <span className="block text-5xl font-extrabold leading-none lg:text-6xl">
                    {mysteryWord.kanji}
                  </span>
                )}
                {mysteryWord.kanji ? (
                  <span className="block text-2xl font-bold text-muted-foreground">
                    {mysteryWord.kana}
                  </span>
                ) : (
                  <span className="block text-5xl font-extrabold leading-none lg:text-6xl">
                    {mysteryWord.kana}
                  </span>
                )}
                {inTagPhase && (
                  <p className="text-sm text-muted-foreground">
                    {mysteryWord.definitions.join(", ")}
                  </p>
                )}
              </CardContent>
            </Card>

            {errorMessage && (
              <p className="text-center text-xs font-bold text-red-500">
                {errorMessage}
              </p>
            )}

            <form onSubmit={handleSubmit} id="form" className="space-y-4">
              {inDefPhase && (
                <Input
                  ref={defInputRef}
                  name="d"
                  placeholder="enter definition..."
                  className="border-purple-500 text-lg lg:text-xl"
                />
              )}

              {inTagPhase && (
                <Input
                  ref={tagInputRef}
                  name="t"
                  placeholder="enter tag word..."
                  className="border-blue-500 text-lg lg:text-xl"
                />
              )}

              <div className="flex gap-2">
                <Button type="submit" className="w-full">
                  submit
                </Button>

                {inDefPhase && (
                  <Button
                    type="button"
                    onClick={() => send({ type: "SKIP" })}
                    className="w-full"
                    variant="outline"
                  >
                    skip
                  </Button>
                )}
              </div>
            </form>

            {tagWord && (
              <Card>
                <CardHeader className="pb-3 text-center">
                  <CardTitle className="text-base">last tag word</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 pt-0 text-center">
                  <span className="text-2xl font-bold">{tagWord}</span>
                  <p className="text-sm text-muted-foreground">
                    {tagDefinitions.join(", ")}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <aside className="flex min-h-0 flex-col gap-5 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-6rem)] lg:self-start">
            <div className="hidden shrink-0 lg:block">
              <GameHud score={score} multiplier={multiplier} timer={timer} />
            </div>

            <WordHistoryPanel
              wordHistory={wordHistory}
              sidebar
              className="min-h-[10rem] lg:min-h-0 lg:flex-1"
            />
          </aside>
        </div>

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

export default GamePage;
