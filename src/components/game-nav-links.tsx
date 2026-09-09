import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";

type GameNavLinksProps = {
  include?: {
    rules?: boolean;
    settings?: boolean;
    home?: boolean;
    restart?: boolean;
  };
  onRestart?: () => void;
  onReturnHome?: () => void;
};

function NavLinkButton({
  to,
  children,
  isActive,
}: {
  to: string;
  children: React.ReactNode;
  isActive: boolean;
}) {
  return (
    <Button
      variant={isActive ? "secondary" : "outline"}
      asChild
      aria-current={isActive ? "page" : undefined}
    >
      <Link to={to} className={cn(isActive && "pointer-events-none")}>
        {children}
      </Link>
    </Button>
  );
}

export function GameNavLinks({
  include = { rules: true, settings: true },
  onRestart,
  onReturnHome,
}: GameNavLinksProps) {
  const { pathname } = useLocation();

  return (
    <>
      {include.restart && onRestart && (
        <Button size="lg" onClick={onRestart}>
          restart!
        </Button>
      )}
      {include.home && onReturnHome && (
        <Button variant="outline" size="lg" asChild>
          <Link to="/" onClick={onReturnHome}>
            home
          </Link>
        </Button>
      )}
      {include.rules && (
        <NavLinkButton to="/rules" isActive={pathname === "/rules"}>
          rules
        </NavLinkButton>
      )}
      {include.settings && (
        <NavLinkButton to="/settings" isActive={pathname === "/settings"}>
          settings
        </NavLinkButton>
      )}
    </>
  );
}
