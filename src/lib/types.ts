
export type Hiragana = string & { __brand: 'Hiragana' };

export type GameWord = {
    vocabId: number;
    kanji: string | null;
    kana: Hiragana;
    definitions: string[];
};

export type WordDetails = {
    kanji: string | null;
    kana: Hiragana;
    definitions: string[];
};

export type WordHistoryEntry = {
    kana: Hiragana;
    definitions: string[];
};

export const initialGameWord: GameWord = {
    vocabId: 0,
    kana: "" as Hiragana,
    kanji: "",
    definitions: []
}

export type EndReason = "timeout" | "error" | null;

export type GameToastVariant = "error" | "success" | "neutral";

export type GameToast = {
  message: string;
  variant: GameToastVariant;
};

export type GameContext = {
  score: number;
  multiplier: number;
  timer: number,
  mysteryWord: GameWord;
  tagWord: Hiragana;
  tagDefinitions: string[];
  wordHistory: WordHistoryEntry[];
  errorMessage: string;
  toast: GameToast | null;
  wordsPlayed: number;
  correctDefinitions: number;
  endReason: EndReason;
  countdown: number;
};