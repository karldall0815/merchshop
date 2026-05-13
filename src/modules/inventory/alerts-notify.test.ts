import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    user: { findMany: vi.fn() },
    product: { findMany: vi.fn() },
    stockMovement: { aggregate: vi.fn() },
  },
}));
vi.mock("@/lib/mailer", () => ({ sendMail: vi.fn().mockResolvedValue(undefined) }));

import { notifyAdmins } from "./alerts";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
const m = db as unknown as { user: { findMany: ReturnType<typeof vi.fn> } };
const send = sendMail as unknown as ReturnType<typeof vi.fn>;

describe("notifyAdmins", () => {
  it("does nothing when list is empty", async () => {
    const r = await notifyAdmins([]);
    expect(r).toEqual({ delivered: 0, recipients: [] });
    expect(send).not.toHaveBeenCalled();
  });

  it("sends one mail to all active admins when items are present", async () => {
    m.user.findMany.mockResolvedValue([
      { email: "a@example.test" },
      { email: "b@example.test" },
    ]);
    const r = await notifyAdmins([{ id: "p1", name: "Tasse", current: 1, minStock: 5 }]);
    expect(r.delivered).toBe(2);
    expect(send).toHaveBeenCalled();
    const arg = send.mock.calls.at(-1)![0];
    expect(arg.to).toEqual(["a@example.test", "b@example.test"]);
    expect(arg.subject).toMatch(/Mindestbestand/);
  });

  it("noops when no admin users exist", async () => {
    send.mockClear();
    m.user.findMany.mockResolvedValue([]);
    const r = await notifyAdmins([{ id: "p1", name: "x", current: 1, minStock: 5 }]);
    expect(r).toEqual({ delivered: 0, recipients: [] });
    expect(send).not.toHaveBeenCalled();
  });
});
