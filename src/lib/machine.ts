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

    // update most recent Tag Word from submission
    updateTagWord: assign({
      tagWord: ({ event }) => {
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
      wordHistory: ({ context }) =>
        [...context.wordHistory, context.tagWord]
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
        const word = vocabStore.getRandomWord();

        if (!word) {
          throw new Error("complete - no more words available!");
        }

        const wordData = {
          kana: word.kana,
          kanji: word.kanji,
          vocabId: word.vocabId,
          definitions: word.definitions
        };

        return wordData;
      }
    ),

    // fetch a random word for VocabStore based on the given tagWord and wordHistory
    fetchWordFromTag: fromPromise(
      async ({ input }: { input: { wordHistory: GameContext["wordHistory"], tagWord: Hiragana } }) => {
        console.log("fetchWordFromTag input:", input)
        const word = vocabStore.getRandomWord(input.wordHistory, input.tagWord)
        if (!word) {
          throw new Error("complete - no more words available!");
        }

        return word;
      }
    ),

    verifyDef: fromPromise(
      async ({ input }: { input: { mysteryWord: GameContext["mysteryWord"], definition: string } }) => {
        console.log("verifyDef input:", input)
        return vocabStore.validateDefinition(input.mysteryWord, input.definition)
      }
    ),

    verifyTagWord: fromPromise(
      async ({ input }: { input: { mysteryWord: GameContext["mysteryWord"], tagWord: Hiragana } }) => {
        console.log("verifyTagWord input:", input)
        return vocabStore.validateTag(input.mysteryWord, input.tagWord)
      })
  },

}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAcA2BDAngSwHZQDpsJUwBiAZQBUBBAJSoG0AGAXURQHtZsAXbTrg4gAHogDsAVgBMBAGwBGaZPHNJc6QA4ALAoUAaEJkTbmATgIBmSwuabL08Y7UBfF4bRY8hGLwCymLC8YABOmGQQgmBEuABunADW0Z44+AS+AUGhmAh48QDG6PyCLKylwsjcfAJCSKKIZnLi8uJm2vZOCnLaNobGCNpOBJLa0krMauKaI+JuHhipPmD+gcFhZKEhnCEEnrwAZtsAtrsL3unLmWs5eZyFxbil5XWVPA-CYgiWUwRaZgqSSxyRSDcTiPqISR2AjaMwyMzMOTMbQjDRyOYgFLnFJ0TgAV1wEDIIiCRWi6H2awAFJYJnSAJRkLFpHH4wnPLhvGofRAKTQEcS2EbSMxSJwoiFfOSWAiaMxmayaBTWORmMYY5mEVkEiC7EJwMC4FZZMK7dAhXgKAiki2UACqACE-ABJJhsCpVd51T5yST8yx+zRSNSaRHgoy86SDAh8gN2QWSJRKDVnFkLXE6vUGo1XbJmi1WiBgfZ4aqCADCAAswPkEhEojF4kkCLFQth9pgACLFjmYz3c7285hdX5aTTSLSCxrWSVKSzaGM2bQacRIqbSFNeNNYDOErOwQ3G675y0EIsl3Bl3BVmt1zbbU5FQ4hE6tkLtrs990vfuCHkIKY5BhZgnDUeNxCBMxZwUNUrEsINJHUaVgWkdF3ExVMtXTNldWQfUDxzVY82Qc1eFkG1eHtJ1XV7V4r3-JQ-QFJwFXacxviDWco1kTRVWUVpbDVJVN0WR9MF3XD8MPXNTRIi1ZF4dAoAAdW2CAb1retcGiW5mzfD8qCU1SQggWjf1qUAfVghQplhQUFBRZgxlndRmAIECJhUVEQOXETsWwzM8OzI9iNIhSjLUjS7xCLYdj2Z9XzbDtDJUtSzK5P9BwQZV7GGWk9DVVi-XDfo5zc3j-nsOVAVQjd0M1MSJIII48VQfg0GwUICH4WtvGJUlggIClqShCZGQa7U9xatrsA6rqeoSbx0vorLlUUUceh0ZgA1MTRNElUMLA0CYFU6UZk3qzDGpw7rsCOebsF6-B+sUwbhtCKlbDGpkrsm3V+HunYFqW79ORWyzECVGVaXnPQgT0exJAO8x5GkE7vjGc66vmLclhCsIADEtiOFKtJ0uJEmifZlnyStjIgInOBJpTlq9CGEAnfkAVpXjpkBLoNAOuUYzXb5BnUBEzD8tIMiIwnidJ+84owA5jgIaneFp+nGeZqBWYHdmZAIVjVSkLo5WHRpJTBBc4U53Q4x56XCENCAAHF0Husg6AAUWoeg3XYH8Mos+pstXYZpjVRMNDlAF9ojAZLAsKFEMGHQA1abQ3HQ3BOCLeAXkwj0Q--ABaEVfjlFFVG4qQkcTxwgOT1idBrlFsYw3GiBIMAS-BsPfQXexbBrqReMFSV4IsLpHHsTOZFmS7u9lk1+jBtnB+6VHgXH8Ww0lcWRZ0X1pic75JGd66dX7zfPihflTps8wRgcLpJWlBdjr0Ow0faVcr5-X3NJOW68+ylyyohICT9VBwh6GMOQs4JjNBqtMBwiEIIaEAQFPcQUCL40wCeBQt8DaD2RMbb4z84Fv0QYnH+0N4KdCRGjUU2Cdw3TwSAteRDrSKQtCQzK7MmiyAcsOLo85xA9H+NBBEspGEOSVA-b4bDxIcKkoRbhclTznlLA8KKAjQ4+iNjAl+8D350JsDxG2MhIL-xUU1ThGjjxaOkAYhiME3K+l9FCKYq4QKWCQXCdyDg9o9G2gqVC9i1HBRkoQlxvDSJuNWo4WQacoxqlGAqAwdC+SpJCWCGO-w2hRMCuoghJ5wqpRMvo4OA9Phzn5F4xCIEgyi1nLSBc1gHZiNMIKEpU1WrtVQJ1EIST2Z6AjkCEUU5JFqicNbCcMY0ZfQfj0FE-TdTTSGSM26T0oBjLDkoKMVgNCihgrMlJB1RiRxgo4BUSoESWA2bdQGByfSVyhHoCcXzRitAWSI5Znk7BrMvsvUSQCAYPT2W8xATQUFiO+UoX5UFE4j3co0JosJTAsM0FfVe1wdYpRhdlbawF5zT3nDIEU2gXJMX+LoCc7QbBBmzmC84rsPb3WJTBGUgwnJQlFJLBwH9ZGmFGNITOWTrA5xcEAA */
  id: "playing",
  initial: "idle",
  context: {
    score: 0,
    multiplier: 5,
    timer: 30,
    mysteryWord: initialGameWord,
    tagWord: "" as Hiragana,
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
                        'updateTagWord',
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
        input: ({ context }) => ({
          wordHistory: context.wordHistory,
          tagWord: context.tagWord
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
            tagWord: "" as Hiragana,
            wordHistory: [],
          })
        }
      }
    }
  }
});