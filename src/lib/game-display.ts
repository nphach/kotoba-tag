import { EndReason, WordHistoryEntry } from "./types.ts";

export function formatDefinitionPreview(definitions: string[]) {
  return definitions.join(", ");
}

export function getEndGameMessage(endReason: EndReason, errorMessage: string) {
  if (endReason === "timeout") {
    return "time ran out!";
  }
  if (endReason === "error") {
    return errorMessage || "something went wrong — please try again";
  }
  return "game over!";
}

export function countWordsPlayed(
  wordsPlayed: number | undefined,
  wordHistory: WordHistoryEntry[],
) {
  const played = wordsPlayed ?? 0;
  if (played > 0) return played;
  if (wordHistory.length === 0) return 0;
  return Math.floor((wordHistory.length + 1) / 2);
}

export function getRoundSummary(
  wordsPlayed: number | undefined,
  correctDefinitions: number | undefined,
) {
  const played = wordsPlayed ?? 0;
  const definitions = correctDefinitions ?? 0;
  const wordLabel = played === 1 ? "word" : "words";
  const definitionLabel = definitions === 1 ? "definition" : "definitions";
  return `you played ${played} ${wordLabel} this round and guessed ${definitions} correct ${definitionLabel}.`;
}

export function getCountdownLabel(countdown: number) {
  return countdown === 0 ? "go!" : String(countdown);
}

export function getPhaseLabel(inDefPhase: boolean) {
  return inDefPhase
    ? "phase 1 — enter the English definition"
    : "phase 2 — enter a Japanese tag word";
}

export function isTimerUrgent(timer: number) {
  return timer <= 10;
}
