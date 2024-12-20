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