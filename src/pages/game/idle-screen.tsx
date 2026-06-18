import { GameNavLinks } from "@/components/game-nav-links.tsx";
import { GameToastBanner } from "@/components/game-toast.tsx";
import { SiteBranding, SiteFooter } from "@/components/site-chrome.tsx";
import { Button } from "@/components/ui/button";
import { layoutClasses } from "@/lib/layout-classes.ts";

type IdleScreenProps = {
  errorMessage: string;
  onStart: () => void;
};

export function IdleScreen({ errorMessage, onStart }: IdleScreenProps) {
  return (
    <main className={layoutClasses.simpleScreenMain}>
      <div className="mx-auto flex w-72 flex-col space-y-6 px-2 md:w-96">
        <SiteBranding className="text-center" />
        <Button onClick={onStart}>start!</Button>
        <GameNavLinks include={{ rules: true, settings: true }} />
        {errorMessage && (
          <GameToastBanner message={errorMessage} variant="error" />
        )}
        <SiteFooter />
      </div>
    </main>
  );
}
