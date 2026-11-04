# Beslutninger

Gældende beslutninger styrer projektet; den oprindelige specifikation (`docs/specs/`) er udgangspunktet. Hver beslutning har et nummer, en dato, en status og en begrundelse. En beslutning ændres ved at tilføje en ny, der erstatter den gamle ("Erstatter ADR-xxx"), så historikken bevares.

**Status:** `Besluttet` (godkendt af ejeren) · `Standardvalg` (midlertidigt og reversibelt, ikke endeligt godkendt) · `Åben` (kræver ejerens beslutning).

## Tekniske beslutninger

### ADR-001 · Modulær monolit i Next.js og TypeScript

2026-11-03 · Besluttet (Søren godkendte planen)
Én Next.js 16-app (App Router, TypeScript strict) med forretningslogik i `src/modules`. Færre bevægelige dele end separat frontend/API, og meget udbredt teknologi, så det er let at finde udviklere.

### ADR-002 · PostgreSQL med Drizzle ORM og SQL-migrationer i repoet

2026-11-03 · Besluttet
Typesikre forespørgsler. Migrationer er læsbar SQL i `drizzle/`. Supabase bruges kun som Postgres-vært, så vi kan skifte vært uden kodeændringer.

### ADR-003 · Better Auth og autorisation i applikationen (afviger fra spec afsnit 12)

2026-11-03 · Besluttet
Better Auth (open source) gemmer brugere og sessioner i vores egen database i stedet for Supabase Auth. Adgangsregler ligger i `policies.ts` pr. modul og tjekkes i services, i stedet for row-level security som primær mekanisme. Begrundelse: ingen leverandørbinding, og reglerne kan læses, testes og debugges samlet. RLS kan tilføjes som ekstra lag senere.

### ADR-004 · MapLibre i stedet for Mapbox som udgangspunkt (afviger fra spec afsnit 12)

2026-11-03 · Besluttet (konkret tile-udbyder vælges i M2)
Open source-kortbibliotek uden licensbinding. Listevisningen skal altid virke uden kort.

### ADR-005 · UI: Tailwind CSS og Radix-komponenter i shadcn/ui-stil

2026-11-03 · Besluttet
Komponentkoden ligger i `src/components/ui`, så der er ingen ekstern UI-afhængighed at opgradere. Bemærk: shadcn-CLI'ens registry var ikke tilgængelig fra udviklingsmiljøet, så komponenterne er skrevet i samme stil direkte oven på `radix-ui`.

### ADR-006 · Dansk UI-tekst samlet i `src/messages/da.ts`

2026-11-03 · Besluttet
Et typet objekt i stedet for et i18n-bibliotek, fordi der kun er ét sprog. Teksten kan gennemgås ét sted. Skal der flere sprog til, kan objektet flyttes til next-intl uden at ændre komponenternes struktur.

### ADR-007 · Next.js Cache Components slået til

2026-11-03 · Besluttet
Next.js 16's nye standard, som næste hovedversion gør obligatorisk. Sessionafhængigt indhold ligger bag `<Suspense>`. Se ARCHITECTURE.md.

### ADR-008 · Hosting: Vercel og Supabase i EU, konti i ejerens navn

2026-11-03 · Besluttet
Hver pull request får et preview-link. Ejeren ejer repository, konti, domæne, hemmeligheder og data.

### ADR-009 · Audit-loggen er append-only i databasen

2026-11-03 · Besluttet
En trigger afviser `UPDATE`/`DELETE` på `audit_events`. Brugere og organisationer slettes derfor ikke, men anonymiseres eller arkiveres.

### ADR-010 · Dokumentation på dansk, kode og kodekommentarer på engelsk

2026-11-03 · Standardvalg
Ejeren kan læse dokumentationen; koden følger international konvention, så enhver udvikler kan arbejde i den.

### ADR-011 · Row-level security slået til uden politikker (deny-by-default)

2026-11-03 · Besluttet

Supabase kan eksponere `public`-skemaet via et automatisk REST-API. RLS uden politikker afviser alle andre roller end tabelejeren, som appen forbinder som. Det er et ekstra sikkerhedslag; adgangsreglerne ligger fortsat i applikationen (ADR-003). Supabases Data API bør desuden slås fra (se deployment-runbook).

### ADR-012 · Databasedriver: node-postgres med timeouts og `attachDatabasePool`

2026-11-04 · Besluttet

På Vercel (Fluid compute) sættes instanser på pause mellem requests. Med postgres.js blev forbindelser stående halvdøde, og da driveren ikke har en forespørgsels-timeout, hang sider, til Vercel stoppede dem efter 300 sekunder. Appen bruger nu `pg` (node-postgres) med en lille pool, `idleTimeoutMillis` 5 s, forbindelses-timeout 10 s og forespørgsels-/statement-timeout 15 s, og registrerer poolen med `attachDatabasePool` fra `@vercel/functions`, så Vercel lukker ledige forbindelser, før en instans pauses. node-postgres bruger ikke navngivne prepared statements, så Supabases Transaction pooler virker uændret.

## Produkt- og forretningsstandardvalg

| ID    | Emne                                                       | Valg                                                           | Status       | Hvor                                                  |
| ----- | ---------------------------------------------------------- | -------------------------------------------------------------- | ------------ | ----------------------------------------------------- |
| D-001 | Svarfrist for foreninger                                   | 72 timer                                                       | Standardvalg | `config: campaigns.association_response_window_hours` |
| D-002 | Egne produkter kræver admin-godkendelse                    | Ja                                                             | Standardvalg | `config: catalog.custom_offering_requires_approval`   |
| D-003 | Udbetaling til forening først efter virksomhedens betaling | Ja                                                             | Standardvalg | `config: finance.payout_requires_company_payment`     |
| D-004 | Platformgebyr                                              | Ikke fastlagt (15 % var illustrativt)                          | Åben         | `config: finance.platform_fee_basis_points`           |
| D-005 | Login                                                      | E-mail og adgangskode (mindst 10 tegn) med e-mailbekræftelse   | Standardvalg | `src/lib/auth.ts`                                     |
| D-006 | Organisationer pr. bruger                                  | Én forening eller virksomhed pr. bruger i MVP                  | Standardvalg | `canCreateOrganization`                               |
| D-007 | Startstatus                                                | Foreninger starter som kladde, virksomheder som aktive         | Standardvalg | `createOrganization`                                  |
| D-008 | Valuta og beløb                                            | Kun DKK; heltal i øre; afrunding halvt væk fra nul ved gebyrer | Standardvalg | `src/lib/money.ts`                                    |
| D-009 | Platformadmins                                             | Oprettes kun via kommandolinje, aldrig via UI                  | Standardvalg | `scripts/create-platform-admin.ts`                    |
| D-010 | Demodata                                                   | Markeres `is_demo` og "DEMO"; seed afvises i produktion        | Besluttet    | `scripts/seed.ts`                                     |
| D-011 | Arbejdsnavn                                                | "Foreningsplatform"                                            | Standardvalg | `src/messages/da.ts`                                  |

## Åbne forretningsbeslutninger

Fra spec afsnit 9 og 17. De blokerer ikke udviklingen, men skal afklares før rigtige penge flyttes. Se også `BACKLOG.md`.

- Platformgebyr, hvem der betaler det, moms og kontraktstruktur.
- Betalingsfrister, tab på debitorer, annullering, underlevering og refusion.
- Om foreninger skal godkende hver kampagne, eller om visse produkter kan forhåndsgodkendes.
- Hvordan priser på egne produkter fastsættes og godkendes.
- Minimumskatalog til pilot og dokumentationskrav pr. produkt.
- Kortudbyder, kalender/booking-udbyder, notifikationer, handelsbetingelser og privatlivspolitik.
