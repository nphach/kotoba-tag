import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { layoutClasses } from "@/lib/layout-classes.ts";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import * as wanakana from "wanakana";

const { toRomaji } = wanakana;

function RomajiReading({ kana }: { kana: string }) {
  if (!kana) return null;

  return (
    <span className="block text-base text-muted-foreground">{toRomaji(kana)}</span>
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

export function MysteryWordDisplay({
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
    <div className="flex h-full min-h-0 flex-1 flex-col px-4 text-center sm:px-6">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1">
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
      {showDefinitions && (
        <div className="mt-1.5 w-full min-h-[2rem] max-h-[4.5rem] shrink-0 lg:mt-2 lg:max-h-[7rem]">
          <FadedOverflowText
            text={definitions}
            className="h-full min-h-0"
            textClassName="text-sm"
          />
        </div>
      )}
    </div>
  );
}

export function LastTagWordCard({
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
    <Card className={layoutClasses.lastTagWordCard}>
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
