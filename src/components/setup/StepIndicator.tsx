import { STEP_IDS } from "@/modules/setup/steps";
import { nextStep } from "@/modules/setup/state-machine";

const LABELS: Record<string, string> = {
  welcome: "Start", "system-check": "System", branding: "Branding",
  admin: "Admin", storage: "Storage", email: "E-Mail", shipping: "Versand",
  defaults: "Defaults", users: "User", review: "Abschluss",
};

export async function StepIndicator() {
  const current = await nextStep();
  const idx = STEP_IDS.indexOf(current);
  return (
    <ol className="flex flex-wrap gap-2 text-xs">
      {STEP_IDS.map((s, i) => (
        <li
          key={s}
          className={[
            "rounded-full px-3 py-1 border",
            i < idx && "bg-emerald-100 border-emerald-300 text-emerald-800",
            i === idx && "bg-primary text-primary-foreground border-primary",
            i > idx && "bg-muted text-muted-foreground border-muted",
          ].filter(Boolean).join(" ")}
        >
          {i + 1}. {LABELS[s]}
        </li>
      ))}
    </ol>
  );
}
