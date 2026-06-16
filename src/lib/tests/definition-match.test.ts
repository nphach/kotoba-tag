import { describe, expect, it } from "vitest";
import {
  isExactDefinitionMatch,
  isLocallyAcceptableDefinition,
} from "../definition-match.ts";

describe("isExactDefinitionMatch", () => {
  it("accepts an exact definition", () => {
    expect(isExactDefinitionMatch("cat", ["cat", "feline"])).toBe(true);
  });

  it("normalizes case, articles, and trailing punctuation", () => {
    expect(isExactDefinitionMatch("The Cat.", ["cat"])).toBe(true);
    expect(isExactDefinitionMatch("A dog", ["dog"])).toBe(true);
  });

  it("normalizes hyphens and slashes to spaces", () => {
    expect(isExactDefinitionMatch("ice-cream", ["ice cream"])).toBe(true);
    expect(isExactDefinitionMatch("on/off", ["on off"])).toBe(true);
  });

  it("rejects a non-matching definition", () => {
    expect(isExactDefinitionMatch("bird", ["cat", "dog"])).toBe(false);
  });

  it("rejects empty input", () => {
    expect(isExactDefinitionMatch("", ["cat"])).toBe(false);
    expect(isExactDefinitionMatch("   ", ["cat"])).toBe(false);
  });
});

describe("isLocallyAcceptableDefinition", () => {
  it("accepts close typos within tolerance", () => {
    expect(isLocallyAcceptableDefinition("kittn", ["kitten"])).toBe(true);
    expect(isLocallyAcceptableDefinition("resturant", ["restaurant"])).toBe(
      true,
    );
  });

  it("accepts token-order permutations for multi-word definitions", () => {
    expect(
      isLocallyAcceptableDefinition("hot green tea", ["green tea hot"]),
    ).toBe(true);
  });

  it("accepts compact phrase matches without spaces", () => {
    expect(
      isLocallyAcceptableDefinition("icecream", ["ice cream"]),
    ).toBe(true);
  });

  it("rejects definitions that are too different", () => {
    expect(isLocallyAcceptableDefinition("airplane", ["cat"])).toBe(false);
    expect(isLocallyAcceptableDefinition("x", ["cat"])).toBe(false);
  });
});
