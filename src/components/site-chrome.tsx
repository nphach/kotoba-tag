import { cn } from "@/lib/utils";

export function SiteTitle() {
  return <p className="text-4xl font-kosugi">Kotoba Tag!</p>;
}

export function SiteBranding({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <SiteTitle />
      <p className="text-sm text-muted-foreground">
        <i>shiritori</i> for Japanese vocabulary practice
      </p>
    </div>
  );
}

export function SiteFooter({ className }: { className?: string }) {
  return (
    <a
      href="https://nphach.github.io"
      className={cn(
        "block text-center text-xs font-kosugi font-bold",
        className,
      )}
    >
      made by nphach
    </a>
  );
}
