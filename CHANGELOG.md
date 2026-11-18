# Changelog

Formatet følger [Keep a Changelog](https://keepachangelog.com/da/1.1.0/). Versioner følger milepælene.

## [Unreleased]

### Tilføjet – Milestone 1: Udbud

- Foreningers onboarding i seks trin med kladde: stamdata, profil, kanaler og steder, produkter, udelukkede brancher, forhåndsvisning og indsendelse. Profilen kan rettes bagefter.
- Standardkatalog med ni standardprodukter (minimumsleverance, dokumentationskrav, vejledende prisramme) og 17 brancher. Priserne er forslag og ikke endelige.
- Foreningers egne produkter med prisforslag, kapacitet, periode og dokumentationskrav.
- Admin: godkendelseskø, gennemgang af forening med godkend/send tilbage, godkendelse eller afvisning af produkter med mulighed for at rette prisen, skift af organisationsstatus, redigering og arkivering af standardprodukter, redigering af forretningsregler.
- Knap til at booke onboardinghjælp, som vises, når admin har indtastet et link.
- Migration `0003_supply` med tabellerne `associations`, `association_channels`, `association_locations`, `industry_exclusions`, `association_offerings`, `product_templates` og `industries` (alle med RLS).
- DEMO-foreningen har nu en fuld profil, kanaler, et sted og tre produkter.
- Tests: forretningsregler for udbud (unit), onboarding, godkendelse, publicering og adgangskontrol (integration), hele forløbet fra ny forening til publicerede produkter samt bookinglink (E2E).

### Tilføjet

- `vercel.json` med build-kommando og region (Dublin, samme som databasen), så Vercel kun kræver miljøvariabler.

### Rettet

- Sider på Vercel kunne hænge i 5 minutter og give timeout. Databasedriveren er skiftet fra postgres.js til node-postgres med timeouts og `attachDatabasePool` (ADR-012).
- Node-versionen er låst til 22.x (`engines`), så Vercel bygger med samme version som CI og lokal udvikling.

## [0.1.0] – Milestone 0: Fundament – 2026-11-03

### Tilføjet

- Next.js 16-app med TypeScript strict, Tailwind CSS, Radix-baserede UI-komponenter og dansk UI.
- PostgreSQL med Drizzle ORM og SQL-migrationer (`0000_init`, `0001_audit_events_append_only`, `0002_enable_rls_deny_by_default`).
- Login med e-mail og adgangskode (Better Auth): oprettelse, e-mailbekræftelse, log ind/ud, glemt/nulstil adgangskode, rate limiting.
- Organisationer (forening, virksomhed, platform) og medlemskaber med roller; selvbetjent oprettelse på `/kom-i-gang`.
- Tenant-isolation og platformadmin-kontrol i services, dækket af integrationstests.
- Dashboards for forening, virksomhed og admin; admin-sider for organisationer, forretningsregler og auditlog.
- Versionerede forretningsregler med standardværdier fra specifikationen, mærket "ikke endeligt godkendt".
- Append-only auditlog håndhævet af en databasetrigger.
- Katalogkategorier som data (seks kategorier fra specifikationen).
- Idempotent seed-script med DEMO-konti for alle roller; afvises i produktion.
- `pnpm admin:create` til oprettelse af platformadmins.
- `/api/health`, struktureret logning, danske fejlsider, sikkerhedsheaders.
- Vitest (unit og integration mod Postgres), Playwright (E2E på desktop og mobil), GitHub Actions CI.
- Dokumentation: README, ARCHITECTURE, DATA_MODEL, DECISIONS, BACKLOG, CHANGE_PROCESS, deployment-runbook, testrapport.
