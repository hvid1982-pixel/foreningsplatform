/**
 * Request-scoped loader for the signed-in user's association. Cached per
 * request, so layouts and pages can both call it.
 */
import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { getAssociationOverview } from "@/modules/associations/service";
import { getConfigValue } from "@/modules/config/service";
import { requireOrganizationAdmin } from "./session";

export const loadCurrentAssociation = cache(async () => {
  const { actor, membership } = await requireOrganizationAdmin("association");
  const overview = await getAssociationOverview(db, actor, membership.organizationId);
  return { actor, overview };
});

export const loadBookingUrl = cache(() => getConfigValue(db, "onboarding.booking_url"));
