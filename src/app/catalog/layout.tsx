import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export default async function CatalogLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "agentur" && user.role !== "admin") redirect("/");
  return <div className="mx-auto max-w-5xl p-6">{children}</div>;
}
