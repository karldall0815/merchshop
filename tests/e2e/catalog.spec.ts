import { test, expect, type Page } from "@playwright/test";

// We intentionally skip the image upload sub-flow in this test — the presigned-POST
// happy path is covered by src/lib/storage.test.ts and the round-trip against a
// real MinIO is exercised in the setup wizard's storage step. Adding it here
// would require mocking the MinIO host or capturing live network traffic, which
// is brittle.

/** Advance the setup wizard from whatever step we're currently on to /login. */
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
    // Storage may be auto-skipped when S3 ENV vars are set
    await page.waitForURL(/\/setup\/(storage|email|shipping|defaults|users|review)/);
  }

  if (page.url().includes("/setup/storage")) {
    await page.getByLabel("Endpoint *").fill("http://localhost:9000");
    await page.getByLabel("Bucket *").fill("merchshop-images");
    await page.getByLabel("Access Key *").fill("minioadmin");
    await page.getByLabel("Secret Key *").fill("minioadmin");
    // The storage step uses a single "Verbindung testen & speichern" button
    await page.getByRole("button", { name: /Verbindung testen/ }).click();
    await page.waitForURL(/\/setup\/(email|shipping|defaults|users|review)/, { timeout: 30_000 });
  }

  if (page.url().includes("/setup/email")) {
    // Select "Später konfigurieren" radio
    await page.getByRole("radio", { name: /Später konfigurieren/ }).check();
    await page.getByRole("button", { name: /Speichern/ }).click();
    // State machine may skip optional steps — wait for any next setup step
    await page.waitForURL(/\/setup\/(shipping|defaults|users|review)/);
  }

  if (page.url().includes("/setup/shipping")) {
    // "Später" radio is pre-selected; just submit
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

test("catalog happy path: create product → appears in /catalog and /inventory → manual stock correction", async ({ page }) => {
  await page.goto("/");

  const landedUrl = page.url();

  if (landedUrl.includes("/login")) {
    // DB already provisioned — skip to keep determinism
    test.skip(true, "DB already provisioned with a non-test admin — skipping to keep determinism");
    return;
  }

  // If we land on "/" the app is installed but we have no session — unknown admin credentials.
  if (!landedUrl.includes("/setup")) {
    test.skip(true, "App already installed with unknown admin credentials — skipping. Run `docker compose down -v` to reset.");
    return;
  }

  // We're in /setup — run the wizard.
  {
    // Handle the welcome page (step 0 — has a "Los geht" link, not a form)
    if (await page.getByRole("link", { name: /Los geht/ }).isVisible().catch(() => false)) {
      await page.getByRole("link", { name: /Los geht/ }).click();
      await page.waitForURL(/\/setup\/.+/);
    }

    // Also handle system-check step if present (just has a "Weiter" button)
    if (page.url().includes("/setup/system-check")) {
      await page.getByRole("button", { name: /Weiter/ }).click();
      await page.waitForURL(/\/setup\/branding/);
    }

    // If we're past the branding or admin step, the admin was already provisioned
    // in a prior run and we don't have those credentials — skip.
    const currentStepUrl = page.url();
    const isAtStart = currentStepUrl.includes("/setup/branding") || currentStepUrl.includes("/setup/admin");
    if (!isAtStart) {
      test.skip(true, "Wizard already past admin step — admin credentials unknown, skipping. Run `docker compose down -v` to reset.");
      return;
    }

    const mail = `admin-${Date.now()}@test.local`;
    await completeWizardFromCurrentStep(page, mail);

    // Now on /login — sign in
    await expect(page).toHaveURL(/\/login/);
    await page.getByLabel(/E-Mail/).fill(mail);
    await page.getByLabel("Passwort").fill("verysecure-1234");
    await page.getByRole("button", { name: /Anmelden/ }).click();

    // Should land on / after login
    await page.waitForURL("/", { timeout: 15_000 });
  }

  // Navigate to catalog list
  await page.goto("/catalog");
  await expect(page).toHaveURL(/\/catalog$/);

  // Create a product
  await page.goto("/catalog/new");
  const sku = `DEMO-${Date.now()}`;
  // Labels as rendered in ProductForm
  await page.getByLabel("SKU *").fill(sku);
  await page.getByLabel("Name *").fill("E2E Tasse");
  // "Mindestbestand" — no asterisk in this label
  await page.getByLabel("Mindestbestand").fill("5");
  // "Anfangsbestand" — only shown in create mode
  await page.getByLabel("Anfangsbestand").fill("10");
  // Submit button text in create mode
  await page.getByRole("button", { name: /Artikel erstellen/ }).click();

  // After creation, redirected to /catalog list — product should appear
  await expect(page).toHaveURL(/\/catalog$/, { timeout: 15_000 });
  await expect(page.getByText(sku)).toBeVisible();

  // Inventory overview also shows the new product
  await page.goto("/inventory");
  await expect(page.getByText(sku)).toBeVisible();
  await expect(page.getByText("E2E Tasse")).toBeVisible();

  // Navigate to inventory detail and run a correction
  // The inventory table link text is "Verlauf →"
  await page.getByRole("link", { name: /Verlauf/ }).first().click();
  await expect(page).toHaveURL(/\/inventory\//);

  await page.getByRole("button", { name: /Bestand korrigieren/i }).click();
  // Label: "Delta (positive Zahl = Zugang, negative = Abgang)"
  await page.getByLabel(/Delta/).fill("-3");
  // Label: "Grund *"
  await page.getByLabel("Grund *").fill("stocktake adjust");
  // Save button (not in pending state)
  await page.getByRole("button", { name: /^Speichern$/ }).click();

  // Movement history should show initial +10 and correction -3
  // MovementRow renders positive deltas as "+10"
  await expect(page.getByText("+10")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("-3")).toBeVisible();
});
