import type { ReactNode } from "react";
import { StepIndicator } from "./StepIndicator";

export function WizardShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <header>
        <h1 className="text-2xl font-semibold">MerchShop · Installation</h1>
        <p className="text-sm text-muted-foreground">
          Konfiguration für die Erstinbetriebnahme.
        </p>
      </header>
      <StepIndicator />
      <section className="rounded-lg border bg-card p-6">{children}</section>
    </main>
  );
}
