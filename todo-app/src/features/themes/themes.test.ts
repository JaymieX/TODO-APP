import { describe, expect, it } from "vitest";
import { isThemeId } from "./themes";

describe("isThemeId", () => {
  it("accepts registered theme ids and rejects unknown saved values", () => {
    expect(isThemeId("midnight-blue")).toBe(true);
    expect(isThemeId("jirai-kei")).toBe(true);
    expect(isThemeId("unknown")).toBe(false);
    expect(isThemeId(null)).toBe(false);
  });
});
