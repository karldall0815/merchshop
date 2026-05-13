import { redirect } from "next/navigation";
import { isInstalled, nextStep } from "@/modules/setup/state-machine";

// Hits the DB — never prerender.
export const dynamic = "force-dynamic";

export default async function SetupIndexPage() {
  if (await isInstalled() && process.env.ALLOW_SETUP_REINIT !== "true") {
    redirect("/login");
  }
  const step = await nextStep();
  redirect(`/setup/${step}`);
}
