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
      async ({ input }: { input: { wordHistory: GameContext["wordHistory"], tagWord: Hiragana } }) => {
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
        console.log("def input:", input)
        return vocabStore.validateDefinition(input.mysteryWord, input.definition)
      }
    ),

    verifyTagWord: fromPromise(
      async ({ input }: { input: { mysteryWord: GameContext["mysteryWord"], tagWord: Hiragana } }) => {
        console.log("tag input:", input)
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
              initial: 'start',
              states: {
                start: {
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
                      target: "#playing.playRound.presentMystery.part2.start",
                      actions: 'incrementScore'
                    },
                    onError: {
                      target: "start"
                    }
                  }
                }
              }
            },
            part2: {
              states: {
                start: {
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
                      target: "start"
                    },
                    src: 'verifyTagWord'
                  }
                }
              },

              initial: "start"
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