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
