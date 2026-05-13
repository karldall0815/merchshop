import { describe, expect, it } from "vitest";
import { ERROR_LABELS, labelForCode } from "./error-messages";

const ALL_CODES = [
  "VALIDATION_ERROR",
  "INSUFFICIENT_STOCK",
  "INVALID_STATE_TRANSITION",
  "PERMISSION_DENIED",
  "NOT_FOUND",
  "CATEGORY_CHANGE_REQUIRES_CONFIRM",
  "CATEGORY_SCHEMA_CHANGE_REQUIRES_CONFIRM",
  "INTERNAL_ERROR",
] as const;

describe("ERROR_LABELS", () => {
  it("has a German label for every ErrorCode", () => {
    for (const c of ALL_CODES) {
      expect(ERROR_LABELS[c]).toBeTruthy();
      expect(typeof ERROR_LABELS[c]).toBe("string");
    }
  });

  it("labels are not English placeholders", () => {
    for (const c of ALL_CODES) {
      expect(ERROR_LABELS[c]).not.toMatch(/^[A-Z_]+$/);
      expect(ERROR_LABELS[c].toLowerCase()).not.toContain("error");
    }
  });
});

describe("labelForCode", () => {
  it("falls back to a generic German label for unknown code", () => {
    const out = labelForCode("UNKNOWN_DOES_NOT_EXIST" as never);
    expect(out).toMatch(/Fehler/i);
  });
});
