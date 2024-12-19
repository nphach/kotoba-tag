
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
  mysteryWord: GameWord;
  wordHistory: Hiragana[];
};

// event types
export type submitEvent = { type: "submit"; definition?: string; tagWord?: Hiragana }
export type invokeEvent = { type: "done.invoke"; data: GameWord }
export type GameEvents = submitEvent | invokeEvent | { type: "START" } | { type: "RESTART" } |{ type: "TIMER" }

// actor input types
export type FetchWordInput = {
  exclude: Hiragana[];
};

export type FetchWordFromTagInput = {
  exclude: Hiragana[];
  tagWord: Hiragana;
};

export type VerifyDefInput = {
  mysteryWord: GameWord;
  definition: string;
};

export type VerifyTagWordInput = {
  tagWord: string;
  mysteryWord: GameWord;
};

// done event types
export type FetchWordDoneEvent = {
  type: 'done.invoke';
  data: GameWord;
};

export type VerifyDoneEvent = {
  type: 'done.invoke';
  data: boolean;
};