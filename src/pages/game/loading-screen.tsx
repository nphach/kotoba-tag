import { SiteFooter, SiteTitle } from "@/components/site-chrome.tsx";

export function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="mx-auto flex w-72 flex-col items-center space-y-6 px-2 md:w-96">
      <SiteTitle />
      <div
        className="size-10 animate-spin rounded-full border-4 border-muted border-t-purple-600"
        role="status"
        aria-label="loading"
      />
      <p className="text-center text-sm text-muted-foreground">{message}</p>
      <SiteFooter />
    </div>
  );
}
