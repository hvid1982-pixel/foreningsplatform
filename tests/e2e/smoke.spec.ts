import { expect, test } from "@playwright/test";

test("forsiden vises på dansk", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Foreningsplatform/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("lokal eksponering");
  await expect(page.locator("html")).toHaveAttribute("lang", "da");
  await expect(page.getByRole("link", { name: "Log ind" })).toBeVisible();
});

test("health-endpointet svarer ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ status: "ok", database: "ok" });
});
