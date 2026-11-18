import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import { DEMO_PASSWORD, login, loginAs } from "./helpers";

/**
 * Milestone 1 gate: a real association can register and publish approved
 * products without developer intervention.
 */
function createVerifiedUser(email: string, name: string, password: string) {
  execFileSync(
    "pnpm",
    [
      "exec",
      "tsx",
      "--env-file-if-exists=.env",
      "tests/e2e/support/create-verified-user.ts",
      email,
      name,
      password,
    ],
    { stdio: "inherit" },
  );
}

async function saveAndContinue(page: Page) {
  await page.getByRole("button", { name: "Gem og fortsæt" }).click();
}

test("en ny forening kan oprette sig, sende til godkendelse og få produkter publiceret", async ({
  page,
  browser,
}) => {
  test.slow();
  const stamp = Date.now();
  const email = `e2e-forening-${stamp}@example.com`;
  const clubName = `E2E Klub ${stamp}`;
  const password = "E2e-adgangskode-2026";
  createVerifiedUser(email, "E2E Formand", password);

  // Account → association
  await login(page, email, password);
  await expect(page).toHaveURL(/\/kom-i-gang$/, { timeout: 30_000 });
  await page.getByText("En forening", { exact: true }).click();
  await page.getByLabel("Navn på forening eller virksomhed").fill(clubName);
  await page.getByRole("button", { name: "Opret" }).click();
  await expect(page).toHaveURL(/\/forening$/, { timeout: 30_000 });
  await page.getByRole("link", { name: "Start opsætningen" }).click();

  // Step 1: identity — first try without required fields to see validation
  await expect(page.getByRole("heading", { name: "Forening og kontakt" })).toBeVisible();
  await saveAndContinue(page);
  await expect(page.getByText("Skriv foreningens adresse")).toBeVisible();
  await page.getByLabel("Adresse").fill("Hallvej 2");
  await page.getByLabel("Postnummer").fill("8000");
  await page.getByLabel("By", { exact: true }).fill("Aarhus");
  await page.getByLabel("Region").selectOption("midtjylland");
  await page.getByText("Nej", { exact: true }).click();
  await saveAndContinue(page);

  // Step 2: profile
  await expect(page.getByRole("heading", { name: "Om foreningen" })).toBeVisible();
  await page.getByLabel("Beskrivelse af foreningen").fill("Håndboldklub for børn og voksne.");
  await page.getByLabel("Antal medlemmer").fill("250");
  await page.getByText("13-18 år").click();
  await saveAndContinue(page);

  // Step 3: channels — "continue" without any is refused
  await expect(page.getByRole("heading", { name: "Kanaler og steder" })).toBeVisible();
  await page.getByRole("button", { name: "Fortsæt" }).click();
  await expect(page.getByText("Tilføj mindst én kanal eller ét sted")).toBeVisible();
  const channelForm = page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Tilføj kanal" }) });
  await channelForm.getByLabel("Type").selectOption("instagram");
  await channelForm.getByLabel("Antal følgere eller modtagere").fill("900");
  await channelForm.getByRole("button", { name: "Tilføj kanal" }).click();
  await expect(page.getByText("Instagram").first()).toBeVisible();
  await expect(page.getByText("900 (eget tal)")).toBeVisible();
  await page.getByRole("button", { name: "Fortsæt" }).click();

  // Step 4: one standard offering (auto-approved price) and one custom offering
  await expect(page.getByRole("heading", { name: "Produkter", level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Tilføj standardprodukt" }).click();
  await page.getByRole("link", { name: /Opslag på sociale medier/ }).click();
  await expect(page.getByLabel("Pris pr. enhed i kr. (uden moms)")).toHaveValue("750");
  await page.getByRole("button", { name: "Gem produkt" }).click();
  await expect(page).toHaveURL(/\/forening\/opsaetning\/produkter$/);

  await page.getByRole("link", { name: "Opret eget produkt" }).click();
  await page.getByLabel("Titel").fill("Navnesponsor for julestævnet");
  await page.getByLabel("Beskrivelse", { exact: true }).fill("Stævnet bærer jeres navn.");
  await page.getByLabel("Kategori").selectOption({ label: "Events" });
  await page.getByLabel("Enhed", { exact: true }).fill("stævne");
  await page.getByLabel("Pris pr. enhed i kr. (uden moms)").fill("5.000");
  await page.getByLabel("Dokumentation af leverancen").fill("Fotos fra dagen.");
  await page.getByRole("button", { name: "Gem produkt" }).click();
  await expect(page.getByRole("cell", { name: "Navnesponsor for julestævnet" })).toBeVisible();
  await page.getByRole("button", { name: "Fortsæt" }).click();

  // Step 5: exclusions
  await expect(page.getByRole("heading", { name: "Brancher I ikke vil samarbejde med" })).toBeVisible();
  await page.getByText("Spil og betting").click();
  await saveAndContinue(page);

  // Step 6: preview and submit
  await expect(page.getByRole("heading", { name: "Se profilen og send til godkendelse" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "Spil og betting" })).toBeVisible();
  await page.getByRole("button", { name: "Send til godkendelse" }).click();
  await expect(page).toHaveURL(/\/forening$/);
  await expect(page.getByText("Jeres profil er sendt til godkendelse")).toBeVisible();

  // Admin reviews in a separate session
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await loginAs(admin, "admin");
  await admin.getByRole("link", { name: "Godkendelser", exact: true }).click();
  await admin.getByRole("link", { name: clubName }).click();
  await admin.getByRole("button", { name: "Godkend og aktivér foreningen" }).click();
  await expect(admin.getByText("Beslutningen er gemt.").first()).toBeVisible();
  const customCard = admin.locator("[id^=produkt-]").filter({ hasText: "Navnesponsor for julestævnet" });
  await customCard.getByLabel("Godkendt pris i kr.").fill("4.500");
  await customCard.getByRole("button", { name: "Godkend" }).click();
  await expect(admin.getByText("Beslutningen er gemt.").first()).toBeVisible();
  await adminContext.close();

  // The association sees it is live with both products approved
  await page.reload();
  await expect(page.getByText("Jeres profil er godkendt")).toBeVisible();
  const rows = page.getByRole("row");
  await expect(rows.filter({ hasText: "Opslag på sociale medier" })).toContainText("Godkendt");
  await expect(rows.filter({ hasText: "Navnesponsor for julestævnet" })).toContainText("Godkendt");
  await expect(rows.filter({ hasText: "Navnesponsor for julestævnet" })).toContainText("4.500,00");
});

test("demo-foreningen ser sine godkendte produkter", async ({ page }) => {
  await loginAs(page, "association");
  await expect(page.getByRole("row").filter({ hasText: "Banner ved kunstgræsbanen" })).toContainText(
    "Godkendt",
  );
  void DEMO_PASSWORD;
});
