import { db } from "@/lib/db";
import { sendMail } from "@/lib/mailer";

export async function notifyAdminsOfSupportReport(reportId: string): Promise<void> {
  const report = await db.supportReport.findUnique({
    where: { id: reportId },
    include: { reporter: { select: { name: true, email: true } } },
  });
  if (!report) return;

  const admins = await db.user.findMany({
    where: { role: "admin", active: true },
    select: { email: true, name: true },
  });
  if (admins.length === 0) return;

  const subject = `[MerchShop Support] Fehlerbericht #${report.id.slice(0, 8)}`;
  const text = [
    `Neuer Fehlerbericht aus MerchShop:`,
    ``,
    `Von:   ${report.reporter?.name ?? "Unbekannt"} (${report.reporter?.email ?? "kein Login"})`,
    `URL:   ${report.url ?? "—"}`,
    `Was:   ${report.userMessage ?? "—"}`,
    report.errorMessage ? `Kontext: ${report.errorMessage}` : "",
    ``,
    `Detail im Admin: ${process.env.NEXTAUTH_URL ?? ""}/admin/support/${report.id}`,
  ]
    .filter(Boolean)
    .join("\n");

  await Promise.allSettled(
    admins.map((a) =>
      sendMail({ to: a.email, subject, text }).catch(() => {})
    )
  );
}
