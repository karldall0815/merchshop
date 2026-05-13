import { Resend } from "resend";
import nodemailer from "nodemailer";
import { getSetting } from "./settings";

export type SendMailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
};

export async function sendMail(input: SendMailInput): Promise<void> {
  const mode = await getSetting("email.mode");
  if (!mode || mode === "later") {
    throw new Error("E-Mail-Versand ist nicht konfiguriert");
  }
  const from = await getSetting("email.from");
  if (!from) throw new Error("E-Mail-Absender (email.from) fehlt");

  if (mode === "resend") {
    const apiKey = await getSetting("email.apiKey", { envVar: "RESEND_API_KEY" });
    if (!apiKey) throw new Error("Resend API-Key fehlt");
    const r = new Resend(apiKey);
    const res = await r.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    if (res.error) throw new Error(res.error.message);
    return;
  }

  if (mode === "smtp") {
    const host = await getSetting("email.host", { envVar: "SMTP_HOST" });
    const portStr = await getSetting("email.port", { envVar: "SMTP_PORT" });
    const user = await getSetting("email.user", { envVar: "SMTP_USER" });
    const pass = await getSetting("email.password", { envVar: "SMTP_PASSWORD" });
    const secure = (await getSetting("email.secure", { envVar: "SMTP_SECURE" })) === "true";
    if (!host || !portStr) throw new Error("SMTP host/port fehlt");
    const transport = nodemailer.createTransport({
      host,
      port: Number(portStr),
      secure,
      auth: user ? { user, pass: pass ?? "" } : undefined,
    });
    await transport.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return;
  }

  throw new Error(`unsupported mail mode: ${mode}`);
}
