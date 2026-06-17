import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDefinitionPreview } from "@/lib/game-display.ts";
import type { WordHistoryEntry } from "@/lib/types.ts";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

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

export function WordHistoryPanel({
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
    <Card
      className={cn(
        "flex max-h-[14rem] min-h-0 min-w-0 w-full max-w-full flex-col overflow-hidden sm:max-h-[16rem] lg:max-h-none",
        className,
      )}
    >
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
