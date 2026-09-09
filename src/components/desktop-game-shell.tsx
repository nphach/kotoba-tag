import { SiteFooter } from "@/components/site-chrome.tsx";
import {
  desktopGridClass,
  desktopMainColumnClass,
  desktopSidebarClass,
  desktopWordHistoryClass,
  layoutClasses,
  type DesktopGridVariant,
} from "@/lib/layout-classes.ts";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type DesktopGameShellProps = {
  variant: DesktopGridVariant;
  children: ReactNode;
  footer?: ReactNode;
};

export function DesktopGameShell({
  variant,
  children,
  footer,
}: DesktopGameShellProps) {
  const mainClass =
    variant === "play" ? layoutClasses.gameMain : layoutClasses.gameMainEnd;
  const containerClass =
    variant === "play"
      ? layoutClasses.gameContainer
      : layoutClasses.gameContainerEnd;

  return (
    <main className={mainClass}>
      <div className={containerClass}>
        {children}
        {footer ?? <SiteFooter className="mt-6 shrink-0 sm:mt-8" />}
      </div>
    </main>
  );
}

type DesktopGameGridProps = {
  flipDesktopLayout: boolean;
  variant: DesktopGridVariant;
  main: ReactNode;
  sidebar: ReactNode;
  mainClassName?: string;
};

export function DesktopGameGrid({
  flipDesktopLayout,
  variant,
  main,
  sidebar,
  mainClassName,
}: DesktopGameGridProps) {
  return (
    <div className={desktopGridClass(flipDesktopLayout, variant)}>
      <div className={desktopMainColumnClass(flipDesktopLayout, mainClassName)}>
        {main}
      </div>
      {sidebar}
    </div>
  );
}

export function DesktopWordHistoryAside({
  flipDesktopLayout,
  children,
  className,
}: {
  flipDesktopLayout: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside className={desktopSidebarClass(flipDesktopLayout, className)}>
      {children}
    </aside>
  );
}

export function wordHistoryPanelClass(
  flipDesktopLayout: boolean,
  className?: string,
) {
  return cn(desktopWordHistoryClass(flipDesktopLayout, className));
}
