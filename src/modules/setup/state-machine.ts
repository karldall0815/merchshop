import { db } from "@/lib/db";
import { STEPS, STEP_IDS, type StepId } from "./steps";

export async function isInstalled(): Promise<boolean> {
  const row = await db.systemSetup.findUnique({ where: { id: 1 } });
  return !!row?.installedAt;
}

async function isStepComplete(step: StepId): Promise<boolean> {
  switch (step) {
    case "welcome":
    case "system-check":
      return true;
    case "branding":
      return !!(await db.setting.findUnique({ where: { key: "branding.appName" } }));
    case "admin":
      return (await db.user.count({ where: { role: "admin" } })) > 0;
    case "storage":
      return isStepEnvComplete("storage") || !!(await db.setting.findUnique({
        where: { key: "storage.bucket" },
      }));
    case "email":
      return isStepEnvComplete("email") || !!(await db.setting.findUnique({
        where: { key: "email.mode" },
      }));
    case "shipping":
      return true;
    case "defaults":
      return true;
    case "users":
      return true;
    case "review":
      return false;
  }
}

function isStepEnvComplete(step: StepId): boolean {
  const descriptor = STEPS[step];
  const vars = descriptor.envVars;
  if (!vars || vars.length === 0) return false;
  const mode = descriptor.envVarsMatch ?? "all";
  const check = (v: string) => !!process.env[v];
  return mode === "any" ? vars.some(check) : vars.every(check);
}

export async function nextStep(): Promise<StepId> {
  for (const step of STEP_IDS) {
    if (step === "review") continue;
    if (!(await isStepComplete(step))) return step;
  }
  return "review";
}

export async function canEnterStep(target: StepId): Promise<boolean> {
  const next = await nextStep();
  const targetIdx = STEP_IDS.indexOf(target);
  const nextIdx = STEP_IDS.indexOf(next);
  return targetIdx <= nextIdx;
}
