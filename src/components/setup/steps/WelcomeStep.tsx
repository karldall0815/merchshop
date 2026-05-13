import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { nextStep } from "@/modules/setup/state-machine";

export async function WelcomeStep() {
  const next = await nextStep();
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Willkommen</h2>
      <p>Dieser Wizard führt durch die Erstinbetriebnahme von MerchShop. Du kannst jederzeit pausieren — der Fortschritt wird gespeichert.</p>
      <Link href={`/setup/${next === "welcome" ? "branding" : next}`} className={buttonVariants()}>Los geht&apos;s</Link>
    </div>
  );
}
