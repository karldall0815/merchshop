import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

// Only approver + admin reach the approval queue. Requesters/agentur are
// bounced to home — they have their own dashboards.
export default async function ApprovalsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "approver" && user.role !== "admin") redirect("/");
  return <div className="mx-auto max-w-4xl p-6">{children}</div>;
}
