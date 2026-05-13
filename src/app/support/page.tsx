import { FaqAccordion } from "@/components/support/FaqAccordion";
import { getCurrentUser } from "@/modules/auth/session";
import type { FaqAudience } from "@/lib/support-faq";

export const dynamic = "force-dynamic";

export default async function SupportFaqPage() {
  const user = await getCurrentUser();
  const role = (user?.role ?? "requester") as FaqAudience;
  return <FaqAccordion defaultAudience={role} />;
}
