# Deployment: Vercel og Supabase

Staging kører på Vercel med en Supabase-database i EU. Hver pull request får et preview-link. Alle konti og hemmeligheder ejes af projektets ejer.

## 1. Supabase (database)

1. Opret et projekt i en EU-region (staging ligger i **West EU (Ireland)**, `eu-west-1`), f.eks. `foreningsplatform-staging`. Gem databaseadgangskoden i en password manager.
2. **Slå Data API fra:** Project Settings → Data API → slå den automatiske REST-API fra. Appen bruger den ikke. (Alle tabeller har desuden RLS slået til uden politikker som ekstra sikring, se ADR-011.)
3. Find forbindelsesstrengen: klik **Connect** øverst i projektet → **Transaction pooler** (port 6543) → kopiér URI'en og indsæt din databaseadgangskode i stedet for `[YOUR-PASSWORD]`.
   - Transaction pooler er nødvendig på Vercel (serverless). Appen har prepared statements slået fra, så det virker.

## 2. Vercel (hosting)

1. **Add New → Project** → importér GitHub-repoet `foreningsplatform`.
2. Build-kommando (`pnpm vercel-build`) og region (Dublin, `dub1`, tæt på databasen) er sat i `vercel.json` i repoet, så de skal ikke ændres i Vercel. Flyttes databasen, så ret `regions` i `vercel.json` til den nærmeste Vercel-region.
3. Tilføj miljøvariablerne nedenfor (Settings → Environment Variables), og deploy.

### Miljøvariabler

| Navn                      | Værdi                                                                                   | Miljøer             |
| ------------------------- | --------------------------------------------------------------------------------------- | ------------------- |
| `APP_ENV`                 | `staging`                                                                               | Production, Preview |
| `DATABASE_URL`            | Supabase Transaction pooler-URI (se ovenfor)                                            | Production, Preview |
| `BETTER_AUTH_SECRET`      | Tilfældig streng, mindst 32 tegn: `openssl rand -base64 32` (eller en password manager) | Production, Preview |
| `EMAIL_TRANSPORT`         | `log` indtil en mailudbyder er valgt (bekræftelseslinks skrives så i Vercels logs)      | Production, Preview |
| `EMAIL_FROM`              | `Foreningsplatform <no-reply@dit-domæne.dk>`                                            | Production, Preview |
| `SEED_DEMO_PASSWORD`      | Adgangskode til DEMO-konti, mindst 10 tegn. Del den kun med testere.                    | Production, Preview |
| `RUN_MIGRATIONS_ON_BUILD` | `true`                                                                                  | Production, Preview |
| `SEED_ON_BUILD`           | `true` (genskaber DEMO-data hvis de mangler; overskriver intet)                         | Production, Preview |

`BETTER_AUTH_URL` skal ikke sættes på Vercel; appen udleder adressen af `VERCEL_URL`, `VERCEL_BRANCH_URL` og `VERCEL_PROJECT_PRODUCTION_URL`. Sæt den kun, når et eget domæne er tilknyttet (f.eks. `https://app.dit-domæne.dk`).

Når en mailudbyder er valgt, sættes `EMAIL_TRANSPORT=smtp` og `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE` fra udbyderen.

### Migrationer på staging

- Hver build kører `pnpm db:migrate`, når `RUN_MIGRATIONS_ON_BUILD=true`.
- I pilotfasen deler Production og Preview én staging-database, og begge migrerer, så et preview-link kan vises, før pull requesten merges. Det er acceptabelt, fordi migrationer skrives bagudkompatible (se CHANGE_PROCESS). Når der kommer flere udviklere eller et rigtigt produktionsmiljø, får Preview sin egen database, eller `RUN_MIGRATIONS_ON_BUILD` slås fra i Preview.

## 3. Efter første deploy

1. Åbn `https://<projekt>.vercel.app/api/health` → `{"status":"ok","database":"ok"}`.
2. Log ind med `admin@example.com` og `SEED_DEMO_PASSWORD`.
3. Opret din egen platformadmin lokalt mod staging-databasen (kræver `DATABASE_URL` fra Supabase i din lokale shell):

   ```bash
   APP_ENV=staging DATABASE_URL='postgres://…:6543/postgres' BETTER_AUTH_SECRET='…' \
     ADMIN_PASSWORD='…' pnpm admin:create -- --email dig@firma.dk --name "Dit navn"
   ```

## Produktion (senere)

Før pilot med rigtige virksomheder og penge oprettes et **separat** Supabase-projekt og et Vercel-miljø med `APP_ENV=production`, en rigtig mailudbyder og et eget domæne. Seed-scriptet nægter at køre i produktion. Backup/restore-øvelse og driftsrunbook leveres i Milestone 6.

## Fejlfinding

| Symptom                                       | Årsag og løsning                                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Build fejler med "Ugyldig miljøkonfiguration" | En påkrævet variabel mangler; fejlen nævner hvilken.                                      |
| `/api/health` giver 503                       | `DATABASE_URL` er forkert, eller adgangskoden indeholder specialtegn, der skal URL-kodes. |
| "prepared statement already exists"           | Der bruges en session-pooler-URL; skift til Transaction pooler (port 6543).               |
| Login virker ikke på et preview-link          | Tjek at `BETTER_AUTH_URL` IKKE er sat i Preview-miljøet.                                  |
