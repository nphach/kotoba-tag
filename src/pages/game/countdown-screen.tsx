import { SiteFooter, SiteTitle } from "@/components/site-chrome.tsx";
import { getCountdownLabel } from "@/lib/game-display.ts";
import { layoutClasses } from "@/lib/layout-classes.ts";
import { cn } from "@/lib/utils";

export function CountdownScreen({ countdown }: { countdown: number }) {
  const label = getCountdownLabel(countdown);

  return (
    <main className={layoutClasses.simpleScreenMain}>
      <div className="mx-auto flex w-72 flex-col items-center space-y-6 px-2 md:w-96">
        <SiteTitle />
        <p
          className={cn(
            "font-kosugi font-bold tabular-nums leading-none",
            countdown === 0
              ? "text-6xl text-phase-go"
              : "text-8xl text-phase-def",
          )}
          aria-live="polite"
        >
          {label}
        </p>
        <p className="text-sm text-muted-foreground">get ready...</p>
        <SiteFooter />
      </div>
    </main>
  );
}
