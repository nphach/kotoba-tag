import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { vocabStore } from "@/lib/data-store.ts";
import type { WordDetails } from "@/lib/types.ts";
import { cn } from "@/lib/utils";
import {
  createContext,
  useCallback,
  useContext,
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

export function WordDetailsProvider({ children }: { children: ReactNode }) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordDetails, setWordDetails] = useState<WordDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const handleCloseDetails = useCallback(() => {
    setSelectedWord(null);
    setWordDetails(null);
    setDetailsError(null);
  }, []);

  const handleWordClick = useCallback(async (word: string) => {
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
