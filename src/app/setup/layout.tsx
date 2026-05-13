import type { ReactNode } from "react";
import { WizardShell } from "@/components/setup/WizardShell";

// The wizard shell reads live setup state from the DB on every render.
export const dynamic = "force-dynamic";

export default function SetupLayout({ children }: { children: ReactNode }) {
  return <WizardShell>{children}</WizardShell>;
}
