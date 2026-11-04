/**
 * Reading and changing versioned business configuration.
 */
import { desc, eq, max } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { ValidationError } from "@/lib/errors";
import { recordAuditEvent } from "@/modules/audit/service";
import type { Actor } from "@/modules/identity/actor";
import { assertPlatformAdmin } from "@/modules/identity/policies";
import { configDefinitions, configKeys, type ConfigKey, type ConfigValue } from "./definitions";
import { configurationVersions, type ConfigurationStatus } from "./schema";

export type ResolvedConfig<K extends ConfigKey = ConfigKey> = {
  key: K;
  value: ConfigValue<K>;
  /** `code_default` means nothing has been saved yet; the code default applies. */
  status: ConfigurationStatus | "code_default";
  version: number | null;
  updatedAt: Date | null;
};

/** Current value of a rule: the newest saved version, else the code default. */
export async function getConfig<K extends ConfigKey>(db: Database, key: K): Promise<ResolvedConfig<K>> {
  const latest = await db.query.configurationVersions.findFirst({
    where: eq(configurationVersions.key, key),
    orderBy: desc(configurationVersions.version),
  });
  if (!latest) {
    return {
      key,
      value: configDefinitions[key].defaultValue as ConfigValue<K>,
      status: "code_default",
      version: null,
      updatedAt: null,
    };
  }
  // Re-validate on read so a stale or hand-edited row can never break callers.
  const parsed = configDefinitions[key].schema.safeParse(latest.value);
  return {
    key,
    value: (parsed.success ? parsed.data : configDefinitions[key].defaultValue) as ConfigValue<K>,
    status: latest.status,
    version: latest.version,
    updatedAt: latest.createdAt,
  };
}

export async function getConfigValue<K extends ConfigKey>(db: Database, key: K): Promise<ConfigValue<K>> {
  return (await getConfig(db, key)).value;
}

/** All rules with their current values, for the admin console. */
export async function listConfig(db: Database, actor: Actor): Promise<ResolvedConfig[]> {
  assertPlatformAdmin(actor);
  return Promise.all(configKeys.map((key) => getConfig(db, key)));
}

/**
 * Saves a new version of a rule. Platform admins only; validated and audited.
 * Previous versions are kept.
 */
export async function setConfigValue<K extends ConfigKey>(
  db: Database,
  actor: Actor,
  input: { key: K; value: unknown; status: ConfigurationStatus; note?: string },
): Promise<ResolvedConfig<K>> {
  assertPlatformAdmin(actor);
  const definition = configDefinitions[input.key];
  if (!definition) throw new ValidationError(`Unknown config key ${String(input.key)}`);
  const parsed = definition.schema.safeParse(input.value);
  if (!parsed.success) throw new ValidationError(`Invalid value for ${input.key}`, parsed.error.flatten());

  await db.transaction(async (tx) => {
    const [{ current }] = await tx
      .select({ current: max(configurationVersions.version) })
      .from(configurationVersions)
      .where(eq(configurationVersions.key, input.key));
    const version = (current ?? 0) + 1;
    await tx.insert(configurationVersions).values({
      key: input.key,
      version,
      value: parsed.data,
      status: input.status,
      note: input.note ?? null,
      createdByUserId: actor.userId,
    });
    await recordAuditEvent(tx, {
      actor,
      action: "config.value_set",
      entityType: "configuration",
      entityId: input.key,
      metadata: { version, value: parsed.data, status: input.status },
    });
  });
  return getConfig(db, input.key);
}

/** Inserts the code default as version 1 (status `proposed_default`) if nothing is saved yet. */
export async function ensureConfigDefaults(db: Database): Promise<void> {
  for (const key of configKeys) {
    const existing = await db.query.configurationVersions.findFirst({
      where: eq(configurationVersions.key, key),
    });
    if (existing) continue;
    await db
      .insert(configurationVersions)
      .values({
        key,
        version: 1,
        value: configDefinitions[key].defaultValue,
        status: "proposed_default",
        note: configDefinitions[key].source,
      })
      .onConflictDoNothing();
  }
}
