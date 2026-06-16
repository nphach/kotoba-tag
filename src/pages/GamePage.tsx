import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prefetchModel } from "@/lib/api.ts";
import { vocabStore } from "@/lib/data-store.ts";
import { machine } from "@/lib/machine.ts";
import { useSettings } from "@/lib/settings-context.tsx";
import { EndReason, Hiragana, WordDetails, WordHistoryEntry } from "@/lib/types.ts";
import { cn } from "@/lib/utils";
import { useMachine } from "@xstate/react";
import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Link } from "react-router-dom";
import * as wanakana from "wanakana";

const { toHiragana, toRomaji } = wanakana;

function RomajiReading({ kana }: { kana: string }) {
  if (!kana) return null;

  return (
    <span className="block text-base text-muted-foreground">{toRomaji(kana)}</span>
  );
}

function formatDefinitionPreview(definitions: string[]) {
  return definitions.join(", ");
}

function FadedDefinition({ text }: { text: string }) {
  if (!text) return null;

  return (
    <span className="relative min-w-0 flex-1 overflow-hidden">
      <span className="block whitespace-nowrap pr-6 text-sm text-muted-foreground">
        {text}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-muted/60 to-transparent group-hover:from-muted"
      />
    </span>
  );
}

function WordHistoryRow({
  index,
  entry,
  clickable = false,
  showArrow = false,
  onWordClick,
}: {
  index: number;
  entry: WordHistoryEntry;
  clickable?: boolean;
  showArrow?: boolean;
  onWordClick?: (word: string) => void;
}) {
  const definitionPreview = formatDefinitionPreview(entry.definitions);
  const itemClassName = cn(
    "group flex min-w-0 items-center gap-2 rounded-md border border-border bg-muted/60 px-3 py-2 text-left",
    clickable &&
      "cursor-pointer transition-colors hover:border-purple-300 hover:bg-muted",
  );
  const content = (
    <>
      <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {index}
      </span>
      <span className="shrink-0 text-base font-medium">{entry.kana}</span>
      <FadedDefinition text={definitionPreview} />
      {showArrow && (
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      )}
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        onClick={() => onWordClick?.(entry.kana)}
        className={cn("w-full", itemClassName)}
      >
        {content}
      </button>
    );
  }

  return <div className={itemClassName}>{content}</div>;
}

function WordHistoryPanel({
  wordHistory,
  className,
  sidebar = false,
  clickable = false,
  showArrow = false,
  onWordClick,
}: {
  wordHistory: WordHistoryEntry[];
  className?: string;
  sidebar?: boolean;
  clickable?: boolean;
  showArrow?: boolean;
  onWordClick?: (word: string) => void;
}) {
  return (
    <Card className={cn("flex min-h-0 flex-col", className)}>
      <CardHeader className="shrink-0 pb-3">
        <CardTitle className="text-base">
          word history
          {wordHistory.length > 0 && (
            <span className="ml-1.5 font-normal text-muted-foreground">
              ({wordHistory.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto pt-0">
        {wordHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">no words yet</p>
        ) : sidebar ? (
          <ol className="flex flex-col gap-1.5">
            {wordHistory.map((entry, index) => (
              <li key={index}>
                <WordHistoryRow
                  index={wordHistory.length - index}
                  entry={entry}
                  clickable={clickable}
                  showArrow={showArrow}
                  onWordClick={onWordClick}
                />
              </li>
            ))}
          </ol>
        ) : (
          <div className="flex flex-wrap gap-2">
            {wordHistory.map((entry, index) => (
              <span
                key={index}
                className="rounded-full bg-muted px-3 py-1 text-sm font-medium"
              >
                {entry.kana}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WordDetailDialog({
  kana,
  details,
  loading,
  error,
  onClose,
}: {
  kana: string | null;
  details: WordDetails | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  if (!kana) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="word-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="close"
        onClick={onClose}
      />
      <Card className="relative z-10 w-full max-w-md">
        <CardHeader className="border-b pb-4">
          <CardTitle id="word-detail-title" className="text-xl">
            word details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {loading && (
            <p className="text-sm text-muted-foreground">loading...</p>
          )}
          {error && !loading && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          {details && !loading && (
            <>
              {details.kanji ? (
                <p className="text-4xl font-extrabold leading-none">
                  {details.kanji}
                </p>
              ) : null}
              <p
                className={cn(
                  "font-bold",
                  details.kanji
                    ? "text-2xl text-muted-foreground"
                    : "text-4xl leading-none",
                )}
              >
                {details.kana}
              </p>
              <p className="text-base text-muted-foreground">
                {toRomaji(details.kana)}
              </p>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  definitions
                </p>
                <p className="text-sm">{details.definitions.join(", ")}</p>
              </div>
            </>
          )}
          <Button variant="outline" className="w-full" onClick={onClose}>
            close
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function useWordDetailsDialog() {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordDetails, setWordDetails] = useState<WordDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const handleWordClick = async (word: string) => {
    setSelectedWord(word);
    setWordDetails(null);
    setDetailsError(null);
    setDetailsLoading(true);

    try {
      const details = await vocabStore.lookupWordDetails(word);
      setWordDetails(details);
    } catch (err) {
      setDetailsError(
        err instanceof Error ? err.message : "couldn't load word details",
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedWord(null);
    setWordDetails(null);
    setDetailsError(null);
  };

  return {
    handleWordClick,
    wordDetailDialog: (
      <WordDetailDialog
        kana={selectedWord}
        details={wordDetails}
        loading={detailsLoading}
        error={detailsError}
        onClose={handleCloseDetails}
      />
    ),
  };
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
  const timerUrgentBoxClass =
    "border-red-300 bg-red-50 dark:border-red-400/30 dark:bg-red-500/10";
  const timerUrgentTextClass = "text-red-600 dark:text-red-400";

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
            timerUrgent && timerUrgentBoxClass,
          )}
        >
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            time
          </p>
          <p
            className={cn(
              "text-lg font-bold tabular-nums leading-tight",
              timerUrgent && timerUrgentTextClass,
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
          timerUrgent && timerUrgentBoxClass,
        )}
      >
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          timer
        </p>
        <p
          className={cn(
            "text-2xl font-bold tabular-nums",
            timerUrgent && timerUrgentTextClass,
          )}
        >
          {timer}s
        </p>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-center text-sm text-red-700"
    >
      {message}
    </div>
  );
}

function getEndGameMessage(endReason: EndReason, errorMessage: string) {
  if (endReason === "timeout") {
    return "time ran out!";
  }
  if (endReason === "error") {
    return errorMessage || "something went wrong — please try again";
  }
  return "game over!";
}

function countWordsPlayed(
  wordsPlayed: number | undefined,
  wordHistory: WordHistoryEntry[],
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
        <Link to="/rules">rules</Link>
      </Button>
    </>
  );
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="mx-auto flex w-72 flex-col items-center space-y-6 px-2 md:w-96">
      <p className="text-4xl font-kosugi">Kotoba Tag!</p>
      <div
        className="size-10 animate-spin rounded-full border-4 border-muted border-t-purple-600"
        role="status"
        aria-label="loading"
      />
      <p className="text-center text-sm text-muted-foreground">{message}</p>
      <a
        href="https://nphach.github.io"
        className="block text-center text-xs font-kosugi font-bold"
      >
        made by nphach
      </a>
    </div>
  );
}

function CountdownScreen({ countdown }: { countdown: number }) {
  const label = countdown === 0 ? "go!" : String(countdown);

  return (
    <div className="mx-auto flex w-72 flex-col items-center space-y-6 px-2 md:w-96">
      <p className="text-4xl font-kosugi">Kotoba Tag!</p>
      <p
        className={cn(
          "font-kosugi font-bold tabular-nums leading-none",
          countdown === 0
            ? "text-6xl text-green-600"
            : "text-8xl text-purple-600",
        )}
        aria-live="polite"
      >
        {label}
      </p>
      <p className="text-sm text-muted-foreground">get ready...</p>
      <a
        href="https://nphach.github.io"
        className="block text-center text-xs font-kosugi font-bold"
      >
        made by nphach
      </a>
    </div>
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
  wordHistory: WordHistoryEntry[];
}) {
  const { handleWordClick, wordDetailDialog } = useWordDetailsDialog();

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] w-full overflow-y-auto px-2 py-6 sm:px-4 lg:h-[calc(100dvh-2rem)] lg:min-h-0 lg:overflow-hidden lg:px-8">
      <div className="mx-auto flex w-full min-h-0 max-w-5xl flex-1 flex-col gap-6 xl:max-w-6xl">
        <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)] lg:items-stretch">
          <div className="flex h-full min-h-0 flex-col gap-5 text-left">
            <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <CardHeader className="shrink-0 border-b bg-muted/50 pb-4">
                <CardTitle className="text-3xl font-kosugi">{title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-center space-y-4 pt-6">
                {children}
              </CardContent>
            </Card>
            <div className="flex shrink-0 flex-row flex-wrap items-center justify-center gap-2">
              {actions}
            </div>
          </div>

          <WordHistoryPanel
            wordHistory={wordHistory}
            sidebar
            clickable
            showArrow
            onWordClick={handleWordClick}
            className="min-h-[12rem] lg:h-full lg:min-h-0"
          />
        </div>

        <a
          href="https://nphach.github.io"
          className="block shrink-0 text-center text-xs font-kosugi font-bold"
        >
          made by nphach
        </a>
      </div>

      {wordDetailDialog}
    </main>
  );
}

function GamePage() {
  const [state, send] = useMachine(machine);
  const { settings } = useSettings();
  const { handleWordClick, wordDetailDialog } = useWordDetailsDialog();
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
    countdown,
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
          ? (settings.showRomaji
              ? toHiragana(rawTag)
              : rawTag) as Hiragana
          : undefined,
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

  if (state.matches("idle")) {
    return (
      <div className="mx-auto flex w-72 flex-col space-y-6 px-2 md:w-96">
        <div className="space-y-2 text-center">
          <p className="text-4xl font-kosugi">Kotoba Tag!</p>
          <p className="text-sm text-muted-foreground">
            <i>shiritori</i> for Japanese vocabulary practice
          </p>
        </div>
        <Button onClick={() => send({ type: "START" })}>start!</Button>
        <Button variant="outline" asChild>
          <Link to="/rules">rules</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/settings">settings</Link>
        </Button>
        {errorMessage && <ErrorBanner message={errorMessage} />}
        <a
          href="https://nphach.github.io"
          className="block text-center text-xs font-kosugi font-bold"
        >
          made by nphach
        </a>
      </div>
    );
  }

  if (state.matches({ prepareGame: "warmingUp" })) {
    return <LoadingScreen message="warming up model..." />;
  }

  if (state.matches({ prepareGame: "countdown" })) {
    return <CountdownScreen countdown={countdown} />;
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
    <main className="flex min-h-[calc(100dvh-4rem)] w-full flex-col overflow-y-auto px-2 py-4 sm:px-4 sm:py-6 lg:h-[calc(100dvh-2rem)] lg:min-h-0 lg:overflow-hidden lg:px-8">
      <div className="mx-auto flex w-full min-h-0 max-w-5xl flex-1 flex-col gap-5 text-left lg:gap-6 xl:max-w-6xl">
        <div className="shrink-0 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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

        <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-stretch lg:gap-6">
          <div className="flex h-full min-h-0 flex-col gap-5 lg:overflow-y-auto">
            <div className="sm:hidden">
              <GameHud
                score={score}
                multiplier={multiplier}
                timer={timer}
                compact
              />
            </div>

            <Card className="shrink-0">
              <CardHeader className="border-b bg-muted/50 pb-4 text-center">
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
                {settings.showRomaji && (
                  <RomajiReading kana={mysteryWord.kana} />
                )}
                {inTagPhase && (
                  <p className="text-sm text-muted-foreground">
                    {mysteryWord.definitions.join(", ")}
                  </p>
                )}
              </CardContent>
            </Card>

            {errorMessage && <ErrorBanner message={errorMessage} />}

            <form onSubmit={handleSubmit} id="form" className="shrink-0 space-y-4">
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
                  placeholder={
                    settings.showRomaji
                      ? "enter tag word (romaji ok)..."
                      : "enter tag word..."
                  }
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
              <Card className="shrink-0">
                <CardHeader className="pb-3 text-center">
                  <CardTitle className="text-base">last tag word</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 pt-0 text-center">
                  <span className="text-2xl font-bold">{tagWord}</span>
                  {settings.showRomaji && <RomajiReading kana={tagWord} />}
                  <p className="max-h-24 overflow-y-auto text-sm text-muted-foreground">
                    {tagDefinitions.join(", ")}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <aside className="flex h-full min-h-0 flex-col gap-5">
            <div className="hidden shrink-0 lg:block">
              <GameHud score={score} multiplier={multiplier} timer={timer} />
            </div>

            <WordHistoryPanel
              wordHistory={wordHistory}
              sidebar
              clickable
              showArrow
              onWordClick={handleWordClick}
              className="min-h-[10rem] lg:min-h-0 lg:flex-1"
            />
          </aside>
        </div>

        <a
          href="https://nphach.github.io"
          className="block shrink-0 text-center text-xs font-kosugi font-bold"
        >
          made by nphach
        </a>
      </div>

      {wordDetailDialog}
    </main>
  );
}

export default GamePage;
