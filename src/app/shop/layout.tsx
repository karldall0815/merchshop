import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

// Shop is open to every authenticated role — including agentur and admin
// who place internal orders alongside the regular requesters.
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <div className="mx-auto max-w-5xl p-6">{children}</div>;
}
