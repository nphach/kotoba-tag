import { setup, assign } from "xstate";

export const machine = setup({
  types: {
    context: {} as {
      score: number;
      "mystery word": string;
      "player input": string;
    },
    events: {} as { type: "submit" } | { type: "key press" },
  },
  actions: {
    "update mystery word": assign({
      // ...
    }),
    "clear player input": assign({
      // ...
    }),
    "increment score": assign({
      // ...
    }),
    "update player input": assign({
      // ...
    }),
  },
  actors: {
    "fetch word from database": createMachine({
      /* ... */
    }),
    "verify definition": createMachine({
      /* ... */
    }),
    "verify tag word": createMachine({
      /* ... */
    }),
  },
}).createMachine({
  context: {
    score: 0,
    "mystery word": "",
    "player input": "",
  },
  id: "playing",
  initial: "get mystery word",
  states: {
    "get mystery word": {
      invoke: {
        id: "fetch word from database",
        input: {},
        onDone: {
          target: "present mystery word",
        },
        onError: {
          target: "end game",
        },
        src: "fetch word from database",
      },
    },
    "present mystery word": {
      initial: "part 1",
      after: {
        "30000": {
          target: "end game",
        },
      },
      entry: {
        type: "update mystery word",
      },
      states: {
        "part 1": {
          on: {
            submit: {
              target: "verify definition",
            },
            "key press": {
              target: "part 1",
              actions: {
                type: "update player input",
              },
            },
          },
        },
        "verify definition": {
          exit: {
            type: "clear player input",
          },
          invoke: {
            id: "verify definition",
            input: {},
            onDone: {
              target: "part 2",
              actions: {
                type: "increment score",
              },
            },
            onError: {
              target: "part 1",
            },
            src: "verify definition",
          },
        },
        "part 2": {
          on: {
            submit: {
              target: "verify tag word",
            },
            "key press": {
              target: "part 2",
              actions: {
                type: "update player input",
              },
            },
          },
        },
        "verify tag word": {
          exit: {
            type: "clear player input",
          },
          invoke: {
            id: "verify tag word",
            input: {},
            onDone: {
              target: "#playing.get mystery word",
            },
            onError: {
              target: "part 2",
            },
            src: "verify tag word",
          },
        },
      },
    },
    "end game": {
      type: "final",
    },
  },
});