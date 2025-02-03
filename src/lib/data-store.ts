import vocabJson from '@/data/word-bank/vocab.json';
import defsJson from '@/data/word-bank/defs.json';
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
            // for my sanity, just consider N5 vocab for now
            if (v.jlpt_level === 'N5') {
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
            this.wordBank.get(d.vocab_id)?.definitions.push(d.def)
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

    async validateDefinition(mysteryWord: GameWord, inputDef: string): Promise<boolean> {
        if (inputDef === "") {
            throw new Error("must enter a definition")
        }

        try {
            const response = await fetch("https://kotoba-tag-server.onrender.com/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_def: inputDef,
                    valid_defs: mysteryWord.definitions.flat()
                }),
            });

            if (!response.ok) {
                throw new Error(`http error: ${response.status}`)
            }

            const res = await response.json()
            console.log("res", res)

            const isValid = res.predictions.some((score: number) => score > 0.935)
            console.log("def isValid", isValid)

            if (!isValid) {
                throw new Error("incorrect definition")
            }

            return isValid
        } catch (error) {
            console.error("error", error)
            throw error
        }
    }

    async validateTag(mysteryWord: GameWord, wordHistory: string[], inputTag: Hiragana): Promise<{ tagWord: Hiragana, defs: string[] }> {
        const tagWord = inputTag.trim()

        if (!isHiragana(tagWord)) {
            throw new Error("must enter hiragana")
        }

        if (tagWord.length < 2) {
            throw new Error("must be two or more kana")
        }

        const mysteryLastKana = getLast(toHiragana(mysteryWord.kana))
        const validStartingKana = getCorresponding(mysteryLastKana)
        const tagFirstKana = toHiragana(tagWord[0]);

        if (!validStartingKana.includes(tagFirstKana)) {
            throw new Error(`must start with one of: ${validStartingKana.join(", ")}`)
        }

        if (wordHistory.map((x) => toHiragana(x)).includes(tagWord)) {
            throw new Error("word already encountered")
        }

        try {
            const response = await fetch(`https://kotoba-tag-server.onrender.com/lookup?tag=${encodeURIComponent(tagWord)}`)

            if (!response.ok) {
                throw new Error(`http error: ${response.status}`)
            }

            const res = await response.json()
            console.log("jisho res", res)

            if (res.data && res.data.length > 0) {
                let wordFound = false
                const validDefs: string[] = [];
                
                res.data.forEach((entry: any) => {
                    const readings = entry.japanese.map((j: any) => j.reading)
                    if (readings.includes(tagWord)) {
                        wordFound = true
                        entry.senses.forEach((sense: any) => {
                            if (sense.parts_of_speech.includes("Noun")) {
                                validDefs.push(...sense.english_definitions)
                            }
                        })
                    }
                })

                if (!wordFound) {
                    throw new Error("could not find word")
                } else if (validDefs.length === 0) {
                    throw new Error("not a noun")
                }

                return { tagWord: tagWord, defs: validDefs }
            } else {
                throw new Error("could not find word, try again")
            }

        } catch (error) {
            console.error("error", error)
            throw error
        }
    }
}

export const vocabStore = new VocabStore();