import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  isLevelWithinDifficulty,
  levelsUpTo,
} from "../settings.ts";

describe("levelsUpTo", () => {
  it("includes every level up to the selected cap", () => {
    expect(levelsUpTo("N3")).toEqual(["N5", "N4", "N3"]);
  });

  it("includes only N5 when capped at N5", () => {
    expect(levelsUpTo("N5")).toEqual(["N5"]);
  });
});

describe("isLevelWithinDifficulty", () => {
  it("allows words at or below the selected difficulty", () => {
    expect(isLevelWithinDifficulty("N5", "N3")).toBe(true);
    expect(isLevelWithinDifficulty("N3", "N3")).toBe(true);
  });

  it("rejects words above the selected difficulty", () => {
    expect(isLevelWithinDifficulty("N1", "N3")).toBe(false);
    expect(isLevelWithinDifficulty("N2", DEFAULT_SETTINGS.difficulty)).toBe(
      false,
    );
  });
});
