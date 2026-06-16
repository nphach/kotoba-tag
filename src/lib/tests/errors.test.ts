import { describe, expect, it } from "vitest";
import { getErrorMessage } from "../errors.ts";

describe("getErrorMessage", () => {
  it("returns the error message from an Error instance", () => {
    expect(getErrorMessage(new Error("model unavailable"))).toBe(
      "model unavailable",
    );
  });

  it("uses the fallback for unknown values", () => {
    expect(getErrorMessage(null)).toBe(
      "something went wrong — please try again",
    );
    expect(getErrorMessage("plain string")).toBe(
      "something went wrong — please try again",
    );
  });

  it("supports a custom fallback", () => {
    expect(getErrorMessage(undefined, "custom fallback")).toBe("custom fallback");
  });
});
