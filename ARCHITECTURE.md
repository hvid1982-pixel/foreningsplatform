# Arkitektur

Foreningsplatform er en **modulær monolit**: én Next.js-applikation, én PostgreSQL-database og en tydelig opdeling i domænemoduler. Der er ingen separat API-server, ingen microservices og ingen forretningslogik gemt i en leverandørs dashboard.

## Lag

```
Browser
  │  HTML/RSC, formularer, Better Auth-klient
  ▼
src/app            Ruter: sider, layouts, server actions, route handlers.
  │                Tynde. Læser input, kalder services, viser resultat.
  ▼
src/server         Request-bundet: getCurrentActor(), requireActor(), requirePlatformAdmin().
  │                (Data Access Layer – den eneste vej til "hvem er brugeren").
  ▼
src/modules/*      Forretningslogik. Ren TypeScript uden Next.js/React (håndhæves af ESLint).
  │   service.ts      Use cases. Tager (db, actor, input). Validerer, tjekker adgang, skriver audit.
  │   policies.ts     Rene adgangsregler (unit-testet).
  │   validation.ts   Zod-skemaer, delt med formularer.
  │   schema.ts       Drizzle-tabeller for modulet.
  ▼
src/lib            Infrastruktur: db (Drizzle/node-postgres, se ADR-012), auth (Better Auth), email, env, logger, money.
  ▼
PostgreSQL         Tabeller, constraints, migrationer (drizzle/), audit-trigger.
```

**Regel:** komponenter og sider indeholder aldrig forretnings- eller økonomilogik. Hvis en side skal beregne, filtrere efter rettigheder eller ændre data, sker det i en service.

## Moduler

| Modul          | Ansvar                                                                                      | Status |
| -------------- | ------------------------------------------------------------------------------------------- | ------ |
| `identity`     | Brugere, organisationer (forening/virksomhed/platform), medlemskaber, roller, adgangsregler | M0     |
| `audit`        | Append-only log over væsentlige handlinger                                                  | M0     |
| `config`       | Versionerede forretningsregler med standardværdier                                          | M0     |
| `catalog`      | Kategorier (M0), produktskabeloner og foreningers tilbud (M1)                               | M0/M1  |
| `associations` | Foreningsprofil, kanaler, lokationer, brancheudelukkelser                                   | M1     |
| `discovery`    | Søgning, filtre, kort/liste                                                                 | M2     |
| `campaigns`    | Kampagnebygger, invitationer, godkendelser, snapshots, statusmaskine                        | M2–M4  |
| `matching`     | Anbefalinger med konfigurerbare, deterministiske regler                                     | M3     |
| `fulfillment`  | Leveringsopgaver, dokumentation, review                                                     | M5     |
| `finance`      | Fakturaregistrering, tilgodehavender, udbetalinger, justeringer                             | M5     |

Nye moduler oprettes først, når en milestone har brug for dem. Modulers tabeller registreres i `src/db/schema.ts`.

## Autentifikation og autorisation

- **Autentifikation** (hvem er du): Better Auth med e-mail og adgangskode, krav om e-mailbekræftelse, nulstilling af adgangskode, sessioner i databasen og rate limiting (i Postgres, så det virker på tværs af serverless-instanser). Endpoints under `/api/auth/*`.
- **Autorisation** (hvad må du): i applikationen, ikke i databasen. Hver service-funktion tager en `Actor` (bruger + medlemskaber) og kalder en `assert*`-politik, før den læser eller skriver.
- **Tenant-isolation:** data tilhørende en organisation må kun ses af dens medlemmer og af platformadmins. Integrationstests i `tests/integration/tenant-isolation.test.ts` beviser det.
- **Platformadmin** er et `admin`-medlemskab af den ene `platform`-organisation (unik i databasen). Kan kun oprettes via `pnpm admin:create`. Admins får læseadgang til alt, men ikke automatisk skriveadgang til foreningers eller virksomheders data; admin-handlinger skal gå gennem dedikerede, auditerede funktioner.
- **Proxy** (`src/proxy.ts`) sender anonyme besøg på beskyttede ruter til login. Det er kun et hurtigt filter; den egentlige kontrol sker i `src/server/session.ts` og i services.
- Row-level security er slået til på alle tabeller **uden politikker** (ADR-011). Det lukker for Supabases automatiske REST-API (rollerne `anon`/`authenticated`), mens appen, der forbinder som tabelejer, ikke påvirkes. Adgangsreglerne ligger stadig i applikationen (ADR-003). Nye tabeller skal også have RLS slået til; en test tjekker det.

## Rendering (Next.js 16)

`cacheComponents` og `partialPrefetching` er slået til (frameworkets nye standard). Konsekvens:

- Statisk indhold (layout, overskrifter, landingsside) prerenderes.
- Alt, der læser sessionen, ligger i en komponent bag `<Suspense>` og streames ved forespørgsel. Mønstret ses i alle sider under `src/app/forening`, `virksomhed` og `admin`.
- `src/app/admin/layout.tsx` har `export const instant = false`. I udviklingstilstand kan Next.js stadig logge "Could not validate `instant`" ved en omdirigering af ikke-admins; det er forventet.

## Fejl, logging og overvågning

- Services kaster `DomainError` (`not_found`, `forbidden`, `validation`, `conflict`). Server actions oversætter dem til danske beskeder.
- `src/lib/logger.ts`: struktureret JSON-logning (pino) med maskering af adgangskoder og tokens.
- `GET /api/health`: 200 med databasestatus, 503 hvis databasen ikke svarer. Brug den til uptime-overvågning.
- Fejlsiderne `src/app/error.tsx` og `not-found.tsx` er på dansk. Sentry eller lignende kan tilføjes senere (BACKLOG).

## Penge

Alle beløb er heltal i mindste enhed (øre) med valutakode. Brug `src/lib/money.ts`; aldrig floats. Gebyrer regnes i basispoint. Bekræftede kampagner får uforanderlige snapshots af priser og gebyrer (M4), så senere ændringer af katalog eller regler aldrig ændrer en indgået aftale.

## Konfiguration af forretningsregler

`src/modules/config/definitions.ts` er registret over alle regler, som specifikationen kalder konfigurerbare (svarfrist, godkendelseskrav, gebyr osv.). Hver regel har et Zod-skema, en standardværdi og en kilde. Gemte værdier ligger versioneret i `configuration_versions` med status `proposed_default` eller `approved`. Kode læser altid via `getConfigValue()`.

## Miljøer

| Miljø            | `APP_ENV`     | Database                          | E-mail         |
| ---------------- | ------------- | --------------------------------- | -------------- |
| Lokal udvikling  | `development` | Docker Postgres                   | Mailpit (SMTP) |
| Tests            | `test`        | `foreningsplatform_test` (tømmes) | log            |
| Staging (Vercel) | `staging`     | Supabase (EU)                     | log eller SMTP |
| Produktion       | `production`  | Separat Supabase-projekt          | SMTP-udbyder   |

Se [`docs/runbooks/deployment.md`](docs/runbooks/deployment.md).
