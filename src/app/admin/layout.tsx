import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

// Admin-only area. Approver/agentur/requester are bounced home.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");
  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <nav className="flex gap-4 border-b pb-3 text-sm">
        <Link href="/admin/users" className="hover:underline">
          Benutzer
        </Link>
        <Link href="/admin/design" className="hover:underline">
          Design
        </Link>
        <Link href="/admin/audit" className="hover:underline">
          Audit-Log
        </Link>
        <Link href="/admin/settings" className="hover:underline">
          Einstellungen
        </Link>
      </nav>
      {children}
    </div>
  );
}
