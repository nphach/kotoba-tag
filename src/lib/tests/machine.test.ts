import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createActor, fromPromise } from "xstate";
import { GameCompleteError } from "../errors.ts";
import { machine } from "../machine.ts";
import { GameWord, Hiragana } from "../types.ts";

const mysteryWord: GameWord = {
  vocabId: 1,
  kanji: "猫",
  kana: "ねこ" as Hiragana,
  definitions: ["cat"],
};

const tagWord = "こね" as Hiragana;

const nextWord: GameWord = {
  vocabId: 2,
  kanji: null,
  kana: "こねこ" as Hiragana,
  definitions: ["kitten"],
};

function createTestMachine(
  overrides: Partial<{
    fetchWord: () => Promise<GameWord>;
    fetchWordFromTag: () => Promise<GameWord>;
    verifyDef: (definition: string) => Promise<boolean>;
    verifyTagWord: () => Promise<{ tagWord: Hiragana; defs: string[] }>;
    warmupModel: () => Promise<void>;
  }> = {},
) {
  return machine.provide({
    actors: {
      warmupModel: fromPromise(overrides.warmupModel ?? (async () => {})),
      fetchWord: fromPromise(overrides.fetchWord ?? (async () => mysteryWord)),
      fetchWordFromTag: fromPromise(
        overrides.fetchWordFromTag ?? (async () => nextWord),
      ),
      verifyDef: fromPromise(
        async ({ input }: { input: { definition: string } }) => {
          if (overrides.verifyDef) {
            return overrides.verifyDef(input.definition);
          }
          if (input.definition === "cat") return true;
          throw new Error("that definition doesn't match — try again");
        },
      ),
      verifyTagWord: fromPromise(
        overrides.verifyTagWord ??
          (async () => ({
            tagWord,
            defs: ["kneading"],
          })),
      ),
    },
  });
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

async function waitForState(
  actor: ReturnType<typeof createActor>,
  predicate: (state: ReturnType<typeof actor.getSnapshot>) => boolean,
  maxSteps = 200,
) {
  for (let step = 0; step < maxSteps; step++) {
    if (predicate(actor.getSnapshot())) return;
    await vi.advanceTimersByTimeAsync(50);
    await flushPromises();
  }

  throw new Error(
    `Timed out waiting for state: ${JSON.stringify(actor.getSnapshot().value)}`,
  );
}

async function startPlayRound(actor: ReturnType<typeof createActor>) {
  actor.start();
  actor.send({ type: "START" });
  await flushPromises();
  await waitForState(actor, (state) =>
    state.matches({ playRound: { presentMystery: "part1" } }),
  );
}

describe("game machine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts in idle and resets context on RETURN_HOME", async () => {
    const actor = createActor(createTestMachine());
    await startPlayRound(actor);

    actor.send({ type: "SUBMIT", definition: "cat" });
    await waitForState(actor, (state) =>
      state.matches({ playRound: { presentMystery: "part2" } }),
    );

    expect(actor.getSnapshot().context.score).toBe(50);

    actor.send({ type: "SUBMIT", tagWord });
    await waitForState(actor, (state) =>
      state.matches({ playRound: { presentMystery: "part1" } }),
    );

    actor.send({ type: "SUBMIT", definition: "wrong" });
    await waitForState(actor, (state) =>
      state.matches({
        playRound: { presentMystery: { part1: "start" } },
      }),
    );

    const timerBeforeEnd = actor.getSnapshot().context.timer;
    await vi.advanceTimersByTimeAsync(timerBeforeEnd * 1000 + 100);
    await flushPromises();
    await waitForState(actor, (state) => state.matches("endGame"));
    expect(actor.getSnapshot().context.endReason).toBe("timeout");

    actor.send({ type: "RETURN_HOME" });
    await flushPromises();

    const context = actor.getSnapshot().context;
    expect(actor.getSnapshot().matches("idle")).toBe(true);
    expect(context.score).toBe(0);
    expect(context.multiplier).toBe(5);
    expect(context.wordHistory).toEqual([]);
    expect(context.wordsPlayed).toBe(0);
    expect(context.endReason).toBeNull();
  });

  it("awards score for a correct definition and moves to the tag phase", async () => {
    const actor = createActor(createTestMachine());
    await startPlayRound(actor);

    expect(actor.getSnapshot().context.mysteryWord.kana).toBe("ねこ");
    expect(actor.getSnapshot().context.wordsPlayed).toBe(1);

    actor.send({ type: "SUBMIT", definition: "cat" });
    await waitForState(actor, (state) =>
      state.matches({ playRound: { presentMystery: "part2" } }),
    );

    const context = actor.getSnapshot().context;
    expect(context.score).toBe(50);
    expect(context.correctDefinitions).toBe(1);
    expect(context.wordHistory).toEqual([
      { kana: "ねこ", definitions: ["cat"] },
    ]);
    expect(context.errorMessage).toBe("");
  });

  it("keeps the player on the definition phase after a wrong answer", async () => {
    const actor = createActor(createTestMachine());
    await startPlayRound(actor);

    actor.send({ type: "SUBMIT", definition: "bird" });
    await waitForState(actor, (state) =>
      state.matches({
        playRound: { presentMystery: { part1: "start" } },
      }),
    );

    const context = actor.getSnapshot().context;
    expect(context.score).toBe(0);
    expect(context.correctDefinitions).toBe(0);
    expect(context.wordHistory).toEqual([]);
    expect(context.errorMessage).toBe(
      "that definition doesn't match — try again",
    );
  });

  it("adds the mystery word to history when skipping the definition", async () => {
    const actor = createActor(createTestMachine());
    await startPlayRound(actor);

    actor.send({ type: "SKIP" });
    await waitForState(actor, (state) =>
      state.matches({ playRound: { presentMystery: "part2" } }),
    );

    const context = actor.getSnapshot().context;
    expect(context.score).toBe(0);
    expect(context.correctDefinitions).toBe(0);
    expect(context.wordHistory).toEqual([
      { kana: "ねこ", definitions: ["cat"] },
    ]);
  });

  it("chains a valid tag word into the next mystery word and resets the multiplier", async () => {
    const actor = createActor(createTestMachine());
    await startPlayRound(actor);

    actor.send({ type: "SUBMIT", definition: "cat" });
    await waitForState(actor, (state) =>
      state.matches({ playRound: { presentMystery: "part2" } }),
    );

    await vi.advanceTimersByTimeAsync(5000);
    await flushPromises();
    expect(actor.getSnapshot().context.multiplier).toBe(4);

    actor.send({ type: "SUBMIT", tagWord });
    await waitForState(actor, (state) =>
      state.matches({ playRound: { presentMystery: "part1" } }),
    );

    const context = actor.getSnapshot().context;
    expect(context.score).toBe(90);
    expect(context.multiplier).toBe(5);
    expect(context.mysteryWord.kana).toBe("こねこ");
    expect(context.wordsPlayed).toBe(2);
    expect(context.tagWord).toBe("こね");
    expect(context.tagDefinitions).toEqual(["kneading"]);
    expect(context.wordHistory).toEqual([
      { kana: "こね", definitions: ["kneading"] },
      { kana: "ねこ", definitions: ["cat"] },
    ]);
  });

  it("enters the complete state with a score bonus when the word bank is exhausted", async () => {
    const actor = createActor(
      createTestMachine({
        fetchWordFromTag: async () => {
          throw new GameCompleteError();
        },
      }),
    );
    await startPlayRound(actor);

    actor.send({ type: "SUBMIT", definition: "cat" });
    await waitForState(actor, (state) =>
      state.matches({ playRound: { presentMystery: "part2" } }),
    );

    actor.send({ type: "SUBMIT", tagWord });
    await waitForState(actor, (state) => state.matches("complete"));

    const context = actor.getSnapshot().context;
    expect(context.score).toBe(1000);
    expect(context.wordHistory.some((entry) => entry.kana === "ねこ")).toBe(
      true,
    );
  });

  it("returns to idle when warmup fails", async () => {
    const actor = createActor(
      createTestMachine({
        warmupModel: async () => {
          throw new Error("model failed to load");
        },
      }),
    );

    actor.start();
    actor.send({ type: "START" });
    await flushPromises();
    await waitForState(actor, (state) => state.matches("idle"));

    expect(actor.getSnapshot().context.errorMessage).toBe(
      "model failed to load",
    );
  });

  it("does not duplicate mystery words in history when ending the game", async () => {
    const actor = createActor(createTestMachine());
    await startPlayRound(actor);

    actor.send({ type: "SUBMIT", definition: "cat" });
    await waitForState(actor, (state) =>
      state.matches({ playRound: { presentMystery: "part2" } }),
    );

    const timerBeforeEnd = actor.getSnapshot().context.timer;
    await vi.advanceTimersByTimeAsync(timerBeforeEnd * 1000 + 100);
    await flushPromises();
    await waitForState(actor, (state) => state.matches("endGame"));

    const nekoEntries = actor
      .getSnapshot()
      .context.wordHistory.filter((entry) => entry.kana === "ねこ");
    expect(nekoEntries).toHaveLength(1);
  });
});
