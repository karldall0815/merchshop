import { test, expect, type Page } from "@playwright/test";

// Mirrors the skip-aware pattern from catalog.spec.ts. We can only run end-to-end
// when the wizard hasn't been past the admin step yet (otherwise we don't have
// the admin password). If the DB is in any other state we skip cleanly.

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

/**
 * Boots the wizard end-to-end and logs in. Returns the admin mail used.
 * Returns null if we can't run the test for state reasons (caller should skip).
 */
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

test("categories happy path: create category → create product → appears in /shop with custom fields", async ({ page }) => {
  const mail = await bootstrapAndLogin(page);
  if (!mail) {
    test.skip(true, "App already installed with unknown admin credentials — run `docker compose down -v` to reset.");
    return;
  }

  // Unique IDs to avoid colliding with seeded data or prior runs.
  const stamp = Date.now();
  const catSlug = `testkat-e2e-${stamp}`;
  const catName = `TestKat-E2E ${stamp}`;
  const sku = `TST-E2E-${stamp}`;
  const productName = `Testartikel E2E ${stamp}`;

  // 1. Admin → Categories list
  await page.goto("/admin/categories");
  await expect(page).toHaveURL(/\/admin\/categories$/);

  // 2. Click "＋ Neue Kategorie"
  await page.getByRole("link", { name: /Neue Kategorie/ }).click();
  await expect(page).toHaveURL(/\/admin\/categories\/new$/);

  // 3. Fill basics
  await page.getByLabel("Slug *").fill(catSlug);
  await page.getByLabel("Name *").fill(catName);

  // Add text field "Material" (key auto-fills from label).
  await page.getByRole("button", { name: /Feld hinzufügen/ }).click();
  // The AttributeSchemaEditor renders inputs without labels — use cell role / position.
  // First row, first input = label; second input = key.
  const fieldRows = page.locator("table tbody tr");
  await fieldRows.nth(0).locator("input").nth(0).fill("Material");
  // type defaults to "text" — no change required
  // verify the key auto-filled to "material"
  await expect(fieldRows.nth(0).locator("input").nth(1)).toHaveValue("material");

  // Add boolean field "Bio".
  await page.getByRole("button", { name: /Feld hinzufügen/ }).click();
  await fieldRows.nth(1).locator("input").nth(0).fill("Bio");
  await expect(fieldRows.nth(1).locator("input").nth(1)).toHaveValue("bio");
  await fieldRows.nth(1).locator("select").selectOption("boolean");

  // Save
  await page.getByRole("button", { name: /^Speichern$/ }).click();
  await page.waitForURL(/\/admin\/categories$/, { timeout: 15_000 });
  await expect(page.getByText(catName)).toBeVisible();

  // 5. Create product
  await page.goto("/catalog/new");
  await page.getByLabel("SKU *").fill(sku);
  await page.getByLabel("Name *").fill(productName);

  // Pick the new category via its <select id="cat"> by label "Kategorie".
  await page.getByLabel("Kategorie").selectOption({ label: catName });

  // Custom fields appear as <Label htmlFor="attr-material"> + Input id="attr-material".
  await page.locator("#attr-material").fill("Holz");
  await page.locator("#attr-bio").check();

  await page.getByRole("button", { name: /Artikel erstellen/ }).click();

  // 6. Redirect to /catalog
  await expect(page).toHaveURL(/\/catalog$/, { timeout: 15_000 });
  await expect(page.getByText(sku)).toBeVisible();

  // 7. Shop view
  await page.goto("/shop");
  await expect(page).toHaveURL(/\/shop/);

  // 8. Click the TestKat-E2E pill
  await page.getByRole("button", { name: catName }).click();
  await page.waitForURL(/\?.*cat=/);

  // 9. SKU appears in listing
  await expect(page.getByText(sku)).toBeVisible();

  // 10. Click into the product detail
  await page.getByRole("link", { name: new RegExp(productName) }).first().click();
  await expect(page).toHaveURL(/\/shop\/.+/);

  // 11. Properties block shows "Material" with "Holz" and "Bio" with "✓".
  await expect(page.getByText("Eigenschaften")).toBeVisible();
  const propsList = page.locator("dl").filter({ has: page.getByText("Material") });
  await expect(propsList.getByText("Material")).toBeVisible();
  await expect(propsList.getByText("Holz")).toBeVisible();
  await expect(propsList.getByText("Bio")).toBeVisible();
  await expect(propsList.getByText("✓")).toBeVisible();
});
