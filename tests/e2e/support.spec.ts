import { test, expect, type Page } from "@playwright/test";

// Mirrors the skip-aware bootstrap pattern from catalog.spec.ts / categories.spec.ts.
// We can only end-to-end test when the wizard hasn't been past the admin step yet.
// In any other DB state we skip cleanly so the suite stays deterministic.

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

test("support happy path: FAQ search filters → submit report → admin marks resolved", async ({ page }) => {
  const mail = await bootstrapAndLogin(page);
  if (!mail) {
    test.skip(true, "App already installed with unknown admin credentials — run `docker compose down -v` to reset.");
    return;
  }

  // 1. Navigate to FAQ
  await page.goto("/support");
  await expect(page).toHaveURL(/\/support$/);

  // Audience-pill buttons — the FaqAccordion renders one per audience.
  // Click "Alle" so all entries are visible regardless of admin role default.
  await page.getByRole("button", { name: /^Alle$/ }).click();

  // Verify FAQ structure is present: search input, audience pills, details elements.
  const searchInput = page.getByPlaceholder("Suche nach Stichwort…");
  await expect(searchInput).toBeVisible();
  await expect(page.getByRole("button", { name: /^Besteller$/ })).toBeVisible();

  const detailsAll = page.locator("details");
  const baselineCount = await detailsAll.count();
  expect(baselineCount).toBeGreaterThan(0);

  // 2. Filter by "Kostenstelle" — count should drop (but stay > 0).
  await searchInput.fill("Kostenstelle");
  // Wait for re-render
  await expect.poll(async () => await page.locator("details").count()).toBeLessThan(baselineCount);
  const filteredCount = await page.locator("details").count();
  expect(filteredCount).toBeGreaterThan(0);

  // 3. Submit a manual support report
  await page.goto("/support/report");
  await expect(page).toHaveURL(/\/support\/report$/);
  await page.getByLabel(/Was ist passiert/).fill("Test-Report-E2E-Support");
  await page.getByRole("button", { name: /Fehler melden/ }).click();

  // 4. Verify redirect to /sent + reference ID visible
  await page.waitForURL(/\/support\/report\/sent/, { timeout: 15_000 });
  await expect(page.getByText(/Referenz-ID/)).toBeVisible();

  // 5. Admin view — find the report we just submitted and mark resolved
  await page.goto("/admin/support");
  await expect(page).toHaveURL(/\/admin\/support$/);

  // The newest report is the one we just made — click the first ID link.
  await page.locator("table tbody tr").first().getByRole("link").click();
  await page.waitForURL(/\/admin\/support\/[a-z0-9-]+/);

  // 6. Click "Erledigt"
  await page.getByRole("button", { name: /^Erledigt$/ }).click();

  // 7. After resolving, page reloads via server action; status row should show "resolved"
  // The detail page renders Status via <dd>{report.status}</dd>.
  await expect(page.getByText("resolved", { exact: false })).toBeVisible({ timeout: 10_000 });
});
