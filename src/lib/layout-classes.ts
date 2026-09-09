export const layoutClasses = {
  simpleScreenMain:
    "flex min-h-[calc(100dvh-4rem)] w-full items-center justify-center overflow-y-auto py-4 sm:px-4 sm:py-6 lg:px-8",
  gameMain:
    "w-full min-w-0 max-w-full overflow-x-hidden px-2 py-4 pb-10 sm:px-4 sm:py-6 sm:pb-12 lg:px-8",
  gameMainEnd:
    "w-full min-w-0 max-w-full overflow-x-hidden px-2 py-6 pb-10 sm:px-4 sm:pb-12 lg:px-8",
  gameContainer:
    "mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-5 text-left lg:gap-6 xl:max-w-6xl",
  gameContainerEnd:
    "mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-6 xl:max-w-6xl",
  mysteryWordCard:
    "flex min-h-[14rem] w-full min-w-0 max-w-full flex-col overflow-hidden sm:min-h-[15rem] lg:min-h-[14rem]",
  lastTagWordCard:
    "flex min-h-40 w-full min-w-0 max-w-full flex-col overflow-hidden sm:min-h-44 lg:min-h-48",
} as const;

export type DesktopGridVariant = "play" | "end";

export function desktopGridClass(
  flipDesktopLayout: boolean,
  variant: DesktopGridVariant,
  extra?: string,
) {
  const playCols = flipDesktopLayout
    ? "lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]"
    : "lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]";
  const endCols = flipDesktopLayout
    ? "lg:grid-cols-[minmax(18rem,0.95fr)_minmax(0,1.05fr)]"
    : "lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)]";

  const base =
    variant === "play"
      ? "grid w-full min-w-0 max-w-full gap-5 lg:items-start lg:gap-6"
      : "grid w-full min-w-0 max-w-full gap-6 lg:items-start";

  return [base, variant === "play" ? playCols : endCols, extra]
    .filter(Boolean)
    .join(" ");
}

export function desktopMainColumnClass(
  flipDesktopLayout: boolean,
  extra?: string,
) {
  return [
    "flex w-full min-w-0 max-w-full flex-col gap-5",
    flipDesktopLayout && "lg:order-2",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function desktopSidebarClass(
  flipDesktopLayout: boolean,
  extra?: string,
) {
  return [
    "flex w-full min-w-0 max-w-full flex-col",
    "lg:sticky lg:top-6 lg:max-h-[calc(100dvh-8rem)] lg:self-start",
    flipDesktopLayout && "lg:order-1",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function desktopWordHistoryClass(
  flipDesktopLayout: boolean,
  extra?: string,
) {
  return [extra, flipDesktopLayout && "lg:order-1"].filter(Boolean).join(" ");
}
