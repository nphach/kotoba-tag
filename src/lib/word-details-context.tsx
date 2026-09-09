import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { vocabStore } from "@/lib/data-store.ts";
import type { WordDetails } from "@/lib/types.ts";
import { cn } from "@/lib/utils";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as wanakana from "wanakana";

const { toRomaji } = wanakana;

type WordDetailsContextValue = {
  handleWordClick: (word: string) => void;
  wordDetailDialog: ReactNode;
};

const WordDetailsContext = createContext<WordDetailsContextValue | null>(null);

function WordDetailSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-5 w-20" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
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
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!kana) return;

    const panel = panelRef.current;
    if (!panel) return;

    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || focusable.length === 0) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [kana, onClose]);

  if (!kana) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="close dialog"
        onClick={onClose}
      />
      <Card
        ref={panelRef}
        className="relative z-10 w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="word-detail-title"
        aria-busy={loading}
      >
        <CardHeader className="border-b pb-4">
          <CardTitle id="word-detail-title" className="text-xl">
            word details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {loading && <WordDetailSkeleton />}
          {error && !loading && (
            <p className="text-sm text-destructive">{error}</p>
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

export function WordDetailsProvider({ children }: { children: ReactNode }) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordDetails, setWordDetails] = useState<WordDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const handleCloseDetails = useCallback(() => {
    const trigger = triggerRef.current;
    triggerRef.current = null;
    setSelectedWord(null);
    setWordDetails(null);
    setDetailsError(null);
    queueMicrotask(() => trigger?.focus());
  }, []);

  const handleWordClick = useCallback(async (word: string) => {
    triggerRef.current = document.activeElement as HTMLElement | null;
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
  }, []);

  const value: WordDetailsContextValue = {
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

  return (
    <WordDetailsContext.Provider value={value}>
      {children}
    </WordDetailsContext.Provider>
  );
}

export function useWordDetails(): WordDetailsContextValue {
  const context = useContext(WordDetailsContext);
  if (!context) {
    throw new Error("useWordDetails must be used within WordDetailsProvider");
  }
  return context;
}
