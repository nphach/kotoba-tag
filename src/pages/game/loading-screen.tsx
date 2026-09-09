import { SiteBranding, SiteFooter } from "@/components/site-chrome.tsx";
import { layoutClasses } from "@/lib/layout-classes.ts";

export function LoadingScreen({ message }: { message: string }) {
  return (
    <main className={layoutClasses.simpleScreenMain}>
      <div
        className="mx-auto flex w-72 flex-col items-center space-y-6 px-2 md:w-96"
        role="status"
        aria-label="loading"
        aria-live="polite"
      >
        <SiteBranding className="text-center" />
        <div className="flex flex-col items-center gap-3 py-2">
          <div
            className="size-5 animate-spin rounded-full border-2 border-muted border-t-muted-foreground/50"
            aria-hidden
          />
          <p className="text-center text-sm text-muted-foreground">{message}</p>
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
