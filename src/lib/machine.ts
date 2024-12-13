import { setup, assign, createMachine } from "xstate";

export const machine = setup({
  types: {
    context: {} as {
      error: string;
      score: number;
      multiplier: number;
      mysteryWord: { kana: string; definitions: string[] };
      wordHistory: string[];
    },
    events: {} as { type: "submit" },
  },
  actions: {
    clearError: assign({
      error: ""
    }),
    updateMysteryWord: assign({
      // ...
    }),
    addMystery: assign({
      // ...
    }),
    addTagWord: assign({
      // ...
    }),
    setFetchError: assign({
      // ...
    }),
    setDefError: assign({
      // ...
    }),
    setTagError: assign({
      // ...
    }),
    incrementScore: assign({
      // ...
    }),
    decrementMultiplier: assign({
      // ...
    }),
  },
  actors: {
    fetchWord: createMachine({
      /* ... */
    }),
    verifyDef: createMachine({
      /* ... */
    }),
    verifyTagWord: createMachine({
      /* ... */
    }),
  },
}).createMachine({
  context: {
    error: "",
    score: 0,
    multiplier: 5,
    mysteryWord: { kana: "", definitions: [] },
    wordHistory: [],
  },
  id: "playing",
  initial: "start",
  states: {
    start: {
      always: {
        target: "getMystery",
      },
    },
    getMystery: {
      entry: {
        type: "clearError",
      },
      invoke: {
        id: "fetchWord",
        input: {},
        onDone: {
          target: "presentMystery",
          actions: [
            {
              type: "updateMysteryWord",
            },
            {
              type: "addMystery",
            },
          ],
        },
        onError: {
          target: "endGame",
          actions: {
            type: "setFetchError",
          },
        },
        src: "fetchWord",
      },
    },
    presentMystery: {
      initial: "p1",
      after: {
        "5000": {
          target: "presentMystery",
          actions: {
            type: "decrementMultiplier",
          },
        },
        "30000": {
          target: "endGame",
        },
      },
      states: {
        p1: {
          on: {
            submit: {
              target: "definitionCheck",
            },
          },
        },
        definitionCheck: {
          invoke: {
            id: "verifyDef",
            input: {},
            onDone: {
              target: "p2",
              actions: {
                type: "incrementScore",
              },
            },
            onError: {
              target: "p1",
              actions: {
                type: "setDefError",
              },
            },
            src: "verifyDef",
          },
        },
        p2: {
          on: {
            submit: {
              target: "tagWordCheck",
            },
          },
        },
        tagWordCheck: {
          invoke: {
            id: "verifyTagWord",
            input: {},
            onDone: {
              target: "#playing.getMystery",
              actions: [
                {
                  type: "incrementScore",
                },
                {
                  type: "addTagWord",
                },
              ],
            },
            onError: {
              target: "p2",
              actions: {
                type: "setTagError",
              },
            },
            src: "verifyTagWord",
          },
        },
      },
    },
    endGame: {
      type: "final",
    },
  },
});