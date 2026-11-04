# Foreningsplatform

En markedsplads, hvor virksomheder finder og køber eksponering og aktivering hos foreninger, med kampagneplanlægning, godkendelser, leveringsdokumentation og fakturering efter kampagnen.

**Status:** Milestone 0 (fundament). Login, roller, tenant-isolation, admin, forretningsregler og auditlog virker. Markedspladsfunktionerne bygges i Milestone 1–6, se [`BACKLOG.md`](BACKLOG.md).

| Dokument                                                     | Indhold                                          |
| ------------------------------------------------------------ | ------------------------------------------------ |
| [`ARCHITECTURE.md`](ARCHITECTURE.md)                         | Opbygning, lag, moduler og sikkerhedsmodel       |
| [`DATA_MODEL.md`](DATA_MODEL.md)                             | Tabeller nu og planlagt datamodel                |
| [`DECISIONS.md`](DECISIONS.md)                               | Trufne beslutninger og midlertidige standardvalg |
| [`CHANGELOG.md`](CHANGELOG.md)                               | Ændringer pr. version                            |
| [`BACKLOG.md`](BACKLOG.md)                                   | Milepæle og åbne beslutninger                    |
| [`docs/CHANGE_PROCESS.md`](docs/CHANGE_PROCESS.md)           | Sådan ændres platformen sikkert                  |
| [`docs/runbooks/deployment.md`](docs/runbooks/deployment.md) | Vercel + Supabase opsætning og drift             |
| [`docs/specs/`](docs/specs/)                                 | Den oprindelige specifikation                    |
| [`docs/test-reports/`](docs/test-reports/)                   | Testrapport pr. milestone                        |

## Teknologi

Next.js 16 (App Router) · TypeScript · PostgreSQL · Drizzle ORM · Better Auth · Tailwind CSS + Radix (shadcn/ui-stil) · Vitest · Playwright · GitHub Actions. Begrundelser i [`DECISIONS.md`](DECISIONS.md).

## Kom i gang lokalt

Krav: Node.js 22+, pnpm 10 (`corepack enable`), Docker.

```bash
git clone https://github.com/hvid1982-pixel/foreningsplatform.git
cd foreningsplatform
pnpm install
cp .env.example .env          # ret BETTER_AUTH_SECRET (openssl rand -base64 32)
docker compose up -d          # Postgres (5432) + Mailpit (SMTP 1025, inbox http://localhost:8025)
pnpm db:migrate               # opretter tabellerne
pnpm db:seed                  # referencedata + DEMO-konti
pnpm dev                      # http://localhost:3000
```

Uden Docker: brug en lokal PostgreSQL 16 og opret databaserne `foreningsplatform` og `foreningsplatform_test`, og sæt `EMAIL_TRANSPORT=log` (mails skrives så i terminalen).

### Demo-konti

Alle har adgangskoden `Demo-adgangskode-2026` lokalt (på staging: værdien af `SEED_DEMO_PASSWORD`).

| Rolle             | E-mail                    | Lander på     |
| ----------------- | ------------------------- | ------------- |
| Platformadmin     | `admin@example.com`       | `/admin`      |
| Forening (aktiv)  | `forening@example.com`    | `/forening`   |
| Forening (kladde) | `forening2@example.com`   | `/forening`   |
| Virksomhed        | `virksomhed@example.com`  | `/virksomhed` |
| Virksomhed        | `virksomhed2@example.com` | `/virksomhed` |

Nye brugere opretter sig på `/opret-konto`, bekræfter e-mail (se Mailpit) og opretter derefter deres forening eller virksomhed på `/kom-i-gang`. Platformadmins kan kun oprettes fra kommandolinjen:

```bash
ADMIN_PASSWORD='en-lang-adgangskode' pnpm admin:create -- --email navn@firma.dk --name "Navn"
```

## Kommandoer

| Kommando                    | Formål                                                              |
| --------------------------- | ------------------------------------------------------------------- |
| `pnpm dev`                  | Udviklingsserver                                                    |
| `pnpm build` / `pnpm start` | Produktionsbuild og -server                                         |
| `pnpm check`                | Lint, typecheck, formattering og alle unit/integrationstests        |
| `pnpm test`                 | Unit- og integrationstests (bruger `TEST_DATABASE_URL`, som tømmes) |
| `pnpm test:e2e`             | Playwright end-to-end (kræver migreret og seedet dev-database)      |
| `pnpm db:generate`          | Lav en ny SQL-migration ud fra ændringer i `schema.ts`              |
| `pnpm db:migrate`           | Kør ventende migrationer                                            |
| `pnpm db:seed`              | Referencedata og DEMO-konti (idempotent; afvises i produktion)      |
| `pnpm db:reset`             | Slet og genopbyg den lokale database (kun `APP_ENV=development`)    |
| `pnpm db:studio`            | Drizzle Studio til at se data                                       |
| `pnpm admin:create`         | Opret eller forfrem en platformadmin                                |

## Projektstruktur

```
src/
  app/          Ruter (sider, layouts, server actions, API-routes). Tynde: kalder services.
  components/   UI-komponenter. ui/ = basiskomponenter i shadcn/ui-stil.
  modules/      Forretningslogik pr. domæne: schema, service, policies, validation, tests.
  server/       Request-bundet kode: session/Data Access Layer.
  lib/          Infrastruktur: db, auth, e-mail, env, logger, money, format.
  messages/     Al dansk UI-tekst.
  db/schema.ts  Samler alle modulers tabeller.
drizzle/        Versionerede SQL-migrationer.
scripts/        Migrate, seed, admin-oprettelse, Vercel-build.
tests/          integration/ (mod rigtig Postgres), e2e/ (Playwright), support/.
docs/           Specifikation, runbooks, testrapporter, skærmbilleder.
```

## Bidrag

Se [`docs/CHANGE_PROCESS.md`](docs/CHANGE_PROCESS.md). Kort: én branch og pull request pr. ændring, tests og dokumentation i samme PR, CI skal være grøn.
