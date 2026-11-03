import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { configurationVersions } from "@/modules/config/schema";
import {
  ensureConfigDefaults,
  getConfig,
  getConfigValue,
  listConfig,
  setConfigValue,
} from "@/modules/config/service";
import { createOrgWithAdmin, createPlatformAdmin, resetDatabase } from "../support/db";

beforeEach(resetDatabase);

describe("versioned configuration", () => {
  it("falls back to the code default when nothing is saved", async () => {
    const config = await getConfig(db, "campaigns.association_response_window_hours");
    expect(config).toMatchObject({ value: 72, status: "code_default", version: null });
  });

  it("ensureConfigDefaults stores proposed defaults once", async () => {
    await ensureConfigDefaults(db);
    await ensureConfigDefaults(db);
    const rows = await db.select().from(configurationVersions);
    expect(rows.every((r) => r.version === 1 && r.status === "proposed_default")).toBe(true);
    expect(await getConfigValue(db, "finance.platform_fee_basis_points")).toBeNull();
  });

  it("admins save new versions; history is kept and every change is audited", async () => {
    const admin = await createPlatformAdmin();
    await ensureConfigDefaults(db);
    await setConfigValue(db, admin, {
      key: "campaigns.association_response_window_hours",
      value: 48,
      status: "approved",
    });
    const latest = await getConfig(db, "campaigns.association_response_window_hours");
    expect(latest).toMatchObject({ value: 48, status: "approved", version: 2 });

    const all = await listConfig(db, admin);
    expect(all.find((c) => c.key === "campaigns.association_response_window_hours")?.value).toBe(48);
  });

  it("rejects invalid values and non-admins", async () => {
    const admin = await createPlatformAdmin();
    await expect(
      setConfigValue(db, admin, {
        key: "campaigns.association_response_window_hours",
        value: -1,
        status: "approved",
      }),
    ).rejects.toMatchObject({ code: "validation" });
    await expect(
      setConfigValue(db, admin, { key: "onboarding.booking_url", value: "not a url", status: "approved" }),
    ).rejects.toMatchObject({ code: "validation" });

    const { actor } = await createOrgWithAdmin("association");
    await expect(
      setConfigValue(db, actor, {
        key: "campaigns.association_response_window_hours",
        value: 1,
        status: "approved",
      }),
    ).rejects.toMatchObject({ code: "forbidden" });
    await expect(listConfig(db, actor)).rejects.toMatchObject({ code: "forbidden" });
  });
});
