import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/settings", () => ({ getSetting: vi.fn() }));
vi.mock("resend", () => ({
  Resend: function () {
    return {
      emails: { send: vi.fn().mockResolvedValue({ data: { id: "x" }, error: null }) },
    };
  },
}));
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail: vi.fn().mockResolvedValue({ messageId: "x" }) })),
  },
}));

import { sendMail } from "./mailer";
import { getSetting } from "@/lib/settings";
const get = getSetting as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => get.mockReset());

describe("sendMail", () => {
  it("throws when mode is unset / later", async () => {
    get.mockResolvedValue("later");
    await expect(sendMail({ to: "x@example.test", subject: "s", text: "t" })).rejects.toThrow(
      /nicht konfiguriert/,
    );
  });

  it("sends via resend when mode=resend", async () => {
    get.mockImplementation(async (key: string) => {
      const m: Record<string, string> = {
        "email.mode": "resend",
        "email.from": "noreply@example.test",
        "email.apiKey": "re_test",
      };
      return m[key] ?? null;
    });
    await sendMail({ to: "a@example.test", subject: "s", text: "t" });
    // The mocked Resend.send returned ok, so no throw = pass
  });

  it("sends via SMTP when mode=smtp", async () => {
    get.mockImplementation(async (key: string) => {
      const m: Record<string, string> = {
        "email.mode": "smtp",
        "email.from": "noreply@example.test",
        "email.host": "mail.example.test",
        "email.port": "587",
        "email.secure": "false",
      };
      return m[key] ?? null;
    });
    await sendMail({ to: "a@example.test", subject: "s", text: "t" });
  });
});
