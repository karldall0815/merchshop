import { describe, expect, it } from "vitest";
import { hasRole, requireRole } from "./rbac";

describe("rbac", () => {
  it("hasRole returns true for matching role", () => {
    expect(hasRole({ id: "1", email: "a", name: "a", role: "admin" }, ["admin"])).toBe(true);
  });
  it("hasRole returns true if user matches any of the allowed roles", () => {
    expect(hasRole({ id: "1", email: "a", name: "a", role: "agentur" }, ["admin", "agentur"])).toBe(true);
  });
  it("hasRole returns false for null user", () => {
    expect(hasRole(null, ["admin"])).toBe(false);
  });
  it("requireRole throws for disallowed", () => {
    expect(() => requireRole({ id: "1", email: "a", name: "a", role: "requester" }, ["admin"])).toThrow();
  });
});
