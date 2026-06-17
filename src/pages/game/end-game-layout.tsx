import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DesktopGameGrid,
  DesktopGameShell,
  wordHistoryPanelClass,
} from "@/components/desktop-game-shell.tsx";
import { WordHistoryPanel } from "@/components/word-history-panel.tsx";
import { useWordDetails } from "@/lib/word-details-context.tsx";
import type { WordHistoryEntry } from "@/lib/types.ts";

type EndGameLayoutProps = {
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
  wordHistory: WordHistoryEntry[];
  flipDesktopLayout: boolean;
};

export function EndGameLayout({
  title,
  children,
  actions,
  wordHistory,
  flipDesktopLayout,
}: EndGameLayoutProps) {
  const { handleWordClick, wordDetailDialog } = useWordDetails();

  return (
    <DesktopGameShell variant="end">
      <DesktopGameGrid
        flipDesktopLayout={flipDesktopLayout}
        variant="end"
        main={
          <Card className="flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col overflow-hidden">
            <CardHeader className="shrink-0 border-b bg-muted/50 pb-4">
              <CardTitle className="text-3xl font-kosugi">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col justify-center space-y-4 overflow-hidden pt-6">
              {children}
            </CardContent>
            <div className="flex w-full min-w-0 max-w-full shrink-0 flex-col gap-2 border-t px-6 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
              {actions}
            </div>
          </Card>
        }
        sidebar={
          <WordHistoryPanel
            wordHistory={wordHistory}
            sidebar
            clickable
            showArrow
            onWordClick={handleWordClick}
            className={wordHistoryPanelClass(
              flipDesktopLayout,
              "min-h-[12rem] min-w-0 w-full max-w-full lg:h-full lg:min-h-0 lg:flex-1",
            )}
          />
        }
      />
      {wordDetailDialog}
    </DesktopGameShell>
  );
}
