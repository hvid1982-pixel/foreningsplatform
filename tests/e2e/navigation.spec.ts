import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers";

/**
 * Clicking between admin pages must give immediate feedback (a loading
 * skeleton) even when the server is slow, e.g. on a cold serverless instance.
 * Navigation requests (not prefetches) are delayed to simulate that.
 */
test("navigation i admin viser straks en indlæsningstilstand", async ({ page }) => {
  await loginAs(page, "admin");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Platformadministration");

  await page.route("**/*", async (route) => {
    const headers = route.request().headers();
    const isNavigation =
      headers["rsc"] && !headers["next-router-prefetch"] && !headers["next-router-segment-prefetch"];
    if (isNavigation) await new Promise((resolve) => setTimeout(resolve, 3_000));
    await route.continue();
  });

  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Organisationer" }).click();
  await expect(page.locator("[aria-busy=true]")).toBeVisible({ timeout: 1_000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Organisationer", { timeout: 10_000 });
});
