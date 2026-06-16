import defsJson from "@/data/word-bank/defs.json";
import vocabJson from "@/data/word-bank/vocab.json";
import {
  API_BASE,
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
  isHiragana,
  matchesShiritoriLink,
  normalizeToHiragana,
  toHiragana,
} from "./syllable-utils.ts";
import { GameWord, Hiragana, WordDetails, WordHistoryEntry } from "./types.ts";

function normalizeDefinition(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?]+$/g, "")
    .replace(/[-/]/g, " ")
    .replace(/\b(a|an|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isExactDefinitionMatch(input: string, definitions: string[]): boolean {
  const normalized = normalizeDefinition(input);
  return definitions.some(
    (definition) => normalizeDefinition(definition) === normalized,
  );
}

function damerauLevenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const columns = b.length + 1;
  const distance = Array.from({ length: rows }, () =>
    Array<number>(columns).fill(0),
  );

  for (let i = 0; i <= a.length; i++) distance[i][0] = i;
  for (let j = 0; j <= b.length; j++) distance[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      distance[i][j] = Math.min(
        distance[i - 1][j] + 1,
        distance[i][j - 1] + 1,
        distance[i - 1][j - 1] + cost,
      );

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        distance[i][j] = Math.min(
          distance[i][j],
          distance[i - 2][j - 2] + cost,
        );
      }
    }
  }

  return distance[a.length][b.length];
}

function allowedStrictTypoDistance(length: number): number {
  if (length <= 4) return 1;
  if (length <= 10) return 2;
  return Math.min(3, Math.floor(length * 0.15));
}

function isStrictTypoDefinitionMatch(
  input: string,
  definition: string,
): boolean {
  const normalizedInput = normalizeDefinition(input);
  const normalizedDefinition = normalizeDefinition(definition);
  const maxLength = Math.max(
    normalizedInput.length,
    normalizedDefinition.length,
  );
  const maxDistance = allowedStrictTypoDistance(maxLength);

  if (maxLength === 0) return false;
  if (
    Math.abs(normalizedInput.length - normalizedDefinition.length) > maxDistance
  )
    return false;

  const distance = damerauLevenshteinDistance(
    normalizedInput,
    normalizedDefinition,
  );
  if (distance <= maxDistance && distance / maxLength <= 0.18) {
    return true;
  }

  const compactInput = normalizedInput.replace(/\s/g, "");
  const compactDefinition = normalizedDefinition.replace(/\s/g, "");
  const compactMaxLength = Math.max(
    compactInput.length,
    compactDefinition.length,
  );
  const compactMaxDistance = allowedStrictTypoDistance(compactMaxLength);

  if (compactInput === compactDefinition) return true;
  if (
    Math.abs(compactInput.length - compactDefinition.length) >
    compactMaxDistance
  )
    return false;

  const compactDistance = damerauLevenshteinDistance(
    compactInput,
    compactDefinition,
  );

  return (
    compactMaxLength > 0 &&
    compactDistance <= compactMaxDistance &&
    compactDistance / compactMaxLength <= 0.15
  );
}

function getDefinitionTokens(value: string): string[] {
  const normalized = normalizeDefinition(value);
  if (normalized === "") return [];
  return normalized.split(" ");
}

function tokenMatches(inputToken: string, definitionToken: string): boolean {
  if (inputToken === definitionToken) return true;

  const maxLength = Math.max(inputToken.length, definitionToken.length);
  if (maxLength < 5) return false;
  if (Math.abs(inputToken.length - definitionToken.length) > 1) return false;

  return damerauLevenshteinDistance(inputToken, definitionToken) <= 1;
}

function isTokenPhraseDefinitionMatch(
  input: string,
  definition: string,
): boolean {
  const inputTokens = getDefinitionTokens(input);
  const definitionTokens = getDefinitionTokens(definition);

  if (inputTokens.length < 2 && definitionTokens.length < 2) return false;
  if (Math.abs(inputTokens.length - definitionTokens.length) > 1) return false;

  const compactInput = inputTokens.join("");
  const compactDefinition = definitionTokens.join("");
  if (compactInput !== "" && compactInput === compactDefinition) return true;

  const unmatchedDefinitionTokens = [...definitionTokens];
  let matches = 0;

  for (const inputToken of inputTokens) {
    const matchIndex = unmatchedDefinitionTokens.findIndex((definitionToken) =>
      tokenMatches(inputToken, definitionToken),
    );

    if (matchIndex >= 0) {
      matches += 1;
      unmatchedDefinitionTokens.splice(matchIndex, 1);
    }
  }

  return matches / Math.max(inputTokens.length, definitionTokens.length) >= 0.8;
}

function isLocallyAcceptableDefinition(
  input: string,
  definitions: string[],
): boolean {
  return definitions.some(
    (definition) =>
      isStrictTypoDefinitionMatch(input, definition) ||
      isTokenPhraseDefinitionMatch(input, definition),
  );
}

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

    let response: Response;
    try {
      response = await fetch(
        `${API_BASE}/tag-word?req=${encodeURIComponent(normalized)}`,
      );
    } catch {
      throw new Error(
        "couldn't reach the dictionary — check your connection and try again",
      );
    }

    const res = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail =
        typeof res.detail === "string"
          ? res.detail
          : "dictionary lookup failed — try again";
      throw new Error(detail);
    }

    if (!res.data || res.data.length === 0) {
      throw new Error("couldn't find that word in the dictionary");
    }

    for (const entry of res.data as {
      japanese: { word?: string; reading: string }[];
      senses: { english_definitions: string[] }[];
    }[]) {
      const readings = entry.japanese.map((j) => normalizeToHiragana(j.reading));
      if (!readings.includes(normalized)) continue;

      const kanji =
        entry.japanese.find((j) => j.word)?.word ?? null;
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

    let response: Response;
    try {
      response = await fetch(
        `${API_BASE}/tag-word?req=${encodeURIComponent(tagWord)}`,
      );
    } catch {
      throw new Error(
        "couldn't reach the dictionary — check your connection and try again",
      );
    }

    const res = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail =
        typeof res.detail === "string"
          ? res.detail
          : "dictionary lookup failed — try again";
      throw new Error(detail);
    }

    if (res.data && res.data.length > 0) {
      let wordFound = false;
      const validDefs: string[] = [];

      res.data.forEach(
        (entry: {
          japanese: { reading: string }[];
          senses: {
            parts_of_speech: string[];
            english_definitions: string[];
          }[];
        }) => {
          const readings = entry.japanese.map((j) => j.reading as Hiragana);
          if (readings.includes(tagWord)) {
            wordFound = true;
            entry.senses.forEach((sense) => {
              if (sense.parts_of_speech.includes("Noun")) {
                validDefs.push(...sense.english_definitions);
              }
            });
          }
        },
      );

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
