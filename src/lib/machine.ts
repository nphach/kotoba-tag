import { setup, assign, fromPromise } from "xstate";
import {
  GameContext,
  initialGameWord,
  Hiragana
} from './types.ts'
import { vocabStore } from "src/lib/data-store.ts";

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

    // update most recent Tag Word and definitions from submission
    updateTagWord: assign({
      tagWord: ({ event }) => {
        return event.output.tagWord
      },
      tagDefinitions: ({ event }) => {
        return event.output.defs
      }
    }),

    // add current Mystery Word hiragana to wordHistory
    addMystery: assign({
      wordHistory: ({ context }) =>
        [context.mysteryWord.kana, ...context.wordHistory]
    }),

    // add valid Tag Word to wordHistory
    addTagWord: assign({
      wordHistory: ({ context }) =>
        [context.tagWord, ...context.wordHistory]
    }),

    incrementScore: assign({
      score: ({ context }) => context.score + (10 * context.multiplier)
    }),

    decrementMultiplier: assign({
      multiplier: ({ context }) => context.multiplier > 1 ? context.multiplier - 1 : 1
    }),

    decrementTimer: assign({
      timer: ({ context }) => context.timer > 1 ? context.timer - 1 : 1
    }),

    setErrorMessage: assign({
      errorMessage: ({ event }) => event.error.message || "error"
    }),

    clearErrorMessage: assign({
      errorMessage: () => ""
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
      async ({ input }: { input: { mysteryWord: GameContext["mysteryWord"], wordHistory: GameContext["wordHistory"], tagWord: Hiragana } }) => {
        console.log("verifyTagWord input:", input)
        return vocabStore.validateTag(input.mysteryWord, input.wordHistory, input.tagWord)
      })
  },

}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAcA2BDAngSwHZQDpsJUwBiAZQBUBBAJSoG0AGAXURQHtZsAXbTrg4gAHogDsAVgBMBAGwBGaZPHNJc6QA4ALAoUAaEJkTbmATgIBmSwuabL08Y7UBfF4bRY8hGLwCymLC8YABOmGQQgmBEuABunADW0Z44+AS+AUGhmAh48QDG6PyCLKylwsjcfAJCSKKIZnLi8uJm2vZOCnLaNobGCNpOBJLa0krMauKaI+JuHhipPmD+gcFhZKEhnCEEnrwAZtsAtrsL3unLmWs5eZyFxbil5XWVPA-CYgiWUwRaZgqSSxyRSDcTiPqISR2AjaMwyMzMOTMbQjDRyOYgFLnFJ0TgAV1wEDIIiCRWi6H2awAFJYJhMAJRkLFpHH4wnPLhvGofRBAuQwrTiBTtFF2JQQhCqbQEf6qOHSbQoyQKWbuTFnFkLXEEiC7EJwMC4FZZMK7dAhXgKAiki2UACqACE-ABJJhsCpVd51T5ySSaKx+zRSNSaRHgoyIJSDAgKexQoMApRKDHMwisnV6g1Gq7ZM0Wq0QMD7PDVQQAYQAFmB8gkIlEYvEkgRYqFsPtMAARIsczGe7neyPMLq-LSaaSChSNawSpSWaUKGzaDTiJFTaQpjVprVs3XIfWwQ3G655y0EQvF3Cl3CV6u1zbbU5FQ4hE4tkJtzvd90vPuCHmSzR+VMJw1DsMEgTMGdJ1kawg0kdQ5D5aR0TVVNH0wbVCUzA9s1WXNkHNXhZBtXh7SdV0e1eK9-yUP0CDBaQzDnUMmKmcN+ijWRALMZRWlsHjNAUDcvE1LBMN3fdDxzU0CItWReHQKAAHVtggG8azrXBoluJs3w-KhFJUkIIEo39alAH0eJjKZYSFYUoTGGd1GYAhmFUSZUTcpdhMWdDxOwqS8Jkwj5MM1T1LvEIth2PZn1fVt2wM5TVNMrk-wHBAF3sYZaT0HimJRIMZ2kWkCG42NLE0OEHA0HzsW3DMjjxVB+DQbBQgIfga28YlSWCAgKWpKEGSZTc-J3Agmpa7A2o6rqEm8VLqIyhdFBHHodGYSwRjsTQJRY+RpAmVixlGZNULG9MsP4I45uwbr8F6hT+sG0IqVsEa0Ku3Ubruh6oCWr0LMQQTLCsLbdFWvQ4328xDuO75TrGdcLpEpYj2yAAxLYjiSzTtLiRJon2ZZ8grIyIGxzhccUwH+2BhBx39AFaUA6ZAS6DR9qqmNV2+QZ1ARMw6rSDIgswKmaagDYoofWLjgIEneDJinJaSun0oZmQZTnOQzCkLoqqHRoJTBaV5S0XRtq2uwRcIQ0IAAcXQW6yDoABRah6DddgfzS8z6kyldhmmHjlQ0KqAT2iMBksCwoXgwYdG21ptDcNVcE4Qt4BeTcPX9-9zd1-Xw6Nyc5AlXL5Ajrb-ljKZLDtogSDAfPloZ31pXsWwUTBP0mgMGPKosLpHHsFOZFVeY0YuDGwjboHA+BaU0SaP0BbDCUBd5nRfWmZgSqkJvvoX+nA-jHWhTlEYHC6CVEJXo7zFDJdAPg4+Gqwvcszn-pOXb8+6hL4qnMDfMYFcY4fWaICUcsZRhAiBB-MSE1v44V-ieBQp9NZL2RMA6+PRwFQS2lYSqDF1BAmFEgjCKDJK4RNJgDB1oFIWiwQHH0QxhRDi6HOcQPR-hQQRGVUhwpBLxm+FQ-yqDAr0MYeeEsDwIqsP-L6WQrEQFwgIXfSBNguJmxkBBdoU91Qz2+gFOhx5ZJESUStScLlfS+ihGxPmM5QGuQcGOUwTFx5p1Rr5UxUjzH4RCkwwi1iGZKCGInBUPFRhMUHhxWMsgYFBgNnrScPjp5+M-hJH+0kGGWNCslYyii-YAM+LOf09j4JuSDM47RuDrBWy4cBISvj6rIMas1VqqB2ohDCYHPQwcgSMSFPrWEjhpCm3HDGJ+cJNA6GFNYCRE0prdN6Z1e6C18D9PKeOaUwz9aTl4TxJw+1Rgh2gq0SqtjG5tNEtQjMv0+mlMXj6RiwwuHjj0AqRwkEY5OFkOMUB8zdA9FuZk9pDzrrYFujsea3gdmICaNAz5YxOKtH2jYVyjQmiwlMEdMwmgm5i3oWrRSiLMrENMHOYec4ZCMW0E5Oi-xdB7O7kGDJxjfIO2drdClk4waDAPlCfWQsHD30EaYUYJUVBxKWenIAA */
  id: "playing",
  initial: "idle",
  context: {
    score: 0,
    multiplier: 5,
    timer: 30,
    mysteryWord: initialGameWord,
    tagWord: "" as Hiragana,
    tagDefinitions: [],
    wordHistory: [],
    errorMessage: ""
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
            'addMystery',
            'clearErrorMessage'
          ]
        },
        onError: {
          target: 'endGame',
          actions: 'setErrorMessage'
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
                    },
                    SKIP: {
                      target: '#playing.playRound.presentMystery.part2.start'
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
                      actions: [
                        'incrementScore',
                        'clearErrorMessage'
                      ]
                    },
                    onError: {
                      target: "start",
                      actions: 'setErrorMessage'
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
                      wordHistory: context.wordHistory,
                      tagWord: event.tagWord
                    }),
                    onDone: {
                      target: '#playing.getMysteryFromTag',
                      actions: [
                        'incrementScore',
                        'updateTagWord',
                        'addTagWord',
                        'clearErrorMessage'
                      ]
                    },
                    onError: {
                      target: "start",
                      actions: 'setErrorMessage'
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
            assign({ timer: 30 }),
            'clearErrorMessage'
          ]
        },
        onError: {
          target: 'endGame',
          actions: 'setErrorMessage'
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
            tagDefinitions: [],
            wordHistory: [],
            errorMessage: ""
          })
        }
      }
    }
  }
});