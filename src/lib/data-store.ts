import defsJson from "@/data/word-bank/defs.json";
import vocabJson from "@/data/word-bank/vocab.json";
import {
  API_BASE,
  ensureModelReady,
  ModelLoadingError,
  postDefinition,
} from "./api.ts";
import {
  isHiragana,
  matchesShiritoriLink,
  toHiragana,
} from "./syllable-utils.ts";
import { GameWord, Hiragana } from "./types.ts";

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

  constructor() {
    this.wordBank = new Map();
    this.initializeData();
  }

  private initializeData() {
    (vocabJson as VocabRow[]).forEach((v) => {
      if (["N5", "N4"].includes(v.jlpt_level)) {
        this.wordBank.set(v.vocab_id, {
          vocabId: v.vocab_id,
          kanji: v.kanji,
          kana: v.kana as Hiragana,
          definitions: [],
        });
      }
    });

    (defsJson as DefRow[]).forEach((d) => {
      this.wordBank.get(d.vocab_id)?.definitions.push(...d.def);
    });
  }

  getRandomWord(): GameWord | null;
  getRandomWord(exclude: Hiragana[], tagWord: Hiragana): GameWord | null;
  getRandomWord(exclude?: Hiragana[], tagWord?: Hiragana): GameWord | null {
    const hiraganaWords = Array.from(this.wordBank.values()).filter((word) =>
      isHiragana(word.kana),
    );

    if (exclude && tagWord) {
      const normalizedExclude = new Set(exclude.map((word) => toHiragana(word)));
      const availableWords = hiraganaWords
        .filter((word) => !normalizedExclude.has(word.kana))
        .filter((word) => matchesShiritoriLink(tagWord, word.kana));

      if (availableWords.length === 0) return null;
      return availableWords[Math.floor(Math.random() * availableWords.length)];
    }

    if (hiraganaWords.length === 0) return null;
    return hiraganaWords[Math.floor(Math.random() * hiraganaWords.length)];
  }

  async validateDefinition(
    mysteryWord: GameWord,
    inputDef: string,
  ): Promise<boolean> {
    if (inputDef === "") {
      throw new Error("must enter a definition");
    }

    if (isExactDefinitionMatch(inputDef, mysteryWord.definitions)) {
      return true;
    }

    if (isLocallyAcceptableDefinition(inputDef, mysteryWord.definitions)) {
      return true;
    }

    try {
      const predictions = await postDefinition(
        inputDef,
        mysteryWord.definitions,
      );
      const isValid = predictions.some((score) => score > 0.85);

      if (!isValid) {
        throw new Error("incorrect definition");
      }

      return isValid;
    } catch (error) {
      if (error instanceof ModelLoadingError) {
        await ensureModelReady();
        const predictions = await postDefinition(
          inputDef,
          mysteryWord.definitions,
        );
        const isValid = predictions.some((score) => score > 0.85);

        if (!isValid) {
          throw new Error("incorrect definition");
        }

        return isValid;
      }

      throw error;
    }
  }

  async validateTag(
    mysteryWord: GameWord,
    wordHistory: string[],
    inputTag: Hiragana,
  ): Promise<{ tagWord: Hiragana; defs: string[] }> {
    const tagWord = inputTag.trim() as Hiragana;

    if (!isHiragana(tagWord)) {
      throw new Error("must enter hiragana");
    }

    if (tagWord.length < 2) {
      throw new Error("must be two or more kana");
    }

    if (!matchesShiritoriLink(mysteryWord.kana, tagWord)) {
      throw new Error("tag word must follow shiritori rules");
    }

    if (wordHistory.map((x) => toHiragana(x)).includes(tagWord)) {
      throw new Error("word already encountered");
    }

    // const response = await fetch(`${API_BASE}/tag-word?req=${encodeURIComponent(tagWord)}`)
    const response = await fetch(
      `${API_BASE}/tag-word?req=${encodeURIComponent(tagWord)}`,
    );

    const res = await response.json();

    if (!response.ok) {
      throw new Error(`${res.detail}`);
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
        throw new Error("could not find word");
      } else if (validDefs.length === 0) {
        throw new Error("not a noun");
      }

      return { tagWord: tagWord, defs: validDefs };
    } else {
      throw new Error("could not find word, try again");
    }
  }
}

export const vocabStore = new VocabStore();
