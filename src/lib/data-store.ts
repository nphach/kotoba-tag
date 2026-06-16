import defsJson from "@/data/word-bank/defs.json";
import vocabJson from "@/data/word-bank/vocab.json";
import {
  ensureModelReady,
  postDefinition,
} from "./api.ts";
import { ModelLoadingError } from "./errors.ts";
import {
  getSettings,
  isLevelWithinDifficulty,
  type JlptLevel,
} from "./settings.ts";
import {
  isExactDefinitionMatch,
  isLocallyAcceptableDefinition,
} from "./definition-match.ts";
import { fetchJisho } from "./jisho-api.ts";
import {
  isHiragana,
  matchesShiritoriLink,
  normalizeToHiragana,
  toHiragana,
} from "./syllable-utils.ts";
import { GameWord, Hiragana, WordDetails, WordHistoryEntry } from "./types.ts";

type VocabRow = {
  vocab_id: number;
  kanji: string | null;
  kana: string;
  jlpt_level: string;
};

type DefRow = {
  vocab_id: number;
  def: string[];
};

class VocabStore {
  private wordBank: Map<number, GameWord>;
  private jlptLevels: Map<number, JlptLevel>;

  constructor() {
    this.wordBank = new Map();
    this.jlptLevels = new Map();
    this.initializeData();
  }

  private initializeData() {
    (vocabJson as VocabRow[]).forEach((v) => {
      const level = v.jlpt_level as JlptLevel;
      this.jlptLevels.set(v.vocab_id, level);
      this.wordBank.set(v.vocab_id, {
        vocabId: v.vocab_id,
        kanji: v.kanji,
        kana: v.kana as Hiragana,
        definitions: [],
      });
    });

    (defsJson as DefRow[]).forEach((d) => {
      this.wordBank.get(d.vocab_id)?.definitions.push(...d.def);
    });
  }

  private isWordAllowed(vocabId: number): boolean {
    const level = this.jlptLevels.get(vocabId);
    if (!level) return false;
    return isLevelWithinDifficulty(level, getSettings().difficulty);
  }

  private getEligibleWords(words: GameWord[]): GameWord[] {
    return words.filter(
      (word) =>
        isHiragana(word.kana) &&
        word.definitions.length > 0 &&
        this.isWordAllowed(word.vocabId),
    );
  }

  getRandomWord(): GameWord | null;
  getRandomWord(exclude: WordHistoryEntry[], tagWord: Hiragana): GameWord | null;
  getRandomWord(exclude?: WordHistoryEntry[], tagWord?: Hiragana): GameWord | null {
    const hiraganaWords = this.getEligibleWords(
      Array.from(this.wordBank.values()),
    );

    if (exclude && tagWord) {
      const normalizedExclude = new Set(
        exclude.map((word) => toHiragana(word.kana)),
      );
      const availableWords = hiraganaWords
        .filter((word) => !normalizedExclude.has(word.kana))
        .filter((word) => matchesShiritoriLink(tagWord, word.kana));

      if (availableWords.length === 0) return null;
      return availableWords[Math.floor(Math.random() * availableWords.length)];
    }

    if (hiraganaWords.length === 0) return null;
    return hiraganaWords[Math.floor(Math.random() * hiraganaWords.length)];
  }

  lookupByKana(kana: string): GameWord | null {
    const normalized = normalizeToHiragana(kana);
    for (const word of this.wordBank.values()) {
      if (
        normalizeToHiragana(word.kana) === normalized &&
        word.definitions.length > 0
      ) {
        return word;
      }
    }
    return null;
  }

  async lookupWordDetails(kana: string): Promise<WordDetails> {
    const normalized = normalizeToHiragana(kana);
    const local = this.lookupByKana(normalized);
    if (local) {
      return {
        kanji: local.kanji,
        kana: local.kana,
        definitions: local.definitions,
      };
    }

    const entries = await fetchJisho(normalized);

    if (entries.length === 0) {
      throw new Error("couldn't find that word in the dictionary");
    }

    for (const entry of entries) {
      const readings = entry.japanese.map((j) => normalizeToHiragana(j.reading));
      if (!readings.includes(normalized)) continue;

      const kanji = entry.japanese.find((j) => j.word)?.word ?? null;
      const definitions = [
        ...new Set(
          entry.senses.flatMap((sense) => sense.english_definitions),
        ),
      ];

      return { kanji, kana: normalized, definitions };
    }

    throw new Error("couldn't find that word in the dictionary");
  }

  async validateDefinition(
    mysteryWord: GameWord,
    inputDef: string,
  ): Promise<boolean> {
    const mismatchMessage = "that definition doesn't match — try again";

    if (inputDef === "") {
      throw new Error("enter a definition to continue");
    }

    if (isExactDefinitionMatch(inputDef, mysteryWord.definitions)) {
      return true;
    }

    if (isLocallyAcceptableDefinition(inputDef, mysteryWord.definitions)) {
      return true;
    }

    const checkDefinition = async () => {
      const predictions = await postDefinition(
        inputDef,
        mysteryWord.definitions,
      );
      const isValid = predictions.some((score) => score > 0.85);

      if (!isValid) {
        throw new Error(mismatchMessage);
      }

      return isValid;
    };

    try {
      return await checkDefinition();
    } catch (error) {
      if (error instanceof ModelLoadingError) {
        await ensureModelReady();
        return await checkDefinition();
      }

      throw error;
    }
  }

  async validateTag(
    mysteryWord: GameWord,
    wordHistory: WordHistoryEntry[],
    inputTag: Hiragana,
  ): Promise<{ tagWord: Hiragana; defs: string[] }> {
    const tagWord = inputTag.trim() as Hiragana;

    if (!isHiragana(tagWord)) {
      throw new Error("enter the word in hiragana");
    }

    if (tagWord.length < 2) {
      throw new Error("tag words need at least two kana");
    }

    if (!matchesShiritoriLink(mysteryWord.kana, tagWord)) {
      throw new Error(
        "your tag word must start with the last kana of the mystery word",
      );
    }

    if (wordHistory.map((x) => toHiragana(x.kana)).includes(tagWord)) {
      throw new Error("you already used that word this round");
    }

    const entries = await fetchJisho(tagWord);

    if (entries.length > 0) {
      let wordFound = false;
      const validDefs: string[] = [];

      entries.forEach((entry) => {
        const readings = entry.japanese.map((j) => j.reading as Hiragana);
        if (readings.includes(tagWord)) {
          wordFound = true;
          entry.senses.forEach((sense) => {
            if (sense.parts_of_speech.includes("Noun")) {
              validDefs.push(...sense.english_definitions);
            }
          });
        }
      });

      if (!wordFound) {
        throw new Error("couldn't find that word in the dictionary");
      } else if (validDefs.length === 0) {
        throw new Error("tag words must be nouns");
      }

      return { tagWord: tagWord, defs: validDefs };
    } else {
      throw new Error("couldn't find that word — try another");
    }
  }
}

export const vocabStore = new VocabStore();
