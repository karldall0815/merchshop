import { describe, expect, it } from "vitest";
import { computeNextSku } from "./sku-suggest";

describe("computeNextSku", () => {
  it("returns prefix + 0001 when no matching SKUs exist", () => {
    expect(computeNextSku("ART-", 4, [])).toBe("ART-0001");
  });

  it("ignores SKUs that do not match the prefix", () => {
    expect(computeNextSku("ART-", 4, ["FOO-9999", "BAR-1234"])).toBe("ART-0001");
  });

  it("computes max + 1 across matching SKUs", () => {
    expect(computeNextSku("ART-", 4, ["ART-0001", "ART-0003", "ART-0002"])).toBe("ART-0004");
  });

  it("ignores matching prefix with non-numeric suffix", () => {
    expect(computeNextSku("ART-", 4, ["ART-0001", "ART-foo"])).toBe("ART-0002");
  });

  it("respects padding setting (default 4 → 0001)", () => {
    expect(computeNextSku("ART-", 4, [])).toBe("ART-0001");
    expect(computeNextSku("ART-", 6, [])).toBe("ART-000001");
    expect(computeNextSku("ART-", 1, [])).toBe("ART-1");
  });

  it("works with empty prefix", () => {
    expect(computeNextSku("", 3, ["042", "001", "abc"])).toBe("043");
  });

  it("handles SKUs longer than padding (no truncation)", () => {
    // If an SKU's numeric part is already wider than padding, just use it
    expect(computeNextSku("ART-", 4, ["ART-99999"])).toBe("ART-100000");
  });

  it("ignores SKUs with the prefix but extra characters between prefix and digits", () => {
    expect(computeNextSku("ART-", 4, ["ART-X0001", "ART-0005"])).toBe("ART-0006");
  });
});
