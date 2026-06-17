import { assign, fromPromise, setup } from "xstate";
import { ensureModelReady } from "./api.ts";
import { GameCompleteError, getErrorMessage } from "./errors.ts";
import { getSettings } from "./settings.ts";
import { vocabStore } from "./data-store.ts";
import { GameContext, Hiragana, initialGameWord } from "./types.ts";

function createFreshContext(): GameContext {
  return {
    score: 0,
    multiplier: 5,
    timer: getSettings().timerSeconds,
    mysteryWord: initialGameWord,
    tagWord: "" as Hiragana,
    tagDefinitions: [],
    wordHistory: [],
    errorMessage: "",
    toast: null,
    wordsPlayed: 0,
    correctDefinitions: 0,
    endReason: null,
    countdown: 0,
  };
}

export const machine = setup({
  types: {
    context: {} as GameContext,
  },
  actions: {
    // update current Mystery Word with fetched word from fetchWord/ fetchWordFromTag
    updateMysteryWord: assign({
      mysteryWord: ({ event }) => {
        return event.output;
      },
    }),

    // update most recent Tag Word and definitions from submission
    updateTagWord: assign({
      tagWord: ({ event }) => {
        return event.output.tagWord;
      },
      tagDefinitions: ({ event }) => {
        return event.output.defs;
      },
    }),

    // add current Mystery Word to wordHistory once it has been revealed
    addMystery: assign({
      wordHistory: ({ context }) => {
        const { kana, definitions } = context.mysteryWord;
        if (!kana) return context.wordHistory;
        if (context.wordHistory.some((entry) => entry.kana === kana)) {
          return context.wordHistory;
        }
        return [{ kana, definitions }, ...context.wordHistory];
      },
    }),

    // add valid Tag Word to wordHistory
    addTagWord: assign({
      wordHistory: ({ context, event }) => [
        {
          kana: event.output.tagWord,
          definitions: event.output.defs,
        },
        ...context.wordHistory,
      ],
    }),

    incrementScore: assign({
      score: ({ context }) => context.score + 10 * context.multiplier,
    }),

    addScoreBonus: assign({
      score: ({ context }) => context.score * 10,
    }),

    decrementMultiplier: assign({
      multiplier: ({ context }) =>
        context.multiplier > 1 ? context.multiplier - 1 : 1,
    }),

    decrementTimer: assign({
      timer: ({ context }) => Math.max(0, context.timer - 1),
    }),

    incrementWordsPlayed: assign({
      wordsPlayed: ({ context }) => (context.wordsPlayed ?? 0) + 1,
    }),

    incrementCorrectDefinitions: assign({
      correctDefinitions: ({ context }) =>
        (context.correctDefinitions ?? 0) + 1,
    }),

    setEndReasonTimeout: assign({
      endReason: () => "timeout" as const,
    }),

    setEndReasonError: assign({
      endReason: () => "error" as const,
    }),

    setErrorMessage: assign({
      errorMessage: ({ event }) =>
        getErrorMessage(event.error, "something went wrong — please try again"),
    }),

    clearErrorMessage: assign({
      errorMessage: () => "",
    }),

    setPlayErrorToast: assign({
      toast: ({ event }) => ({
        message: getErrorMessage(
          event.error,
          "something went wrong — please try again",
        ),
        variant: "error",
      }),
    }),

    setSuccessToast: assign({
      toast: ({ context }) => ({
        message: `+${10 * context.multiplier} points`,
        variant: "success",
      }),
    }),

    setSkippedToast: assign({
      toast: {
        message: "skipped",
        variant: "neutral",
      },
    }),

    clearToast: assign({
      toast: () => null,
    }),

    applySettings: assign({
      timer: () => getSettings().timerSeconds,
    }),

    resetGameContext: assign(() => createFreshContext()),
  },
  delays: {
    ROUND_TIMER: ({ context }) => context.timer * 1000,
  },
  guards: {
    isCompleteError: ({ event }) => {
      return event.error instanceof GameCompleteError;
    },
  },
  actors: {
    warmupModel: fromPromise(async () => {
      await ensureModelReady();
    }),

    // fetch a random word from VocabStore
    fetchWord: fromPromise(async () => {
      const word = vocabStore.getRandomWord();

      if (!word) {
        throw new GameCompleteError();
      }

      const wordData = {
        kana: word.kana,
        kanji: word.kanji,
        vocabId: word.vocabId,
        definitions: word.definitions,
      };

      return wordData;
    }),

    // fetch a random word for VocabStore based on the given tagWord and wordHistory
    fetchWordFromTag: fromPromise(
      async ({
        input,
      }: {
        input: { wordHistory: GameContext["wordHistory"]; tagWord: Hiragana };
      }) => {
        const word = vocabStore.getRandomWord(input.wordHistory, input.tagWord);
        if (!word) {
          throw new GameCompleteError();
        }

        return word;
      },
    ),

    verifyDef: fromPromise(
      async ({
        input,
      }: {
        input: { mysteryWord: GameContext["mysteryWord"]; definition: string };
      }) => {
        return vocabStore.validateDefinition(
          input.mysteryWord,
          input.definition,
        );
      },
    ),

    verifyTagWord: fromPromise(
      async ({
        input,
      }: {
        input: {
          mysteryWord: GameContext["mysteryWord"];
          wordHistory: GameContext["wordHistory"];
          tagWord: Hiragana;
        };
      }) => {
        return vocabStore.validateTag(
          input.mysteryWord,
          input.wordHistory,
          input.tagWord,
        );
      },
    ),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAcA2BDAngSwHZQDpsJUwBiAZQBUBBAJSoG0AGAXURQHtZsAXbTrg4gAHogDsAVgBMBAGwBGaZPHNJc6QA4ALAoUAaEJkTbmATgIBmSwuabL08Y7UBfF4bRY8hGLwCymLC8YABOmGQQgmBEuABunADW0Z44+AS+AUGhmAh48QDG6PyCLKylwsjcfAJCSKKIZnLi8uJm2vZOCnLaNobGCNpOBJLa0krMauKaI+JuHhipPmD+gcFhZKEhnCEEnrwAZtsAtrsL3unLmWs5eZyFxbil5XWVPA-CYgiWms3icj9tZgKMwOSQ-PqIGTNBxaORmTSObTaMySOYgFLnFJ0TgAV1wEDIIiCRWi6H2awAFJYJhMAJRkDFpLG4-HPLhvGofRCWSQWMytTTmNrSZR6cQQhCaJQEAUihSaaYqBxoxmEZl4iC7EJwMC4FZZMK7dAhXgKAjEk2UACqACE-ABJJhsCpVd51T5yMFWME-SRqQVNCVKQYEeU8uziBSSJRKFVnJkLbEarU6vVXbJGk1mi28SgAaXtAAU2ejXZz3YhNHJmKHJCpdJZBj0zAYjIg9EirN8pOo5JY5Bo5HGvAmsEn8SnYLr9ddM6aCBAwPs8NVBABhAAWYHyCQiURi8SSBFioWw+0wABElyXXqvaqBPrYugQRQrX5HGtYg9JG6GbNoND+ZgpmkYdFlOMcWU1ZBtSnNNVgzZBjXnRdl1wO9N23XdNm2CCDmOY9T3PK99hvMtBC5BApjkAhTCcNQI3EfszCDYFZGsX1e37QcwMxRMoMnad00NJCTVkHNrTtR0yI5CiKwQJQvXEJwQXacxLCmcU2wU6RRgIKszGUVpbEMqVeNHTBx2g2ChIQkTkNkXh0CgAB1bYIEwnc91waJbiPE8QjPTAqGctyQggGS70ouFZAUKZkUjBRtD9MYg3UGtgImFQRmrcQAPMtV+OTGDUxnRCHIIJzXPczzsJCLYdj2Q4QhOAKgpC6rwsit0H3bb5LGGak9EM1SwS0-olGpfS4TDTQUQcDQCogyyBKOHFUH4NBsFCSrsB3bxCWJYICDJSk-TpBl40KyDkzWjbsC2nb+H2-BuvLXqFP7M0RR6HRmB5UwFQlQULA0CYQU6UZY3cdEruWqzdqOJ69oSA6iSc47TtCClbAu1V4YE-gkZ2Z7Ude50XnI+96klBQBupRs9C+sNJGB8x5GkcGNLGKHQJh-GMjszAADEtiODrvN8uJEmifZlnyDcwogUXOHF5y3rkj6f20YZkWYJprH-OtLFY59hvhdSpRbJbBYNEWxYlnDGowfCWoIOXeAVpWVbVqANepz5DMG3TqzUn9QQlfkzT+b55ThaMeT5+YR0IXUIAAcXQJGyDoABRah6CddhKdkgPEEcAbdHBn9JGpdRWe0pFmk5lQdHaVQ2lmfm4fyVW0GWcg84Lhh-coumLCRRpQ5Gf7qU0CUm5fSYIZREFPTcGHcE4Rd4BeK6XVLyjO1rkPmDD6xlG0CVqVkfWzCBKYQT0OsluIUgD6i+TPR1+xbGS5SwRNFbP0b4FguiOHsDyKQjgbaXCFh-HqNMBw60HE0MEgw-SBkblIUM-wAJghShpVE3cU4Ew1Ag96NM-SaAIBDOK5gRgOC6BKPskhaILXUv2AMmglrqgnCVOCZUwgUM1lQ9QtCNL0JRD0MYcggwTBoY2WuT8HDUnaLwoq-CbLwTtnOBQIiy4IFDhIyMHdGGyNYv9GUk8nAaEcH8YhydwJ8OsqVYSmA9HmiciaAx0UhhJSBF0RseVLAtlYvffS3YkpSmoRpDRN0tFuKFp41CK4Hi1V8V-GQJipHmOYdpOm0ofh5RkMxdu8SVrFW0UIjxoleDSEyR9YaNZPSej9JpXKJsCkMPYS2HkDgAJKCTrDUhLjBI6NnHU8S3jeCNJpkoIYdZRjIl0tIJ+rEETB2KdGGabQKkIwEbZXRUzKqhRqluHcczHw-hoa0uswEfidKDGorsDZAl0QUPs1a61NqoG2iEK57Y4o0X7Gsj8eVDJOAlE4WQMhWFRjWR2L5t0fkPT+cjF6UBAU6V0lYDQUd+QrKhdpHQsKraOBBFbf6yKJxE1CNi-FwxAlymDBS6FIphjSHhTIFsSUaWajpSTFG3gGXKSZXoFlqzWjAxsAQcwA4IWmE5vCWBNSfYdWxWKOV6hnCOBkMwLQ0ggx0VDECaMQJGbJTMEtNOmckbYq4dY0pExNLtBBNC4C8gFRmp+IMR+S1e5HH7sETVuhQw-jsNSNQjgfrAwHFYA1YJuJIg3i4IAA */
  id: "playing",
  initial: "idle",
  context: createFreshContext(),
  states: {
    idle: {
      on: {
        START: {
          target: "prepareGame",
          actions: ["clearErrorMessage", "clearToast", "applySettings"],
        },
      },
    },

    prepareGame: {
      initial: "warmingUp",
      states: {
        warmingUp: {
          invoke: {
            src: "warmupModel",
            onDone: {
              target: "countdown",
              actions: ["clearErrorMessage", "clearToast"],
            },
            onError: {
              target: "#playing.idle",
              actions: "setErrorMessage",
            },
          },
        },
        countdown: {
          initial: "three",
          states: {
            three: {
              entry: assign({ countdown: 3 }),
              after: { 1000: "two" },
            },
            two: {
              entry: assign({ countdown: 2 }),
              after: { 1000: "one" },
            },
            one: {
              entry: assign({ countdown: 1 }),
              after: { 1000: "go" },
            },
            go: {
              entry: assign({ countdown: 0 }),
              after: { 600: "#playing.getMystery" },
            },
          },
        },
      },
    },

    getMystery: {
      invoke: {
        src: "fetchWord",
        onDone: {
          target: "playRound",
          actions: [
            "updateMysteryWord",
            "incrementWordsPlayed",
            "clearErrorMessage",
            "clearToast",
          ],
        },
        onError: [
          {
            guard: "isCompleteError",
            target: "complete",
            actions: "addScoreBonus",
          },
          {
            target: "endGame",
            actions: ["setErrorMessage", "setEndReasonError"],
          },
        ],
      },
    },

    playRound: {
      type: "parallel",
      after: {
        ROUND_TIMER: {
          target: "endGame",
          actions: "setEndReasonTimeout",
        },
      },
      states: {
        presentMystery: {
          initial: "part1",
          states: {
            part1: {
              initial: "start",
              states: {
                start: {
                  on: {
                    SUBMIT: {
                      target: "definitionCheck",
                    },
                    SKIP: {
                      target: "#playing.playRound.presentMystery.part2.start",
                      actions: ["addMystery", "setSkippedToast"],
                    },
                  },
                },
                definitionCheck: {
                  invoke: {
                    id: "verifyDef",
                    src: "verifyDef",
                    input: ({ context, event }) => ({
                      mysteryWord: context.mysteryWord,
                      definition: event.definition,
                    }),
                    onDone: {
                      target: "#playing.playRound.presentMystery.part2.start",
                      actions: [
                        "addMystery",
                        "incrementScore",
                        "incrementCorrectDefinitions",
                        "setSuccessToast",
                        "clearErrorMessage",
                      ],
                    },
                    onError: {
                      target: "start",
                      actions: "setPlayErrorToast",
                    },
                  },
                },
              },
            },
            part2: {
              states: {
                start: {
                  on: {
                    SUBMIT: {
                      target: "tagWordCheck",
                    },
                  },
                },
                tagWordCheck: {
                  invoke: {
                    id: "verifyTagWord",
                    input: ({ context, event }) => ({
                      mysteryWord: context.mysteryWord,
                      wordHistory: context.wordHistory,
                      tagWord: event.tagWord,
                    }),
                    onDone: {
                      target: "#playing.getMysteryFromTag",
                      actions: [
                        "incrementScore",
                        "updateTagWord",
                        "addTagWord",
                        "setSuccessToast",
                        "clearErrorMessage",
                      ],
                    },
                    onError: {
                      target: "start",
                      actions: "setPlayErrorToast",
                    },
                    src: "verifyTagWord",
                  },
                },
              },

              initial: "start",
            },
          },
        },
        multiplier: {
          initial: "ticking",
          states: {
            ticking: {
              after: {
                "5000": {
                  target: "ticking",
                  actions: "decrementMultiplier",
                  reenter: true,
                },
              },
            },
          },
        },
        timer: {
          initial: "ticking",
          states: {
            ticking: {
              after: {
                "1000": {
                  target: "ticking",
                  actions: "decrementTimer",
                  reenter: true,
                },
              },
            },
          },
        },
      },
    },

    getMysteryFromTag: {
      invoke: {
        id: "fetchWordFromTag",
        input: ({ context }) => ({
          wordHistory: context.wordHistory,
          tagWord: context.tagWord,
        }),
        onDone: {
          target: "playRound",
          actions: [
            "updateMysteryWord",
            "incrementWordsPlayed",
            assign({ multiplier: 5 }),
            "applySettings",
            "clearErrorMessage",
            "clearToast",
          ],
        },
        onError: [
          {
            guard: "isCompleteError",
            target: "complete",
            actions: "addScoreBonus",
          },
          {
            target: "endGame",
            actions: ["setErrorMessage", "setEndReasonError"],
          },
        ],
        src: "fetchWordFromTag",
      },
    },

    endGame: {
      entry: "addMystery",
      on: {
        RETURN_HOME: {
          target: "idle",
          actions: "resetGameContext",
        },
        RESTART: {
          target: "prepareGame",
          actions: ["resetGameContext", "applySettings"],
        },
      },
    },

    complete: {
      entry: "addMystery",
      on: {
        RETURN_HOME: {
          target: "idle",
          actions: "resetGameContext",
        },
        RESTART: {
          target: "prepareGame",
          actions: ["resetGameContext", "applySettings"],
        },
      },
    },
  },
});
