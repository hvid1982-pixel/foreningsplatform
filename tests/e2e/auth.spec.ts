import { expect, test } from "@playwright/test";
import { demoUsers, login, loginAs } from "./helpers";

for (const role of Object.keys(demoUsers) as (keyof typeof demoUsers)[]) {
  test(`kan logge ind som ${role} og ser det rigtige overblik`, async ({ page }) => {
    await loginAs(page, role);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(demoUsers[role].heading);
    await page.getByRole("button", { name: "Log ud" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Log ind" })).toBeVisible();
  });
}

test("forkert adgangskode giver en dansk fejlbesked", async ({ page }) => {
  await login(page, demoUsers.company.email, "forkert-adgangskode");
  await expect(page.locator("[data-slot=alert]")).toContainText("Forkert e-mail eller adgangskode");
  await expect(page).toHaveURL(/\/log-ind$/);
});

test("beskyttede sider kræver login", async ({ page }) => {
  for (const path of ["/forening", "/virksomhed", "/admin", "/admin/log"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/log-ind$/);
  }
});

test("en forening kan ikke åbne admin", async ({ page }) => {
  await loginAs(page, "association");
  await page.goto("/admin/organisationer");
  await expect(page).toHaveURL(/\/forening$/);
  await expect(page.getByRole("heading", { name: "Organisationer" })).toHaveCount(0);
});

test("en virksomhed kan ikke åbne foreningens overblik", async ({ page }) => {
  await loginAs(page, "company");
  await page.goto("/forening");
  await expect(page).toHaveURL(/\/virksomhed$/);
});

test("ny bruger kan oprette konto og får besked om at bekræfte e-mail", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  await page.goto("/opret-konto");
  await page.getByLabel("Dit navn").fill("E2E Testbruger");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Adgangskode").fill("en-sikker-adgangskode");
  await page.getByRole("button", { name: "Opret konto" }).click();
  await expect(page.getByText("Tjek din e-mail")).toBeVisible();

  // Not verified yet → cannot log in.
  await login(page, email, "en-sikker-adgangskode");
  await expect(page.locator("[data-slot=alert]")).toContainText("ikke bekræftet");
});
