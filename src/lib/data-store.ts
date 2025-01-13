import vocabJson from '../data/vocab.json';
import defsJson from '../data/defs.json';
import {
    getLast,
    getCorresponding,
    isHiragana,
    toHiragana
} from './syllable-utils.ts'
import {
    GameWord,
    Hiragana
} from './types.ts'

class VocabStore {
    private wordBank: Map<number, GameWord>;

    constructor() {
        this.wordBank = new Map();
        this.initializeData();
    }

    private initializeData() {
        // pull all vocab
        (vocabJson as any[]).forEach(v => {
            // for my sanity, just consider N1 vocab for now
            if (v.jlpt_level === 'N1') {
                this.wordBank.set(v.vocab_id, {
                    vocabId: v.vocabId,
                    kanji: v.kanji,
                    kana: v.kana,
                    definitions: []
                })
            }
        });

        // add definitions
        (defsJson as any[]).forEach(d => {
            this.wordBank.get(d.vocab_id)?.definitions.push(d.def.trim())
        })
    }

    getRandomWord(): GameWord | null
    getRandomWord(exclude: Hiragana[], tagWord: Hiragana): GameWord | null
    getRandomWord(exclude?: Hiragana[], tagWord?: Hiragana): GameWord | null {
        if (exclude && tagWord) {
            // get word based on exclude[] and tag word
            const lastKana = getLast(tagWord)
            const validStartingKana = getCorresponding(lastKana)

            const availableWords = Array.from(this.wordBank.values())
                .filter(word => !exclude.includes(word.kana))
                .filter(word => validStartingKana.some(h => word.kana.startsWith(h)))

            if (availableWords.length === 0) return null;
            return availableWords[Math.floor(Math.random() * availableWords.length)]
        } else {
            // get any word
            const availableWords = Array.from(this.wordBank.values())
            return availableWords[Math.floor(Math.random() * availableWords.length)]
        }
    }

    validateDefinition(mysteryWord: GameWord, inputDef: string): boolean {
        // for now, just return true, will implement AI matching later
        return true
    }

    validateTag(mysteryWord: GameWord, inputTag: Hiragana): Hiragana {
        // for now, check if syllables correspond, will implement Jisho validation later
        const tagWord = inputTag.trim()

        if (!isHiragana(tagWord)) {
            throw new Error("word must be hiragana")
        }

        if (tagWord.length < 2) {
            throw new Error("word must be at least 2 kana long")
        }

        const mysteryLastKana = getLast(toHiragana(mysteryWord.kana))
        const validStartingKana = getCorresponding(mysteryLastKana)
        const tagFirstKana = toHiragana(tagWord[0]);

        if (!validStartingKana.includes(tagFirstKana)) {
            throw new Error(
                "not a valid tag word"
            )
        }

        return inputTag
    }
}

export const vocabStore = new VocabStore();