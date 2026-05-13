import nodemailer from "nodemailer";
import { Resend } from "resend";

export type MailTestInput =
  | { mode: "resend"; apiKey: string; from: string; to: string }
  | {
      mode: "smtp";
      host: string; port: number; user?: string; password?: string; secure?: boolean;
      from: string; to: string;
    };

export async function testMail(input: MailTestInput): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (input.mode === "resend") {
      const r = new Resend(input.apiKey);
      const res = await r.emails.send({
        from: input.from, to: input.to,
        subject: "MerchShop — Setup-Test",
        text: "Wenn du diese Nachricht erhältst, ist der E-Mail-Versand korrekt konfiguriert.",
      });
      if (res.error) return { ok: false, error: res.error.message };
      return { ok: true };
    }
    const transport = nodemailer.createTransport({
      host: input.host, port: input.port, secure: input.secure ?? false,
      auth: input.user ? { user: input.user, pass: input.password ?? "" } : undefined,
    });
    await transport.sendMail({
      from: input.from, to: input.to,
      subject: "MerchShop — Setup-Test",
      text: "Wenn du diese Nachricht erhältst, ist der E-Mail-Versand korrekt konfiguriert.",
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
