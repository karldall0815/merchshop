import { db } from "@/lib/db";
import { currentStock } from "./stock";

export type LowStockItem = {
  id: string;
  name: string;
  minStock: number;
  current: number;
};

export async function findLowStockProducts(): Promise<LowStockItem[]> {
  const products = await db.product.findMany({
    where: { active: true },
    select: { id: true, name: true, minStock: true },
  });
  const out: LowStockItem[] = [];
  for (const p of products) {
    if (p.minStock <= 0) continue;
    const current = await currentStock({ productId: p.id });
    if (current < p.minStock) out.push({ id: p.id, name: p.name, minStock: p.minStock, current });
  }
  return out;
}

import { sendMail } from "@/lib/mailer";

export async function notifyAdmins(
  low: LowStockItem[],
): Promise<{ delivered: number; recipients: string[]; skipped?: string }> {
  if (low.length === 0) return { delivered: 0, recipients: [] };
  // Recipients: every active admin user with a valid email.
  // Local import to keep the existing top-of-file imports tidy.
  const { db: database } = await import("@/lib/db");
  const admins = await database.user.findMany({
    where: { role: "admin", active: true },
    select: { email: true },
  });
  const recipients = admins.map((a) => a.email).filter(Boolean) as string[];
  if (recipients.length === 0) return { delivered: 0, recipients: [] };
  const lines = low.map(
    (p) => `• ${p.name} (${p.id}): ${p.current} / Mindestbestand ${p.minStock}`,
  );
  try {
    await sendMail({
      to: recipients,
      subject: "MerchShop: Mindestbestand unterschritten",
      text: [
        "Folgende Artikel haben den Mindestbestand unterschritten:",
        "",
        ...lines,
        "",
        "Bitte zeitnah nachbestellen.",
      ].join("\n"),
    });
  } catch (e) {
    // Mail config can lag actual operation — the wizard ships with mode=later
    // and admins fill SMTP later. Surface as `skipped` so the cron job stays
    // green instead of hammering its retry budget every 12h.
    const msg = e instanceof Error ? e.message : "mail failed";
    console.warn(`[low-stock] notifyAdmins skipped: ${msg}`);
    return { delivered: 0, recipients, skipped: msg };
  }
  return { delivered: recipients.length, recipients };
}
