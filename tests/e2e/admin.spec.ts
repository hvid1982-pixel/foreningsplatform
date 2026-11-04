import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

test("admin ser organisationer, forretningsregler og auditlog", async ({ page }) => {
  await loginAs(page, "admin");

  await page.getByRole("link", { name: "Organisationer" }).click();
  await expect(page.getByRole("cell", { name: /DEMO Boldklubben Nord/ })).toBeVisible();
  await expect(page.getByRole("cell", { name: /DEMO Bageriet på Hjørnet/ })).toBeVisible();

  await page.getByRole("link", { name: "Forretningsregler" }).click();
  await expect(page.getByText("Svarfrist for foreninger (timer)")).toBeVisible();
  await expect(page.getByText("Ikke endeligt godkendt").first()).toBeVisible();

  await page.getByRole("link", { name: "Auditlog" }).click();
  await expect(page.getByText("seed.completed").first()).toBeVisible();
});

test("admin kan sætte bookinglinket, og foreningen ser knappen", async ({ page, browser }) => {
  await loginAs(page, "admin");
  await page.getByRole("link", { name: "Forretningsregler" }).click();
  const row = page.getByRole("row").filter({ hasText: "Link til booking af onboardinghjælp" });
  const setUrl = async (value: string) => {
    await row.getByText("Ret", { exact: true }).click();
    await row.getByLabel("Ny værdi").fill(value);
    await row.getByRole("button", { name: "Gem ny version" }).click();
    await expect(row.getByText("Gemt.")).toBeVisible();
  };
  await setUrl("https://calendly.com/eksempel/onboarding");

  const associationContext = await browser.newContext();
  const association = await associationContext.newPage();
  await loginAs(association, "association");
  await expect(association.getByRole("link", { name: "Book onboardinghjælp" })).toHaveAttribute(
    "href",
    "https://calendly.com/eksempel/onboarding",
  );
  await associationContext.close();

  // Restore "not set" so other runs start from the same state.
  await page.reload();
  await setUrl("");
});
