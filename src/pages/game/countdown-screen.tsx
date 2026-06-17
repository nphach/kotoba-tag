import { SiteFooter, SiteTitle } from "@/components/site-chrome.tsx";
import { getCountdownLabel } from "@/lib/game-display.ts";
import { cn } from "@/lib/utils";

export function CountdownScreen({ countdown }: { countdown: number }) {
  const label = getCountdownLabel(countdown);

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
