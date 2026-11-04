# Datamodel

Kilden til sandheden er Drizzle-skemaerne i `src/modules/*/schema.ts` og SQL-migrationerne i `drizzle/`. Dette dokument forklarer modellen og den planlagte udvidelse.

## Fælles konventioner

- Primærnøgler er UUID (`gen_random_uuid()`), aldrig fortløbende tal.
- Kolonner i `snake_case`, tidsstempler `timestamptz` (`created_at`, `updated_at`).
- Beløb: heltal i øre (`*_minor`) plus valutakode. Momsbehandling gemmes eksplicit.
- Data, der refereres af bekræftede kampagner, slettes aldrig; den arkiveres (`archived_at`) eller får status `archived`.
- Bekræftede kommercielle vilkår gemmes som uforanderlige snapshots (fra M4).
- Hver skemaændring er en migration. Migrationer redigeres aldrig efter de er kørt på staging/produktion.

## Tabeller i Milestone 0

### Identitet (`src/modules/identity/schema.ts`)

| Tabel                      | Formål                                      | Vigtige felter og constraints                                                                                                                                                  |
| -------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `users`                    | Personer, der kan logge ind                 | `email` unik, `email_verified`                                                                                                                                                 |
| `sessions`                 | Aktive sessioner (Better Auth)              | `token` unik, `user_id` → users (cascade)                                                                                                                                      |
| `accounts`                 | Login-metoder; `password` er en scrypt-hash | `provider_id = 'credential'` for e-mail/adgangskode                                                                                                                            |
| `verifications`            | Tokens til e-mailbekræftelse og nulstilling | udløber                                                                                                                                                                        |
| `rate_limits`              | Tællere til rate limiting af auth-endpoints | `key` unik                                                                                                                                                                     |
| `organizations`            | En forening, virksomhed eller platformen    | `type` (`association`/`company`/`platform`), `status` (`draft`/`pending_review`/`active`/`suspended`/`archived`), `is_demo`. Højst én `platform`-række (partielt unikt indeks) |
| `organization_memberships` | Bruger ↔ organisation med rolle             | (`user_id`, `organization_id`) unik; `role` `admin`/`member`; sletning af organisation er `restrict`                                                                           |

### Audit (`src/modules/audit/schema.ts`)

| Tabel          | Formål                                                                                                                                                                                                                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audit_events` | Append-only: `action` (f.eks. `organization.status_changed`), `entity_type`, `entity_id`, `actor_user_id`, `metadata` (jsonb). En databasetrigger afviser `UPDATE` og `DELETE`. Fremmednøgler er `restrict`: brugere og organisationer anonymiseres eller arkiveres i stedet for at blive slettet. |

### Konfiguration (`src/modules/config/schema.ts`)

| Tabel                    | Formål                                                                                                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `configuration_versions` | Én række pr. version af en regel. (`key`, `version`) unik. `value` jsonb (SQL NULL = ikke fastlagt), `status` `proposed_default`/`approved`, `created_by_user_id`. Nyeste version gælder. |

### Katalog (`src/modules/catalog/schema.ts`)

| Tabel                | Formål                                                                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog_categories` | Kategorier som data (ikke enum): `slug` unik og stabil, `name`, `description`, `sort_order`, `archived_at`. Seedes med de seks kategorier fra specifikationen. |

## Tabeller i Milestone 1 (Udbud)

### Katalog (udvidet, `src/modules/catalog/schema.ts`)

| Tabel               | Formål                                                                                                                                                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `product_templates` | Standardprodukter, som admin vedligeholder: `slug` unik, `category_id` → catalog_categories (restrict), `name`, `description`, `unit`, `minimum_deliverables`, `evidence_requirements`, prisinterval `price_min_minor` ≤ `suggested_price_minor` ≤ `price_max_minor` (check), `currency`, `archived_at` |
| `industries`        | Brancher som data (bruges til foreningers udelukkelser og senere virksomheder): `slug` unik, `name`, `sort_order`, `archived_at`                                                                                                                                                                        |

### Foreninger (`src/modules/associations/schema.ts`)

| Tabel                   | Formål                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `associations`          | Profil pr. forenings-organisation (PK = `organization_id`): CVR, foreningstype, adresse, kommune, `region` (enum), kontaktperson, beskrivelse, aktiviteter, medlemstal, aldersgrupper (`text[]`), faciliteter, momsregistrering (nullable = ukendt), `onboarding_step`, `submitted_at`, `reviewed_at`, `review_note`                                                 |
| `association_channels`  | Kommunikationskanaler: `kind` (enum), navn, URL, `audience_count` og `audience_basis` (`stated`/`measured`), `archived_at`                                                                                                                                                                                                                                           |
| `association_locations` | Fysiske steder: `kind` (enum), navn, adresse, postnummer, by, beskrivelse, koordinater (udfyldes ved geokodning i M2), `archived_at`                                                                                                                                                                                                                                 |
| `industry_exclusions`   | Brancher foreningen ikke vil samarbejde med: (`organization_id`, `industry_id`) unik, valgfri `expires_on`                                                                                                                                                                                                                                                           |
| `association_offerings` | Produkter: `kind` (`standard`/`custom`), `template_id` (krævet for standard, check), `category_id`, titel, beskrivelse, enhed, `price_minor` ≥ 0, `capacity` > 0, periode `available_from` ≤ `available_to` (check), dokumentationskrav, valgfri `channel_id`/`location_id`, `status` (`draft`/`pending_review`/`approved`/`rejected`/`archived`), gennemgangsfelter |

Et produkt er _publiceret_, når det er `approved` og foreningen er `active`. Statusovergangene er beskrevet i `ARCHITECTURE.md` og ADR-013. Alle nye tabeller har RLS slået til (`drizzle/0003_supply.sql`). `offering_availability` og `offering_media` fra den oprindelige plan er udskudt: tilgængelighed er foreløbig en periode plus en fritekst på produktet, og medier står i `BACKLOG.md`.

## Planlagt udvidelse (fra spec afsnit 13)

Tabellerne tilføjes i den milestone, der bruger dem. Navne kan blive justeret, og ændringer noteres i `DECISIONS.md`.

| Milestone              | Tabeller                                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| M2 Efterspørgsel       | `companies` (profil pr. virksomheds-organisation), `campaigns`, `campaign_briefs`, `campaign_items`                                 |
| M3 Anbefaling          | Ingen nye tabeller forventet; vægte i `configuration_versions`                                                                      |
| M4 Kontrahering        | `campaign_invitations`, `campaign_approvals`, `campaign_terms_versions`, `campaign_confirmation_snapshots` (uforanderlige)          |
| M5 Levering og økonomi | `delivery_tasks`, `delivery_evidence`, `delivery_reviews`, `invoice_records`, `payables`, `payout_records`, `financial_adjustments` |

`users`, `organizations`, `organization_memberships`, `audit_events`, `configuration_versions` og M1-tabellerne fra spec afsnit 13 findes allerede.
