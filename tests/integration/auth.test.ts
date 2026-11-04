import { beforeEach, describe, expect, it } from "vitest";
import { auth } from "@/lib/auth";
import { sentEmailsForTests } from "@/lib/email";
import { resetDatabase } from "../support/db";

beforeEach(async () => {
  await resetDatabase();
  sentEmailsForTests.length = 0;
});

const credentials = { email: "ny@example.com", password: "en-sikker-adgangskode", name: "Ny Bruger" };

describe("authentication", () => {
  it("requires e-mail verification before sign-in, then allows it", async () => {
    await auth.api.signUpEmail({ body: credentials });

    const mail = sentEmailsForTests.find((m) => m.to === credentials.email);
    expect(mail?.subject).toBe("Bekræft din e-mailadresse");

    await expect(
      auth.api.signInEmail({ body: { email: credentials.email, password: credentials.password } }),
    ).rejects.toMatchObject({ body: { code: "EMAIL_NOT_VERIFIED" } });

    const token = new URL(mail!.text.match(/https?:\/\/\S+/)![0]).searchParams.get("token")!;
    await auth.api.verifyEmail({ query: { token } });

    const result = await auth.api.signInEmail({
      body: { email: credentials.email, password: credentials.password },
    });
    expect(result.user.email).toBe(credentials.email);
  });

  it("rejects short passwords and wrong passwords", async () => {
    await expect(auth.api.signUpEmail({ body: { ...credentials, password: "kort" } })).rejects.toMatchObject({
      body: { code: "PASSWORD_TOO_SHORT" },
    });
    await auth.api.signUpEmail({ body: credentials });
    await expect(
      auth.api.signInEmail({ body: { email: credentials.email, password: "forkert-adgangskode" } }),
    ).rejects.toMatchObject({ body: { code: "INVALID_EMAIL_OR_PASSWORD" } });
  });

  it("stores only a password hash", async () => {
    await auth.api.signUpEmail({ body: credentials });
    const { db } = await import("@/lib/db");
    const accounts = await db.query.accounts.findMany();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].password).not.toContain(credentials.password);
    expect(accounts[0].password?.length).toBeGreaterThan(40);
  });
});
