import { describe, expect, it } from "vitest";
import {
  countWordsPlayed,
  formatDefinitionPreview,
  getCountdownLabel,
  getEndGameMessage,
  getPhaseLabel,
  getRoundSummary,
  isTimerUrgent,
} from "../game-display.ts";
import { Hiragana } from "../types.ts";

describe("formatDefinitionPreview", () => {
  it("joins definitions with commas", () => {
    expect(formatDefinitionPreview(["cat", "feline"])).toBe("cat, feline");
  });

  it("returns an empty string for no definitions", () => {
    expect(formatDefinitionPreview([])).toBe("");
  });
});

describe("getEndGameMessage", () => {
  it("shows a timeout message", () => {
    expect(getEndGameMessage("timeout", "")).toBe("time ran out!");
  });

  it("shows the error message when the game ends due to an error", () => {
    expect(getEndGameMessage("error", "network failed")).toBe("network failed");
  });

  it("falls back when an error end has no message", () => {
    expect(getEndGameMessage("error", "")).toBe(
      "something went wrong — please try again",
    );
  });

  it("shows a generic game-over message otherwise", () => {
    expect(getEndGameMessage(null, "")).toBe("game over!");
  });
});

describe("countWordsPlayed", () => {
  it("prefers the tracked wordsPlayed counter", () => {
    expect(
      countWordsPlayed(3, [{ kana: "ねこ" as Hiragana, definitions: ["cat"] }]),
    ).toBe(3);
  });

  it("derives a count from word history when wordsPlayed is zero", () => {
    const history = [
      { kana: "ねこ" as Hiragana, definitions: ["cat"] },
      { kana: "こね" as Hiragana, definitions: ["kneading"] },
      { kana: "ねずみ" as Hiragana, definitions: ["mouse"] },
    ];
    expect(countWordsPlayed(0, history)).toBe(2);
  });

  it("returns zero for an empty round", () => {
    expect(countWordsPlayed(0, [])).toBe(0);
  });
});

describe("getRoundSummary", () => {
  it("uses singular labels for one word and one definition", () => {
    expect(getRoundSummary(1, 1)).toBe(
      "you played 1 word this round and guessed 1 correct definition.",
    );
  });

  it("uses plural labels for multiple words and definitions", () => {
    expect(getRoundSummary(4, 2)).toBe(
      "you played 4 words this round and guessed 2 correct definitions.",
    );
  });
});

describe("getCountdownLabel", () => {
  it("shows numeric countdown values", () => {
    expect(getCountdownLabel(3)).toBe("3");
    expect(getCountdownLabel(1)).toBe("1");
  });

  it("shows go when the countdown finishes", () => {
    expect(getCountdownLabel(0)).toBe("go!");
  });
});

describe("getPhaseLabel", () => {
  it("describes the definition phase", () => {
    expect(getPhaseLabel(true)).toBe("phase 1 — enter the English definition");
  });

  it("describes the tag-word phase", () => {
    expect(getPhaseLabel(false)).toBe("phase 2 — enter a Japanese tag word");
  });
});

describe("isTimerUrgent", () => {
  it("marks the last ten seconds as urgent", () => {
    expect(isTimerUrgent(10)).toBe(true);
    expect(isTimerUrgent(9)).toBe(true);
    expect(isTimerUrgent(11)).toBe(false);
  });
});
