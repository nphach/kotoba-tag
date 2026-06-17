import { GameNavLinks } from "@/components/game-nav-links.tsx";
import { prefetchModel } from "@/lib/api.ts";
import { countWordsPlayed, getEndGameMessage, getRoundSummary } from "@/lib/game-display.ts";
import { useGame } from "@/lib/game-context.tsx";
import { useSettings } from "@/lib/settings-context.tsx";
import { useEffect } from "react";
import { CountdownScreen } from "./game/countdown-screen.tsx";
import { EndGameLayout } from "./game/end-game-layout.tsx";
import { IdleScreen } from "./game/idle-screen.tsx";
import { LoadingScreen } from "./game/loading-screen.tsx";
import { PlayScreen } from "./game/play-screen.tsx";

function GamePage() {
  const [state, send] = useGame();
  const { settings } = useSettings();

  const {
    score,
    wordHistory,
    errorMessage,
    wordsPlayed,
    correctDefinitions,
    endReason,
    countdown,
  } = state.context;

  const handleReturnHome = () => {
    send({ type: "RETURN_HOME" });
  };

  useEffect(() => {
    prefetchModel();
  }, []);

  if (state.matches("idle")) {
    return (
      <IdleScreen
        errorMessage={errorMessage}
        onStart={() => send({ type: "START" })}
      />
    );
  }

  if (state.matches({ prepareGame: "warmingUp" })) {
    return <LoadingScreen message="warming up model..." />;
  }

  if (state.matches({ prepareGame: "countdown" })) {
    return <CountdownScreen countdown={countdown} />;
  }

  if (state.matches("complete")) {
    return (
      <EndGameLayout
        title="nice!"
        wordHistory={wordHistory}
        flipDesktopLayout={settings.flipDesktopLayout}
        actions={
          <GameNavLinks
            include={{ restart: true, home: true, rules: true, settings: true }}
            onRestart={() => send({ type: "RESTART" })}
            onReturnHome={handleReturnHome}
          />
        }
      >
        <div className="space-y-4 text-sm text-balance">
          <p>there are no more tag words in the word bank.</p>
          <p className="font-kosugi">日本語が上手ですね ww</p>
        </div>
        <p className="text-4xl font-bold tabular-nums">final score: {score}</p>
        <p className="text-sm text-muted-foreground">
          {getRoundSummary(
            countWordsPlayed(wordsPlayed, wordHistory),
            correctDefinitions,
          )}
        </p>
      </EndGameLayout>
    );
  }

  if (state.matches("endGame")) {
    return (
      <EndGameLayout
        title="game over!"
        wordHistory={wordHistory}
        flipDesktopLayout={settings.flipDesktopLayout}
        actions={
          <GameNavLinks
            include={{ restart: true, home: true, rules: true, settings: true }}
            onRestart={() => send({ type: "RESTART" })}
            onReturnHome={handleReturnHome}
          />
        }
      >
        <p className="text-muted-foreground">
          {getEndGameMessage(endReason, errorMessage)}
        </p>
        <p className="text-4xl font-bold tabular-nums">final score: {score}</p>
        <p className="text-sm text-muted-foreground">
          {getRoundSummary(
            countWordsPlayed(wordsPlayed, wordHistory),
            correctDefinitions,
          )}
        </p>
      </EndGameLayout>
    );
  }

  return <PlayScreen />;
}

export default GamePage;
