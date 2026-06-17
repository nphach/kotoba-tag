import { isTimerUrgent } from "@/lib/game-display.ts";
import { cn } from "@/lib/utils";

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
        "min-w-0 rounded-lg border bg-card shadow-sm",
        compact ? "px-2 py-2 text-center" : "px-4 py-3 text-left",
        urgent && timerUrgentBoxClass,
      )}
    >
      <p
        className={cn(
          "truncate uppercase tracking-wide text-muted-foreground",
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
  const timerUrgent = isTimerUrgent(timer);

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

type GameHudSlotProps = {
  placement: "mobile" | "tablet" | "desktop";
  score: number;
  multiplier: number;
  timer: number;
};

export function GameHudSlot({
  placement,
  score,
  multiplier,
  timer,
}: GameHudSlotProps) {
  const hudProps = { score, multiplier, timer };

  if (placement === "mobile") {
    return (
      <div className="sm:hidden">
        <GameHud {...hudProps} compact />
      </div>
    );
  }

  if (placement === "tablet") {
    return (
      <div className="hidden sm:block lg:hidden">
        <GameHud {...hudProps} compact />
      </div>
    );
  }

  return (
    <div className="hidden shrink-0 lg:block">
      <GameHud {...hudProps} />
    </div>
  );
}
