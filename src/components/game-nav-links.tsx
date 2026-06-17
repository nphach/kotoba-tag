import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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

export function GameNavLinks({
  include = { rules: true, settings: true },
  onRestart,
  onReturnHome,
}: GameNavLinksProps) {
  return (
    <>
      {include.restart && onRestart && (
        <Button onClick={onRestart}>restart!</Button>
      )}
      {include.home && onReturnHome && (
        <Button variant="outline" asChild>
          <Link to="/" onClick={onReturnHome}>
            home
          </Link>
        </Button>
      )}
      {include.rules && (
        <Button variant="outline" asChild>
          <Link to="/rules">rules</Link>
        </Button>
      )}
      {include.settings && (
        <Button variant="outline" asChild>
          <Link to="/settings">settings</Link>
        </Button>
      )}
    </>
  );
}
