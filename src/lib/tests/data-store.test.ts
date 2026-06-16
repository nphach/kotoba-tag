import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameWord, Hiragana } from "../types.ts";

vi.mock("../jisho-api.ts", () => ({
  fetchJisho: vi.fn(),
}));

vi.mock("../api.ts", () => ({
  ensureModelReady: vi.fn(async () => {}),
  postDefinition: vi.fn(),
}));

import { postDefinition } from "../api.ts";
import { vocabStore } from "../data-store.ts";
import { fetchJisho } from "../jisho-api.ts";

const mysteryWord: GameWord = {
  vocabId: 1,
  kanji: "花",
  kana: "はな" as Hiragana,
  definitions: ["flower", "blossom"],
};

describe("vocabStore.validateDefinition", () => {
  beforeEach(() => {
    vi.mocked(postDefinition).mockReset();
  });

  it("rejects empty definitions", async () => {
    await expect(
      vocabStore.validateDefinition(mysteryWord, ""),
    ).rejects.toThrow("enter a definition to continue");
  });

  it("accepts an exact local match without calling the model", async () => {
    await expect(
      vocabStore.validateDefinition(mysteryWord, "flower"),
    ).resolves.toBe(true);
    expect(postDefinition).not.toHaveBeenCalled();
  });

  it("accepts a locally acceptable typo without calling the model", async () => {
    await expect(
      vocabStore.validateDefinition(mysteryWord, "flwoer"),
    ).resolves.toBe(true);
    expect(postDefinition).not.toHaveBeenCalled();
  });

  it("uses the model when local matching fails", async () => {
    vi.mocked(postDefinition).mockResolvedValue([0.9]);

    await expect(
      vocabStore.validateDefinition(mysteryWord, "petal"),
    ).resolves.toBe(true);
    expect(postDefinition).toHaveBeenCalledWith("petal", mysteryWord.definitions);
  });

  it("rejects model predictions below the confidence threshold", async () => {
    vi.mocked(postDefinition).mockResolvedValue([0.5]);

    await expect(
      vocabStore.validateDefinition(mysteryWord, "petal"),
    ).rejects.toThrow("that definition doesn't match — try again");
  });
});

describe("vocabStore.validateTag", () => {
  beforeEach(() => {
    vi.mocked(fetchJisho).mockReset();
  });

  it("rejects non-hiragana input", async () => {
    await expect(
      vocabStore.validateTag(mysteryWord, [], "hana" as Hiragana),
    ).rejects.toThrow("enter the word in hiragana");
  });

  it("rejects words that are too short", async () => {
    await expect(
      vocabStore.validateTag(mysteryWord, [], "な" as Hiragana),
    ).rejects.toThrow("tag words need at least two kana");
  });

  it("rejects tag words that break the shiritori link", async () => {
    await expect(
      vocabStore.validateTag(mysteryWord, [], "はる" as Hiragana),
    ).rejects.toThrow(
      "your tag word must start with the last kana of the mystery word",
    );
  });

  it("rejects words already used in the round", async () => {
    await expect(
      vocabStore.validateTag(
        mysteryWord,
        [{ kana: "なつ" as Hiragana, definitions: ["summer"] }],
        "なつ" as Hiragana,
      ),
    ).rejects.toThrow("you already used that word this round");
  });

  it("accepts a valid noun from jisho", async () => {
    vi.mocked(fetchJisho).mockResolvedValue([
      {
        japanese: [{ reading: "なつ" }],
        senses: [
          {
            parts_of_speech: ["Noun"],
            english_definitions: ["summer"],
          },
        ],
      },
    ]);

    await expect(
      vocabStore.validateTag(mysteryWord, [], "なつ" as Hiragana),
    ).resolves.toEqual({
      tagWord: "なつ",
      defs: ["summer"],
    });
  });

  it("rejects tag words that are not nouns", async () => {
    vi.mocked(fetchJisho).mockResolvedValue([
      {
        japanese: [{ reading: "なつ" }],
        senses: [
          {
            parts_of_speech: ["Verb"],
            english_definitions: ["to become"],
          },
        ],
      },
    ]);

    await expect(
      vocabStore.validateTag(mysteryWord, [], "なつ" as Hiragana),
    ).rejects.toThrow("tag words must be nouns");
  });
});

describe("vocabStore.getRandomWord", () => {
  it("returns a word that matches the shiritori link and excludes history", () => {
    const tag = "なつ" as Hiragana;
    const history = [{ kana: "はな" as Hiragana, definitions: ["flower"] }];
    const word = vocabStore.getRandomWord(history, tag);

    expect(word).not.toBeNull();
    expect(word!.kana.startsWith("つ")).toBe(true);
    expect(history.some((entry) => entry.kana === word!.kana)).toBe(false);
  });
});
