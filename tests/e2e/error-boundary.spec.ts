import { test, expect, type Page } from "@playwright/test";

// Exercises the global error boundary at /test-error (a route gated by
// MERCHSHOP_E2E=1 that deliberately throws). The boundary should render the
// "Ups, das hat nicht geklappt" message and a link to the manual-report form
// pre-filled with the error digest.

async function completeWizardFromCurrentStep(page: Page, adminMail: string) {
  const url = page.url();

  if (url.includes("/setup/branding") || (url.includes("/setup") && !url.match(/\/setup\/.+/))) {
    await page.getByLabel("Shop-Name *").fill("MerchShop QA");
    await page.getByRole("button", { name: /Weiter/ }).click();
    await page.waitForURL(/\/setup\/admin/);
  }

  if (page.url().includes("/setup/admin")) {
    await page.getByLabel("Anzeigename *").fill("QA Admin");
    await page.getByLabel("E-Mail *").fill(adminMail);
    await page.getByLabel("Passwort * (min. 12 Zeichen)").fill("verysecure-1234");
    await page.getByLabel("Passwort bestätigen *").fill("verysecure-1234");
    await page.getByRole("button", { name: /Weiter/ }).click();
    await page.waitForURL(/\/setup\/(storage|email|shipping|defaults|users|review)/);
  }

  if (page.url().includes("/setup/storage")) {
    await page.getByLabel("Endpoint *").fill("http://localhost:9000");
    await page.getByLabel("Bucket *").fill("merchshop-images");
    await page.getByLabel("Access Key *").fill("minioadmin");
    await page.getByLabel("Secret Key *").fill("minioadmin");
    await page.getByRole("button", { name: /Verbindung testen/ }).click();
    await page.waitForURL(/\/setup\/(email|shipping|defaults|users|review)/, { timeout: 30_000 });
  }

  if (page.url().includes("/setup/email")) {
    await page.getByRole("radio", { name: /Später konfigurieren/ }).check();
    await page.getByRole("button", { name: /Speichern/ }).click();
    await page.waitForURL(/\/setup\/(shipping|defaults|users|review)/);
  }

  if (page.url().includes("/setup/shipping")) {
    await page.getByRole("button", { name: /Weiter/ }).click();
    await page.waitForURL(/\/setup\/(defaults|users|review)/);
  }

  if (page.url().includes("/setup/defaults")) {
    await page.getByRole("button", { name: /Weiter/ }).click();
    await page.waitForURL(/\/setup\/(users|review)/);
  }

  if (page.url().includes("/setup/users")) {
    await page.getByRole("button", { name: /Weiter/ }).click();
    await page.waitForURL(/\/setup\/review/);
  }

  if (page.url().includes("/setup/review")) {
    await page.getByRole("button", { name: /Installation abschließen/ }).click();
    await page.waitForURL(/\/login/, { timeout: 30_000 });
  }
}

async function bootstrapAndLogin(page: Page): Promise<string | null> {
  await page.goto("/");
  const landed = page.url();

  if (landed.includes("/login")) return null;
  if (!landed.includes("/setup")) return null;

  if (await page.getByRole("link", { name: /Los geht/ }).isVisible().catch(() => false)) {
    await page.getByRole("link", { name: /Los geht/ }).click();
    await page.waitForURL(/\/setup\/.+/);
  }

  if (page.url().includes("/setup/system-check")) {
    await page.getByRole("button", { name: /Weiter/ }).click();
    await page.waitForURL(/\/setup\/branding/);
  }

  const stepUrl = page.url();
  const isAtStart = stepUrl.includes("/setup/branding") || stepUrl.includes("/setup/admin");
  if (!isAtStart) return null;

  const mail = `admin-${Date.now()}@test.local`;
  await completeWizardFromCurrentStep(page, mail);

  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel(/E-Mail/).fill(mail);
  await page.getByLabel("Passwort").fill("verysecure-1234");
  await page.getByRole("button", { name: /Anmelden/ }).click();
  await page.waitForURL("/", { timeout: 15_000 });
  return mail;
}

test("error boundary: shows friendly message and links to manual-report with digest", async ({ page }) => {
  const mail = await bootstrapAndLogin(page);
  if (!mail) {
    test.skip(true, "App already installed with unknown admin credentials — run `docker compose down -v` to reset.");
    return;
  }

  // The /test-error route deliberately throws (gated by MERCHSHOP_E2E=1).
  // Next.js shows a console error for the thrown exception — that's expected.
  await page.goto("/test-error");

  // The error boundary message
  await expect(page.getByText(/Ups, das hat nicht geklappt/)).toBeVisible({ timeout: 15_000 });

  // Link to enrich the report
  const reportLink = page.getByRole("link", { name: /Eigene Beschreibung ergänzen/ });
  await expect(reportLink).toBeVisible();

  // Click it and verify the URL contains the from=error param
  await reportLink.click();
  await page.waitForURL(/\/support\/report\?.*from=error/, { timeout: 10_000 });

  // The "Diese Meldung wird mit dem aufgetretenen Fehler verknüpft" hint
  await expect(
    page.getByText(/Diese Meldung wird mit dem aufgetretenen Fehler verknüpft/),
  ).toBeVisible();
});
