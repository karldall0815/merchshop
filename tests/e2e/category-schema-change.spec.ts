import { test, expect, type Page } from "@playwright/test";

// Verifies the confirm-dialog flow when removing a category field that has values
// on at least one product. Like categories.spec.ts this can only run end-to-end
// when the wizard hasn't been past the admin step yet — otherwise admin credentials
// are unknown. Falls back to a clean skip in that case.

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

test("category schema change: removing a field used by a product shows confirm dialog and strips the value", async ({ page }) => {
  const mail = await bootstrapAndLogin(page);
  if (!mail) {
    test.skip(true, "App already installed with unknown admin credentials — run `docker compose down -v` to reset.");
    return;
  }

  // Use a stamp scoped to this spec to avoid colliding with the other categories
  // test if Playwright runs them in the same browser context.
  const stamp = Date.now();
  const catSlug = `testkat-schema-${stamp}`;
  const catName = `TestKat-Schema ${stamp}`;
  const sku = `TST-SCH-${stamp}`;
  const productName = `Schema Test Artikel ${stamp}`;

  // --- Prep: create the category with Material + Bio fields ---
  await page.goto("/admin/categories/new");
  await page.getByLabel("Slug *").fill(catSlug);
  await page.getByLabel("Name *").fill(catName);

  await page.getByRole("button", { name: /Feld hinzufügen/ }).click();
  const fieldRows = page.locator("table tbody tr");
  await fieldRows.nth(0).locator("input").nth(0).fill("Material");
  await expect(fieldRows.nth(0).locator("input").nth(1)).toHaveValue("material");

  await page.getByRole("button", { name: /Feld hinzufügen/ }).click();
  await fieldRows.nth(1).locator("input").nth(0).fill("Bio");
  await expect(fieldRows.nth(1).locator("input").nth(1)).toHaveValue("bio");
  await fieldRows.nth(1).locator("select").selectOption("boolean");

  await page.getByRole("button", { name: /^Speichern$/ }).click();
  await page.waitForURL(/\/admin\/categories$/, { timeout: 15_000 });

  // --- Prep: create a product using both fields ---
  await page.goto("/catalog/new");
  await page.getByLabel("SKU *").fill(sku);
  await page.getByLabel("Name *").fill(productName);
  await page.getByLabel("Kategorie").selectOption({ label: catName });
  await page.locator("#attr-material").fill("Holz");
  await page.locator("#attr-bio").check();
  await page.getByRole("button", { name: /Artikel erstellen/ }).click();
  await expect(page).toHaveURL(/\/catalog$/, { timeout: 15_000 });

  // --- Find the category edit URL via the admin list ---
  await page.goto("/admin/categories");
  await page.getByRole("link", { name: catName }).click();
  await expect(page).toHaveURL(/\/admin\/categories\/[^/]+$/);
  const categoryEditUrl = page.url();
  const productListBeforeSave = page.url();

  // --- Act: remove the Material field (first row) ---
  // The Material field should be the first row in the schema editor.
  const editRows = page.locator("table tbody tr");
  const materialRow = editRows.filter({ has: page.locator('input[value="material"]') });
  await expect(materialRow).toHaveCount(1);
  // Click the ✕ button in that row to remove it.
  await materialRow.getByRole("button", { name: "✕" }).click();
  // Confirm Material is no longer in the schema rows.
  await expect(page.locator('input[value="material"]')).toHaveCount(0);

  // Save → expect the confirm dialog (not yet redirected).
  await page.getByRole("button", { name: /^Speichern$/ }).click();

  // --- Assert: confirm dialog mentions the affected product ---
  await expect(page.getByRole("heading", { name: /Schema-Änderung bestätigen/ })).toBeVisible();
  // The dialog lists removed keys and affected products. "material" should appear.
  await expect(page.getByText(/material/)).toBeVisible();
  await expect(page.getByText(sku)).toBeVisible();

  // Click "Trotzdem speichern"
  await page.getByRole("button", { name: /Trotzdem speichern/ }).click();
  await page.waitForURL(/\/admin\/categories$/, { timeout: 15_000 });

  // --- Verify product edit page: Material gone, Bio still true ---
  // Find the product via /catalog list.
  await page.goto("/catalog");
  await page.getByRole("link", { name: new RegExp(sku) }).first().click();
  await expect(page).toHaveURL(/\/catalog\/.+\/edit$/);

  // Material input should no longer be in the DOM.
  await expect(page.locator("#attr-material")).toHaveCount(0);
  // Bio checkbox should still exist and be checked.
  await expect(page.locator("#attr-bio")).toBeVisible();
  await expect(page.locator("#attr-bio")).toBeChecked();

  // (categoryEditUrl/productListBeforeSave are kept as locals only for clarity if
  // the test ever needs to revisit them; intentionally unused at the end.)
  void categoryEditUrl;
  void productListBeforeSave;
});
