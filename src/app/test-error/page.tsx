import { notFound } from "next/navigation";

// force-dynamic so the gating runs per request, not at build time
export const dynamic = "force-dynamic";

/**
 * Test-only route that deliberately throws to exercise the error boundary.
 *
 * Gated by MERCHSHOP_E2E=1 so this is a 404 in production. The Playwright
 * webServer sets the var during e2e runs.
 */
export default function ForceError() {
  if (process.env.MERCHSHOP_E2E !== "1") notFound();
  throw new Error("E2E_FORCED_ERROR");
}
