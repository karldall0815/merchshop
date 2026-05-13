import { test, expect, type Page } from "@playwright/test";

// Verifies the UX-Improvements checkout changes:
//   - Kostenstelle, Wunschtermin and Contact are truly optional (form submits without them)
//   - Wunschtermin + deadline-flag round-trip into the order detail
//   - Contact line round-trips into the order detail

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

/** Create a fresh product so the cart has something to add. Returns its SKU. */
async function createTestProduct(page: Page, label: string): Promise<string> {
  const sku = `${label}-${Date.now()}`;
  await page.goto("/catalog/new");
  await page.getByLabel("SKU *").fill(sku);
  await page.getByLabel("Name *").fill(`Checkout-Testartikel ${label}`);
  await page.getByLabel("Mindestbestand").fill("0");
  await page.getByLabel("Anfangsbestand").fill("20");
  await page.getByRole("button", { name: /Artikel erstellen/ }).click();
  await page.waitForURL(/\/catalog$/, { timeout: 15_000 });
  return sku;
}

/** Adds the product with given SKU to the cart from the shop. */
async function addProductToCart(page: Page, sku: string) {
  await page.goto("/shop");
  // The product is shown in the grid — find the card that contains its SKU
  // and click on it (the entire card is a link).
  await page.getByText(sku).first().click();
  await page.waitForURL(/\/shop\/.+/);
  await page.getByRole("button", { name: /In den Warenkorb/ }).click();
  // addAndGoToCart redirects to /cart after success
  await page.waitForURL(/\/cart/, { timeout: 10_000 });
}

test("checkout: submits successfully without optional fields and shows order in list", async ({ page }) => {
  const mail = await bootstrapAndLogin(page);
  if (!mail) {
    test.skip(true, "App already installed with unknown admin credentials — run `docker compose down -v` to reset.");
    return;
  }

  // Need at least one product — create one as the admin.
  const sku = await createTestProduct(page, "OPT");

  // Add to cart and go to checkout.
  await addProductToCart(page, sku);
  await page.goto("/checkout");
  await expect(page).toHaveURL(/\/checkout/);

  // Fill ONLY the required fields. Leave Kostenstelle, Wunschtermin, Contact empty.
  await page.getByLabel("Anlass *").fill("E2E Bestellung ohne Optionals");
  // recipient/street/zip/city are required and currently empty
  await page.getByLabel("Empfänger *").fill("Max Mustermann");
  await page.getByLabel("Straße & Hausnr. *").fill("Hauptstr. 1");
  await page.getByLabel("PLZ *").fill("12345");
  await page.getByLabel("Stadt *").fill("Musterstadt");

  // Explicitly clear any prefilled cost center (admin user has none by default).
  await page.getByLabel("Kostenstelle").fill("");
  await page.getByLabel(/^Wunschtermin$/).fill("");
  await page.getByLabel(/Ansprechpartner/).fill("");

  await page.getByRole("button", { name: /Bestellung absenden/ }).click();

  // Should redirect to /orders
  await page.waitForURL(/\/orders$/, { timeout: 15_000 });
  await expect(page.getByText("E2E Bestellung ohne Optionals")).toBeVisible();
});

test("checkout: deadline + contact round-trip into order detail", async ({ page }) => {
  const mail = await bootstrapAndLogin(page);
  if (!mail) {
    test.skip(true, "App already installed with unknown admin credentials — run `docker compose down -v` to reset.");
    return;
  }

  const sku = await createTestProduct(page, "DL");

  await addProductToCart(page, sku);
  await page.goto("/checkout");

  // All required fields
  await page.getByLabel("Anlass *").fill("E2E mit Deadline");
  await page.getByLabel("Empfänger *").fill("Anna Schmidt");
  await page.getByLabel("Straße & Hausnr. *").fill("Beispielweg 42");
  await page.getByLabel("PLZ *").fill("54321");
  await page.getByLabel("Stadt *").fill("Beispielstadt");

  // Set Wunschtermin = next month (date input expects ISO YYYY-MM-DD)
  const future = new Date();
  future.setMonth(future.getMonth() + 1);
  const isoDate = future.toISOString().slice(0, 10);
  await page.getByLabel(/^Wunschtermin$/).fill(isoDate);

  // Tick the deadline checkbox
  await page.getByLabel(/Als Deadline kennzeichnen/).check();

  // Contact field
  await page.getByLabel(/Ansprechpartner/).fill("z. Hd. Frau Müller, Marketing");

  await page.getByRole("button", { name: /Bestellung absenden/ }).click();
  await page.waitForURL(/\/orders$/, { timeout: 15_000 });

  // Click into the newest order (top of list)
  await page.getByRole("link", { name: /E2E mit Deadline/ }).first().click();
  await page.waitForURL(/\/orders\/.+/);

  // Deadline marker is rendered as "📅 Deadline:" on the order detail page.
  await expect(page.getByText(/Deadline:/)).toBeVisible();

  // Contact appears in the shipping address block.
  await expect(page.getByText(/z\. Hd\. Frau Müller, Marketing/)).toBeVisible();
});
