import { test, expect } from "@playwright/test";

test("happy path: fresh install → admin login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/setup/);

  // welcome
  if (await page.getByRole("link", { name: /Los geht/ }).isVisible().catch(() => false)) {
    await page.getByRole("link", { name: /Los geht/ }).click();
  }

  // branding
  await page.getByLabel("Shop-Name *").fill("MerchShop QA");
  await page.getByRole("button", { name: /Weiter/ }).click();

  // admin
  const adminMail = `admin-${Date.now()}@test.local`;
  await page.getByLabel("Anzeigename *").fill("QA Admin");
  await page.getByLabel("E-Mail *").fill(adminMail);
  await page.getByLabel("Passwort * (min. 12 Zeichen)").fill("verysecure-1234");
  await page.getByLabel("Passwort bestätigen *").fill("verysecure-1234");
  await page.getByRole("button", { name: /Weiter/ }).click();

  // storage — assumes docker-compose minio is running with default creds
  await page.getByLabel("Endpoint *").fill("http://localhost:9000");
  await page.getByLabel("Bucket *").fill("merchshop-images");
  await page.getByLabel("Access Key *").fill("minioadmin");
  await page.getByLabel("Secret Key *").fill("minioadmin");
  await page.getByRole("button", { name: /Verbindung testen/ }).click();

  // email — choose "later" to skip external mail
  await page.getByRole("radio", { name: /Später/ }).check();
  await page.getByRole("button", { name: /Speichern/ }).click();

  // shipping — later
  await page.getByRole("radio", { name: /Später/ }).check();
  await page.getByRole("button", { name: /Weiter/ }).click();

  // defaults
  await page.getByRole("button", { name: /Weiter/ }).click();

  // users — skip
  await page.getByRole("button", { name: /Weiter/ }).click();

  // review
  await page.getByRole("button", { name: /Installation abschließen/ }).click();

  await expect(page).toHaveURL(/\/login/);

  // log in
  await page.getByLabel("E-Mail").fill(adminMail);
  await page.getByLabel("Passwort").fill("verysecure-1234");
  await page.getByRole("button", { name: /Anmelden/ }).click();

  await expect(page).toHaveURL("/", { timeout: 10_000 });
});
