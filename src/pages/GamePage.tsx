import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SiteBranding, SiteFooter, SiteTitle } from "@/components/site-chrome.tsx";
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
        className={cn("w-full min-w-0 max-w-full", itemClassName)}
      >
        {content}
      </button>
    );
  }

  return <div className={cn("w-full min-w-0 max-w-full", itemClassName)}>{content}</div>;
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
    <Card className={cn("flex max-h-[14rem] min-h-0 min-w-0 w-full max-w-full flex-col overflow-hidden sm:max-h-[16rem] lg:max-h-none", className)}>
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
      <CardContent className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto pt-0">
        {wordHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">no words yet</p>
        ) : sidebar ? (
          <ol className="flex min-w-0 flex-col gap-1.5">
            {wordHistory.map((entry, index) => (
              <li key={index} className="min-w-0">
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

function HudStat({
  label,
  value,
  compact,
  urgent = false,
}: {
  label: string;
  value: string;
  compact: boolean;
  urgent?: boolean;
}) {
  const timerUrgentBoxClass =
    "border-red-300 bg-red-50 dark:border-red-400/30 dark:bg-red-500/10";
  const timerUrgentTextClass = "text-red-600 dark:text-red-400";

  return (
    <div
      className={cn(
        "rounded-lg border bg-card shadow-sm",
        compact ? "px-2 py-2 text-center" : "px-4 py-3 text-left",
        urgent && timerUrgentBoxClass,
      )}
    >
      <p
        className={cn(
          "uppercase tracking-wide text-muted-foreground",
          compact ? "text-[10px]" : "text-xs",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "font-bold tabular-nums",
          compact ? "text-lg leading-tight" : "text-2xl",
          urgent && timerUrgentTextClass,
        )}
      >
        {value}
      </p>
    </div>
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

  return (
    <div className={cn("grid grid-cols-3", compact ? "gap-2" : "gap-3")}>
      <HudStat label="score" value={String(score)} compact={compact} />
      <HudStat
        label={compact ? "mult" : "multiplier"}
        value={`${multiplier}x`}
        compact={compact}
      />
      <HudStat
        label={compact ? "time" : "timer"}
        value={`${timer}s`}
        compact={compact}
        urgent={timerUrgent}
      />
    </div>
  );
}

function FadedOverflowText({
  text,
  className,
  textClassName,
}: {
  text: string;
  className?: string;
  textClassName?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [atBottom, setAtBottom] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () => {
      const hasOverflow = node.scrollHeight > node.clientHeight + 1;
      setOverflowing(hasOverflow);
      setAtBottom(
        node.scrollHeight - node.scrollTop <= node.clientHeight + 1,
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    node.addEventListener("scroll", update, { passive: true });

    return () => {
      observer.disconnect();
      node.removeEventListener("scroll", update);
    };
  }, [text]);

  return (
    <div className={cn("relative min-h-0 overflow-hidden", className)}>
      <p
        ref={ref}
        className={cn(
          "h-full break-words leading-snug text-muted-foreground",
          textClassName ?? "text-xs",
          overflowing ? "overflow-y-auto pr-0.5" : "overflow-hidden",
        )}
      >
        {text}
      </p>
      {overflowing && !atBottom && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-card via-card/80 to-transparent"
        />
      )}
    </div>
  );
}

function LastTagWordCard({
  tagWord,
  tagDefinitions,
  showRomaji,
}: {
  tagWord: string | null | undefined;
  tagDefinitions: string[];
  showRomaji: boolean;
}) {
  const hasTagWord = Boolean(tagWord);
  const definitions = hasTagWord ? tagDefinitions.join(", ") : null;

  return (
    <Card className="flex h-36 w-full min-w-0 max-w-full shrink-0 flex-col overflow-hidden">
      <CardHeader className="shrink-0 border-b bg-muted/50 py-2.5 text-center">
        <CardTitle className="text-sm">last tag word</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-6 pb-3 pt-2 text-center">
        <div className="flex h-7 shrink-0 items-center justify-center text-xl font-bold leading-none">
          {hasTagWord ? (
            tagWord
          ) : (
            <span className="text-base font-normal text-muted-foreground/60">
              none yet
            </span>
          )}
        </div>
        {showRomaji && (
          <div className="flex h-5 shrink-0 items-center justify-center">
            {hasTagWord ? (
              <RomajiReading kana={tagWord as string} />
            ) : (
              <span className="text-base text-muted-foreground/40" aria-hidden>
                {"\u00a0"}
              </span>
            )}
          </div>
        )}
        <div className="mt-1 min-h-0 flex-1 border-t border-border/60 pt-1.5">
          {definitions ? (
            <FadedOverflowText text={definitions} className="h-full" />
          ) : (
            <div className="flex h-full items-center justify-center px-1">
              <p className="text-xs leading-snug text-muted-foreground/60">
                definition will appear here
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorBanner({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm leading-snug text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-400",
        className,
      )}
    >
      {message}
    </div>
  );
}

function MysteryWordErrorToast({ message }: { message: string }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="absolute inset-x-4 bottom-4 z-10 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <ErrorBanner message={message} className="shadow-md" />
    </div>
  );
}

function MysteryWordDisplay({
  mysteryWord,
  definitions,
  showDefinitions,
  showRomaji,
}: {
  mysteryWord: { kanji?: string | null; kana: string };
  definitions: string;
  showDefinitions: boolean;
  showRomaji: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center px-4 text-center sm:px-6">
      <div className="flex w-full flex-col items-center gap-1">
        <div className="flex h-12 w-full items-center justify-center sm:h-14 lg:h-[4.5rem]">
          {mysteryWord.kanji ? (
            <span className="text-4xl font-extrabold leading-none sm:text-5xl lg:text-6xl">
              {mysteryWord.kanji}
            </span>
          ) : (
            <span className="text-4xl font-extrabold leading-none sm:text-5xl lg:text-6xl">
              {mysteryWord.kana}
            </span>
          )}
        </div>
        <div
          className={cn(
            "flex h-7 w-full items-center justify-center lg:h-8",
            !mysteryWord.kanji && "hidden",
          )}
        >
          <span className="text-xl font-bold text-muted-foreground lg:text-2xl">
            {mysteryWord.kana}
          </span>
        </div>
        <div
          className={cn(
            "flex h-5 w-full items-center justify-center",
            !showRomaji && "hidden",
          )}
        >
          <RomajiReading kana={mysteryWord.kana} />
        </div>
      </div>
      <div
        className={cn(
          "mt-1.5 w-full min-h-[2rem] max-h-[4.5rem] lg:mt-2 lg:max-h-[7rem]",
          !showDefinitions && "invisible",
        )}
      >
        <FadedOverflowText
          text={showDefinitions ? definitions : "\u00a0"}
          className="h-full min-h-0"
          textClassName="text-sm"
        />
      </div>
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
      <SiteTitle />
      <div
        className="size-10 animate-spin rounded-full border-4 border-muted border-t-purple-600"
        role="status"
        aria-label="loading"
      />
      <p className="text-center text-sm text-muted-foreground">{message}</p>
      <SiteFooter />
    </div>
  );
}

function CountdownScreen({ countdown }: { countdown: number }) {
  const label = countdown === 0 ? "go!" : String(countdown);

  return (
    <div className="mx-auto flex w-72 flex-col items-center space-y-6 px-2 md:w-96">
      <SiteTitle />
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
      <SiteFooter />
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
    <main className="flex min-h-[calc(100dvh-4rem)] w-full min-w-0 max-w-full flex-col overflow-x-hidden overflow-y-auto px-2 py-6 sm:px-4 lg:h-[calc(100dvh-2rem)] lg:min-h-0 lg:overflow-y-auto lg:px-8">
      <div className="mx-auto flex w-full min-h-0 min-w-0 max-w-5xl flex-1 flex-col gap-6 xl:max-w-6xl">
        <div className="grid min-h-0 min-w-0 max-w-full flex-1 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)] lg:items-stretch">
          <div className="flex h-full min-h-0 min-w-0 w-full max-w-full flex-col gap-5 overflow-hidden text-left">
            <Card className="flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col overflow-hidden">
              <CardHeader className="shrink-0 border-b bg-muted/50 pb-4">
                <CardTitle className="text-3xl font-kosugi">{title}</CardTitle>
              </CardHeader>
              <CardContent className="flex min-w-0 flex-1 flex-col justify-center space-y-4 overflow-hidden pt-6">
                {children}
              </CardContent>
            </Card>
            <div className="flex w-full min-w-0 max-w-full shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
              {actions}
            </div>
          </div>

          <WordHistoryPanel
            wordHistory={wordHistory}
            sidebar
            clickable
            showArrow
            onWordClick={handleWordClick}
            className="min-h-[12rem] min-w-0 w-full max-w-full lg:h-full lg:min-h-0"
          />
        </div>

        <SiteFooter className="shrink-0" />
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
  const [errorToast, setErrorToast] = useState<string | null>(null);

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

  useEffect(() => {
    if (!errorMessage) {
      setErrorToast(null);
      return;
    }

    setErrorToast(errorMessage);
    const timeoutId = window.setTimeout(() => setErrorToast(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [errorMessage]);

  if (state.matches("idle")) {
    return (
      <div className="mx-auto flex w-72 flex-col space-y-6 px-2 md:w-96">
        <SiteBranding className="text-center" />
        <Button onClick={() => send({ type: "START" })}>start!</Button>
        <Button variant="outline" asChild>
          <Link to="/rules">rules</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/settings">settings</Link>
        </Button>
        {errorMessage && <ErrorBanner message={errorMessage} />}
        <SiteFooter />
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
    <main className="flex min-h-[calc(100dvh-4rem)] w-full min-w-0 max-w-full flex-col overflow-x-hidden overflow-y-auto px-2 py-4 sm:px-4 sm:py-6 lg:h-[calc(100dvh-2rem)] lg:min-h-0 lg:overflow-y-auto lg:px-8">
      <div className="mx-auto flex w-full min-h-0 min-w-0 max-w-5xl flex-1 flex-col gap-5 text-left lg:gap-6 xl:max-w-6xl">
        <div className="shrink-0 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <SiteTitle />
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

        <div className="grid min-h-0 min-w-0 max-w-full flex-1 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-stretch lg:gap-6">
          <div className="flex h-full min-h-0 min-w-0 w-full max-w-full flex-col gap-5 overflow-hidden lg:px-1 lg:pb-1">
            <div className="sm:hidden">
              <GameHud
                score={score}
                multiplier={multiplier}
                timer={timer}
                compact
              />
            </div>

            <Card className="flex h-[14rem] w-full min-w-0 max-w-full flex-col overflow-hidden sm:h-[15rem] lg:h-auto lg:min-h-0 lg:flex-1">
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
                {errorToast && <MysteryWordErrorToast message={errorToast} />}
              </CardContent>
            </Card>

            <form
              onSubmit={handleSubmit}
              id="form"
              className="w-full max-w-full min-w-0 shrink-0 space-y-4 px-0.5"
            >
              {inDefPhase && (
                <Input
                  ref={defInputRef}
                  name="d"
                  placeholder="enter definition..."
                  className="w-full max-w-full min-w-0 border-purple-500 text-lg focus-visible:ring-inset lg:text-xl"
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
                  className="w-full max-w-full min-w-0 border-blue-500 text-lg focus-visible:ring-inset lg:text-xl"
                />
              )}

              <div className="flex w-full min-w-0 gap-2">
                <Button type="submit" className="min-w-0 flex-1">
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
          </div>

          <aside className="flex h-full min-h-0 min-w-0 w-full max-w-full flex-col gap-5 overflow-hidden">
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

        <SiteFooter className="shrink-0" />
      </div>

      {wordDetailDialog}
    </main>
  );
}

export default GamePage;
