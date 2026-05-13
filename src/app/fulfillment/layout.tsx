import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

// Fulfillment is the agency's workspace — admin gets it too as a
// catch-all super-role.
export default async function FulfillmentLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "agentur" && user.role !== "admin") redirect("/");
  return <div className="mx-auto max-w-6xl p-6">{children}</div>;
}
