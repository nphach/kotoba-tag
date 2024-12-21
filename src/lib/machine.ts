import { setup, assign, fromPromise } from "xstate";
import {
  GameContext,
  initialGameWord,
  Hiragana
} from './types.ts'
import { vocabStore } from "./data-store.ts";

export const machine = setup({
  types: {
    context: {} as GameContext
  },
  actions: {
    // update current Mystery Word with fetched word from fetchWord/ fetchWordFromTag
    updateMysteryWord: assign({
      mysteryWord: ({ event }) => {
        return event.output
      }
    }),

    // add current Mystery Word hiragana to wordHistory
    addMystery: assign({
      wordHistory: ({ context }) =>
        [...context.wordHistory, context.mysteryWord.kana]
    }),

    // add valid Tag Word to wordHistory
    addTagWord: assign({
      wordHistory: ({ context, event }) =>
        (event.type === "SUBMIT" && event.tagWord) ? [...context.wordHistory, event.tagWord] : context.wordHistory
    }),

    incrementScore: assign({
      score: ({ context }) => context.score + (10 * context.multiplier)
    }),

    decrementMultiplier: assign({
      multiplier: ({ context }) => context.multiplier > 1 ? context.multiplier - 1 : 1
    }),

    decrementTimer: assign({
      timer: ({ context }) => context.timer > 1 ? context.timer - 1 : 1
    })
  },
  actors: {
    // fetch a random word from VocabStore
    fetchWord: fromPromise(
      async () => {
        console.log("starting fetchWord");
        const word = vocabStore.getRandomWord();

        if (!word) {
          throw new Error("complete - no more words available!");
        }

        // Create a properly structured return object
        const wordData = {
          kana: word.kana,
          kanji: word.kanji,
          vocabId: word.vocabId,
          definitions: word.definitions
        };

        console.log("fetchWord returning:", wordData);
        return wordData;  // This becomes event.data in the transition
      }
    ),

    // fetch a random word for VocabStore based on the given tagWord and wordHistory
    fetchWordFromTag: fromPromise(
      async ({ input }: { input: { wordHistory: GameContext["wordHistory"], tagWord: Hiragana }}) => {
        console.log("fetching from tag...")
        console.log("fetching from tag input:", input)
        const word = vocabStore.getRandomWord(input.wordHistory, input.tagWord)
        if (!word) {
          throw new Error("complete - no more words available!");
        }

        console.log('fetched word from tag details:', word)

        return word;
      }
    ),

    verifyDef: fromPromise(
      async ({ input }: { input: { mysteryWord: GameContext["mysteryWord"], definition: string } }) => {
        console.log("verifying def...")
        console.log("verifying def input:", input)
        return vocabStore.validateDefinition(input.mysteryWord, input.definition)
      }
    ),

    verifyTagWord: fromPromise(
      async ({ input }: { input: { mysteryWord: GameContext["mysteryWord"], tagWord: Hiragana }}) => {
        console.log("verifying tag...")
        console.log("verifying tag input:", input)
        return vocabStore.validateTag(input.mysteryWord, input.tagWord)
      })
  },

}).createMachine({
  /** @xstate-layout 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 */
  id: "playing",
  initial: "idle",
  context: {
    score: 0,
    multiplier: 5,
    timer: 30,
    mysteryWord: initialGameWord,
    wordHistory: [],
  },
  states: {
    idle: {
      on: {
        START: "getMystery"
      }
    },
    getMystery: {
      invoke: {
        src: 'fetchWord',
        onDone: {
          target: 'playRound',
          actions: [
            'updateMysteryWord',
            'addMystery'
          ]
        },
        onError: {
          target: 'endGame'
        }
      }
    },
    playRound: {
      type: 'parallel',
      after: {
        '30000': {
          target: 'endGame'
        }
      },
      states: {
        presentMystery: {
          initial: 'part1',
          states: {
            part1: {
              on: {
                SUBMIT: {
                  target: 'definitionCheck'
                }
              }
            },
            definitionCheck: {
              invoke: {
                id: 'verifyDef',
                src: 'verifyDef',
                input: ({ context, event }) => ({
                  mysteryWord: context.mysteryWord,
                  definition: event.definition
                }),
                onDone: {
                  target: 'part2',
                  actions: 'incrementScore'
                },
                onError: {
                  target: 'part1'
                }
              }
            },
            part2: {
              on: {
                SUBMIT: {
                  target: 'tagWordCheck'
                }
              }
            },
            tagWordCheck: {
              invoke: {
                id: 'verifyTagWord',
                input: ({ context, event }) => ({
                  mysteryWord: context.mysteryWord,
                  tagWord: event.tagWord
                }),
                onDone: {
                  target: '#playing.getMysteryFromTag',
                  actions: [
                    'incrementScore',
                    'addTagWord'
                  ]
                },
                onError: {
                  target: 'part2'
                },
                src: 'verifyTagWord'
              }
            }
          }
        },
        multiplier: {
          initial: 'ticking',
          states: {
            ticking: {
              after: {
                '5000': {
                  target: 'ticking',
                  actions: 'decrementMultiplier',
                  reenter: true
                }
              }
            }
          }
        },
        timer: {
          initial: 'ticking',
          states: {
            ticking: {
              after: {
                '1000': {
                  target: 'ticking',
                  actions: 'decrementTimer',
                  reenter: true
                }
              }
            }
          }
        },
      }
    },
    getMysteryFromTag: {
      invoke: {
        id: 'fetchWordFromTag',
        input: ({ context, event }) => ({
          wordHistory: context.wordHistory,
          tagWord: event.tagWord
        }),
        onDone: {
          target: 'playRound',
          actions: [
            'updateMysteryWord',
            'addMystery',
            assign({ multiplier: 5 }),
            assign({ timer: 30 })
          ]
        },
        onError: {
          target: 'endGame'
        },
        src: 'fetchWordFromTag'
      }
    },
    endGame: {
      on: {
        RESTART: {
          target: 'getMystery',
          actions: assign({
            score: 0,
            multiplier: 5,
            timer: 30,
            mysteryWord: initialGameWord,
            wordHistory: [],
          })
        }
      }
    }
  }
});