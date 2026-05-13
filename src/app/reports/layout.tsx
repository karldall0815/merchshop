import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

// Reports are open to all authenticated roles — what they see is
// scoped per-role inside the queries (requester only own orders,
// agentur/approver/admin everything).
export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <div className="mx-auto max-w-5xl p-6">{children}</div>;
}
