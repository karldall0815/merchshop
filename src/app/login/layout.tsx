import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

// Authenticated users bouncing to /login should land on / instead — that
// gate also catches the "old proxy bug": a stale session cookie + missing
// install-cookie used to ping-pong users through /setup → /login → / etc.
export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/");
  return children;
}
