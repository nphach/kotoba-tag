import { getErrorMessage } from "./errors.ts";
import { pointsEarnedMessage } from "./scoring.ts";
import type { GameToast } from "./types.ts";

const DEFAULT_PLAY_ERROR = "something went wrong — please try again";

export function formatSystemError(error: unknown) {
  return getErrorMessage(error, DEFAULT_PLAY_ERROR);
}

export function playErrorToast(error: unknown): GameToast {
  return {
    message: formatSystemError(error),
    variant: "error",
  };
}

export function successToast(multiplier: number): GameToast {
  return {
    message: pointsEarnedMessage(multiplier),
    variant: "success",
  };
}

export const skippedToast: GameToast = {
  message: "skipped",
  variant: "neutral",
};
