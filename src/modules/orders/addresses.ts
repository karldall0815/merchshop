"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/modules/auth/session";

export type AddressInput = {
  label: string;
  recipient: string;
  street: string;
  zip: string;
  city: string;
  country?: string;
};

function trimmed(input: AddressInput): AddressInput {
  return {
    label: input.label.trim(),
    recipient: input.recipient.trim(),
    street: input.street.trim(),
    zip: input.zip.trim(),
    city: input.city.trim(),
    country: input.country?.trim() || "DE",
  };
}

export async function listAddressFavorites() {
  const user = await getCurrentUser();
  if (!user) return [];
  return db.addressFavorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
}

export async function createAddressFavorite(input: AddressInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthenticated");
  const data = trimmed(input);
  for (const k of ["label", "recipient", "street", "zip", "city"] as const) {
    if (!data[k]) throw new Error(`${k} darf nicht leer sein`);
  }
  const created = await db.addressFavorite.create({
    data: {
      userId: user.id,
      label: data.label,
      recipient: data.recipient,
      street: data.street,
      zip: data.zip,
      city: data.city,
      country: data.country!,
    },
  });
  revalidatePath("/checkout");
  return created;
}

export async function deleteAddressFavorite(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthenticated");
  // Only delete favorites owned by the current user; silently no-op
  // otherwise so the UI doesn't need to differentiate "missing" from
  // "forbidden" (defense in depth — the route guard already filters).
  await db.addressFavorite.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/checkout");
}
