export const layoutClasses = {
  simpleScreenMain:
    "flex min-h-[calc(100dvh-4rem)] w-full items-center justify-center overflow-y-auto py-4 sm:px-4 sm:py-6 lg:px-8",
  gameMain:
    "flex min-h-[calc(100dvh-4rem)] w-full min-w-0 max-w-full flex-col overflow-x-hidden overflow-y-auto px-2 py-4 sm:px-4 sm:py-6 lg:h-[calc(100dvh-2rem)] lg:min-h-0 lg:justify-center lg:overflow-y-auto lg:px-8",
  gameMainEnd:
    "flex min-h-[calc(100dvh-4rem)] w-full min-w-0 max-w-full flex-col overflow-x-hidden overflow-y-auto px-2 py-6 sm:px-4 lg:h-[calc(100dvh-2rem)] lg:min-h-0 lg:justify-center lg:overflow-y-auto lg:px-8",
  gameContainer:
    "mx-auto flex w-full min-h-0 min-w-0 max-w-5xl flex-col gap-5 text-left lg:max-h-[calc(100dvh-4rem)] lg:gap-6 xl:max-w-6xl",
  gameContainerEnd:
    "mx-auto flex w-full min-h-0 min-w-0 max-w-5xl flex-col gap-6 lg:h-[min(44rem,calc(100dvh-6rem))] lg:max-h-[calc(100dvh-4rem)] xl:max-w-6xl",
  desktopGridMaxHeight: "lg:max-h-[44rem]",
  mysteryWordCard:
    "flex h-[14rem] min-h-0 w-full min-w-0 max-w-full flex-col overflow-hidden sm:h-[15rem] lg:min-h-[14rem] lg:max-h-[22rem] lg:flex-1",
  lastTagWordCard:
    "flex h-40 w-full min-w-0 max-w-full shrink-0 flex-col overflow-hidden sm:h-44 lg:h-48",
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
      ? `grid min-h-0 min-w-0 max-w-full flex-1 gap-5 lg:items-stretch lg:gap-6 ${layoutClasses.desktopGridMaxHeight}`
      : `grid min-h-[28rem] min-w-0 max-w-full flex-1 gap-6 lg:min-h-0 lg:items-stretch ${layoutClasses.desktopGridMaxHeight}`;

  return [base, variant === "play" ? playCols : endCols, extra]
    .filter(Boolean)
    .join(" ");
}

export function desktopMainColumnClass(
  flipDesktopLayout: boolean,
  extra?: string,
) {
  return [
    "flex h-full min-h-0 min-w-0 w-full max-w-full flex-col gap-5 overflow-hidden",
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
    "flex h-full min-h-0 min-w-0 w-full max-w-full flex-col overflow-hidden",
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
