import { useEffect, useState } from "react";
import type { GameToast } from "@/lib/types.ts";
import { cn } from "@/lib/utils";

const TOAST_DURATIONS_MS = {
  error: 3000,
  success: 1500,
  neutral: 1500,
} as const;

export function useGameToast(toast: GameToast | null) {
  const [visibleToast, setVisibleToast] = useState<GameToast | null>(null);

  useEffect(() => {
    if (!toast) return;

    setVisibleToast(toast);
    const duration = TOAST_DURATIONS_MS[toast.variant];
    const timeoutId = window.setTimeout(() => setVisibleToast(null), duration);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  return visibleToast;
}

export function GameToastBanner({
  message,
  variant,
  className,
}: {
  message: string;
  variant: GameToast["variant"];
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border px-3 py-2 text-center text-sm leading-snug",
        variant === "error" &&
          "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-400",
        variant === "success" &&
          "border-green-200 bg-green-50 text-green-800 dark:border-green-400/30 dark:bg-green-500/10 dark:text-green-400",
        variant === "neutral" &&
          "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      {message}
    </div>
  );
}

export function MysteryWordToast({ toast }: { toast: GameToast }) {
  return (
    <div
      role="alert"
      aria-live={toast.variant === "error" ? "assertive" : "polite"}
      className="absolute inset-x-4 bottom-4 z-10 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <GameToastBanner
        message={toast.message}
        variant={toast.variant}
        className="shadow-md"
      />
    </div>
  );
}
