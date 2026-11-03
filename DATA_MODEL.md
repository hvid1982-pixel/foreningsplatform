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

## Planlagt udvidelse (fra spec afsnit 13)

Tabellerne tilføjes i den milestone, der bruger dem. Navne kan blive justeret, og ændringer noteres i `DECISIONS.md`.

| Milestone              | Tabeller                                                                                                                                                                                                                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1 Udbud               | `associations` (profil pr. forenings-organisation), `association_locations` (adresse, kommune, region, koordinater), `association_channels` (kanal, målgruppestørrelse vs. målt rækkevidde), `industry_exclusions` (med evt. udløbsdato), `product_templates`, `association_offerings`, `offering_availability`, `offering_media` |
| M2 Efterspørgsel       | `companies` (profil pr. virksomheds-organisation), `campaigns`, `campaign_briefs`, `campaign_items`                                                                                                                                                                                                                               |
| M3 Anbefaling          | Ingen nye tabeller forventet; vægte i `configuration_versions`                                                                                                                                                                                                                                                                    |
| M4 Kontrahering        | `campaign_invitations`, `campaign_approvals`, `campaign_terms_versions`, `campaign_confirmation_snapshots` (uforanderlige)                                                                                                                                                                                                        |
| M5 Levering og økonomi | `delivery_tasks`, `delivery_evidence`, `delivery_reviews`, `invoice_records`, `payables`, `payout_records`, `financial_adjustments`                                                                                                                                                                                               |

`users`, `organizations`, `organization_memberships`, `audit_events` og `configuration_versions` fra spec afsnit 13 findes allerede.
