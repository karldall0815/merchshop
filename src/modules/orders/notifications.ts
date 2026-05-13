import { db } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { getSetting } from "@/lib/settings";

// Best-effort delivery: when SMTP/Resend isn't configured yet (setup
// wizard ships with email.mode=later), log a warning and move on. The
// caller's transition has already been written by the time this fires;
// failing the workflow because of an unconfigured mailer would block
// real operations.
async function tryMail(args: {
  to: string[];
  subject: string;
  text: string;
}): Promise<void> {
  if (args.to.length === 0) return;
  try {
    await sendMail(args);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "mail failed";
    console.warn(`[orders] mail skipped: ${msg}`);
  }
}

async function appUrl(): Promise<string> {
  const fromSetting = await getSetting("app.url", { envVar: "APP_URL" });
  return fromSetting?.replace(/\/$/, "") ?? "";
}

// pending: tell the approvers there's something to look at.
export async function notifyOrderSubmitted(orderId: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      requester: { select: { name: true, email: true } },
      items: true,
    },
  });
  if (!order) return;
  const approvers = await db.user.findMany({
    where: { role: { in: ["approver", "admin"] }, active: true },
    select: { email: true },
  });
  const recipients = approvers.map((a) => a.email).filter(Boolean);
  const lines = order.items.map(
    (it) =>
      `• ${it.snapshotName}${it.snapshotVariant ? ` (${it.snapshotVariant})` : ""} – ${it.quantity}×`,
  );
  const link = (await appUrl()) + `/approvals/${order.id}`;
  await tryMail({
    to: recipients,
    subject: `MerchShop: Neue Bestellung ${order.orderNumber ?? ""} wartet auf Freigabe`,
    text: [
      `Bestellung von ${order.requester.name} (${order.requester.email}):`,
      "",
      ...lines,
      "",
      `Anlass: ${order.occasion ?? "—"}`,
      `Kostenstelle: ${order.costCenter ?? "—"}`,
      `Wunschtermin: ${order.desiredDate ? new Date(order.desiredDate).toLocaleDateString("de-DE") : "—"}`,
      "",
      link ? `Freigabe-Link: ${link}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

// approved/rejected: tell the requester the outcome.
export async function notifyOrderDecided(orderId: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      requester: { select: { name: true, email: true } },
      approver: { select: { name: true } },
    },
  });
  if (!order || !order.requester.email) return;
  if (order.status !== "approved" && order.status !== "rejected") return;
  const isApproved = order.status === "approved";
  const link = (await appUrl()) + `/orders/${order.id}`;
  const subject = isApproved
    ? `MerchShop: Bestellung ${order.orderNumber ?? ""} freigegeben`
    : `MerchShop: Bestellung ${order.orderNumber ?? ""} abgelehnt`;
  const text = [
    `Hallo ${order.requester.name},`,
    "",
    isApproved
      ? `deine Bestellung wurde freigegeben${order.approver ? ` von ${order.approver.name}` : ""}.`
      : `deine Bestellung wurde abgelehnt${order.approver ? ` von ${order.approver.name}` : ""}.`,
    "",
    !isApproved && order.rejectionReason ? `Begründung: ${order.rejectionReason}` : "",
    "",
    link ? `Details: ${link}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  await tryMail({ to: [order.requester.email], subject, text });
}

// shipped: tell the requester it's on the way + tracking info.
export async function notifyOrderShipped(orderId: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      trackingNumber: true,
      carrier: true,
      requester: { select: { name: true, email: true } },
    },
  });
  if (!order || !order.requester.email) return;
  const link = (await appUrl()) + `/orders/${order.id}`;
  await tryMail({
    to: [order.requester.email],
    subject: `MerchShop: Bestellung ${order.orderNumber ?? ""} ist unterwegs`,
    text: [
      `Hallo ${order.requester.name},`,
      "",
      `deine Bestellung wurde versendet.`,
      order.carrier ? `Carrier: ${order.carrier}` : "",
      order.trackingNumber ? `Tracking: ${order.trackingNumber}` : "",
      "",
      link ? `Details: ${link}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

// delivered: heads-up that the package arrived.
export async function notifyOrderDelivered(orderId: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      requester: { select: { name: true, email: true } },
    },
  });
  if (!order || !order.requester.email) return;
  const link = (await appUrl()) + `/orders/${order.id}`;
  await tryMail({
    to: [order.requester.email],
    subject: `MerchShop: Bestellung ${order.orderNumber ?? ""} zugestellt`,
    text: [
      `Hallo ${order.requester.name},`,
      "",
      `deine Bestellung wurde zugestellt.`,
      "",
      link ? `Details: ${link}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });
}
