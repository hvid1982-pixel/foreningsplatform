import { describe, expect, it } from "vitest";
import { configDefinitions, configKeys } from "./definitions";

describe("config definitions", () => {
  it.each(configKeys)("default for %s satisfies its own schema", (key) => {
    const definition = configDefinitions[key];
    expect(definition.schema.safeParse(definition.defaultValue).success).toBe(true);
    expect(definition.label.length).toBeGreaterThan(0);
    expect(definition.source.length).toBeGreaterThan(0);
  });

  it("keeps the spec's proposed defaults", () => {
    expect(configDefinitions["campaigns.association_response_window_hours"].defaultValue).toBe(72);
    expect(configDefinitions["catalog.custom_offering_requires_approval"].defaultValue).toBe(true);
    expect(configDefinitions["finance.payout_requires_company_payment"].defaultValue).toBe(true);
    // The platform fee is an open decision and must not be silently set.
    expect(configDefinitions["finance.platform_fee_basis_points"].defaultValue).toBeNull();
  });
});
