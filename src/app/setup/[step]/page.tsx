import { notFound } from "next/navigation";
import { canEnterStep } from "@/modules/setup/state-machine";
import { STEP_IDS, type StepId } from "@/modules/setup/steps";
import { WelcomeStep } from "@/components/setup/steps/WelcomeStep";
import { SystemCheckStep } from "@/components/setup/steps/SystemCheckStep";
import { BrandingStep } from "@/components/setup/steps/BrandingStep";
import { AdminStep } from "@/components/setup/steps/AdminStep";
import { StorageStep } from "@/components/setup/steps/StorageStep";
import { EmailStep } from "@/components/setup/steps/EmailStep";
import { ShippingStep } from "@/components/setup/steps/ShippingStep";
import { DefaultsStep } from "@/components/setup/steps/DefaultsStep";
import { UsersStep } from "@/components/setup/steps/UsersStep";
import { ReviewStep } from "@/components/setup/steps/ReviewStep";

const RENDERERS: Record<StepId, () => React.ReactNode> = {
  welcome: () => <WelcomeStep />,
  "system-check": () => <SystemCheckStep />,
  branding: () => <BrandingStep />,
  admin: () => <AdminStep />,
  storage: () => <StorageStep />,
  email: () => <EmailStep />,
  shipping: () => <ShippingStep />,
  defaults: () => <DefaultsStep />,
  users: () => <UsersStep />,
  review: () => <ReviewStep />,
};

export default async function SetupStepPage({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  if (!(STEP_IDS as readonly string[]).includes(step)) notFound();
  const sid = step as StepId;
  if (!(await canEnterStep(sid))) notFound();
  return RENDERERS[sid]();
}
