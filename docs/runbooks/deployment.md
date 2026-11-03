# Deployment: Vercel og Supabase

Staging kører på Vercel med en Supabase-database i EU. Hver pull request får et preview-link. Alle konti og hemmeligheder ejes af projektets ejer.

## 1. Supabase (database)

1. Opret et projekt i region **Central EU (Frankfurt)**, f.eks. `foreningsplatform-staging`. Gem databaseadgangskoden i en password manager.
2. **Slå Data API fra:** Project Settings → Data API → slå den automatiske REST-API fra. Appen bruger den ikke. (Alle tabeller har desuden RLS slået til uden politikker som ekstra sikring, se ADR-011.)
3. Find forbindelsesstrengen: klik **Connect** øverst i projektet → **Transaction pooler** (port 6543) → kopiér URI'en og indsæt din databaseadgangskode i stedet for `[YOUR-PASSWORD]`.
   - Transaction pooler er nødvendig på Vercel (serverless). Appen har prepared statements slået fra, så det virker.

## 2. Vercel (hosting)

1. **Add New → Project** → importér GitHub-repoet `foreningsplatform`.
2. Framework: Next.js (registreres automatisk).
3. **Build Command:** `pnpm vercel-build` (Settings → Build and Deployment → Build Command → Override).
4. Region for functions: **Frankfurt (fra1)** (Settings → Functions), så appen ligger tæt på databasen.
5. Tilføj miljøvariablerne nedenfor (Settings → Environment Variables), og deploy.

### Miljøvariabler

| Navn                      | Værdi                                                                                   | Miljøer             |
| ------------------------- | --------------------------------------------------------------------------------------- | ------------------- |
| `APP_ENV`                 | `staging`                                                                               | Production, Preview |
| `DATABASE_URL`            | Supabase Transaction pooler-URI (se ovenfor)                                            | Production, Preview |
| `BETTER_AUTH_SECRET`      | Tilfældig streng, mindst 32 tegn: `openssl rand -base64 32` (eller en password manager) | Production, Preview |
| `EMAIL_TRANSPORT`         | `log` indtil en mailudbyder er valgt (bekræftelseslinks skrives så i Vercels logs)      | Production, Preview |
| `EMAIL_FROM`              | `Foreningsplatform <no-reply@dit-domæne.dk>`                                            | Production, Preview |
| `SEED_DEMO_PASSWORD`      | Adgangskode til DEMO-konti, mindst 10 tegn. Del den kun med testere.                    | Production, Preview |
| `RUN_MIGRATIONS_ON_BUILD` | `true`                                                                                  | Production          |
| `SEED_ON_BUILD`           | `true` (genskaber DEMO-data hvis de mangler; overskriver intet)                         | Production          |

`BETTER_AUTH_URL` skal ikke sættes på Vercel; appen udleder adressen af `VERCEL_URL`, `VERCEL_BRANCH_URL` og `VERCEL_PROJECT_PRODUCTION_URL`. Sæt den kun, når et eget domæne er tilknyttet (f.eks. `https://app.dit-domæne.dk`).

Når en mailudbyder er valgt, sættes `EMAIL_TRANSPORT=smtp` og `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE` fra udbyderen.

### Migrationer på staging

- Production-deployet (fra `main`) kører `pnpm db:migrate` før build, når `RUN_MIGRATIONS_ON_BUILD=true`.
- Preview-deploys deler staging-databasen, men migrerer ikke. Et preview med en ny migration virker derfor først fuldt ud, når den er merget. Migrationer skrives bagudkompatible (se CHANGE_PROCESS), så det ikke ødelægger noget.

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
