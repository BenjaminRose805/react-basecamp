import { describe, it, expect } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    const result = cn("foo", "bar");
    expect(result).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const isHidden = false;
    const isVisible = true;
    const result = cn("base", isHidden && "hidden", isVisible && "visible");
    expect(result).toBe("base visible");
  });

  it("merges tailwind classes correctly", () => {
    const result = cn("px-2 py-1", "px-4");
    expect(result).toBe("py-1 px-4");
  });

  it("handles undefined and null values", () => {
    const result = cn("base", undefined, null, "end");
    expect(result).toBe("base end");
  });
});
