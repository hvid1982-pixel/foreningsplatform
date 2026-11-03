import { expect, type Page } from "@playwright/test";

export const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || "Demo-adgangskode-2026";

export const demoUsers = {
  admin: { email: "admin@example.com", home: "/admin", heading: "Platformadministration" },
  association: { email: "forening@example.com", home: "/forening", heading: "DEMO Boldklubben Nord" },
  company: { email: "virksomhed@example.com", home: "/virksomhed", heading: "DEMO Bageriet på Hjørnet" },
} as const;

export async function login(page: Page, email: string, password = DEMO_PASSWORD) {
  await page.goto("/log-ind");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Adgangskode").fill(password);
  await page.getByRole("button", { name: "Log ind" }).click();
}

export async function loginAs(page: Page, role: keyof typeof demoUsers) {
  const user = demoUsers[role];
  await login(page, user.email);
  // Generous timeout: in dev mode the first visit to a route compiles it.
  await expect(page).toHaveURL(new RegExp(`${user.home}$`), { timeout: 30_000 });
}
