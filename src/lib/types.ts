
export type Hiragana = string & { __brand: 'Hiragana' };

export type GameWord = {
    vocabId: number;
    kanji: string | null;
    kana: Hiragana;
    definitions: string[];
};

export const initialGameWord: GameWord = {
    vocabId: 0,
    kana: "" as Hiragana,
    kanji: "",
    definitions: []
}

export type GameContext = {
  score: number;
  multiplier: number;
  timer: number,
  mysteryWord: GameWord;
  tagWord: Hiragana;
  tagDefinitions: string[];
  wordHistory: Hiragana[];
  errorMessage: string;
};