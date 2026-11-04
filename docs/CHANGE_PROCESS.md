# Ændringsproces

Platformen skal kunne ændres løbende. Denne proces sikrer, at ændringer sker uden at ødelægge eksisterende data eller indgåede aftaler (spec afsnit 0.2 og 16).

## For hver ændringsanmodning

1. **Konsekvensanalyse.** Hvilke moduler, tabeller, felter, tests, skærme og eksisterende bekræftede kampagner berøres?
2. **Klassificér ændringen:**
   - _Visuel/tekst_: kun `src/app`, `src/components` eller `src/messages/da.ts`. Lav risiko.
   - _Forretningslogik_: `src/modules/*/service.ts` eller `policies.ts`. Kræver nye/opdaterede tests.
   - _Forretningsregel-værdi_: kan ofte klares i `configuration_versions` uden kodeændring.
   - _Datamodel_: ny migration. Kræver plan for eksisterende data og bagudkompatibilitet.
3. **Foreslå den mindste sikre løsning** og nævn migrationsrisici. Ved væsentlige ændringer godkender ejeren forslaget først.
4. **Implementér på en branch** (`feature/<kort-navn>` eller `fix/<kort-navn>`) med tests.
5. **Opdatér dokumentation i samme pull request:** `CHANGELOG.md` altid; `DECISIONS.md` ved beslutninger; `DATA_MODEL.md` ved skemaændringer; `ARCHITECTURE.md` ved strukturændringer.
6. **Pull request** med beskrivelse, skærmbilleder ved UI-ændringer og testresultat. CI skal være grøn. Vercel laver et preview-link til demo.
7. **Merge** til `main` efter godkendelse.

## Regler, der aldrig brydes

- **Bekræftede kommercielle data ændres aldrig med tilbagevirkende kraft.** Snapshots af vilkår, priser, gebyrer og leverancer er uforanderlige. Rettelser sker via en eksplicit, auditeret justering (`financial_adjustments` fra M5).
- **Katalogændringer påvirker ikke indgåede aftaler.** Produkter og kategorier arkiveres; de slettes ikke, hvis noget refererer til dem.
- **Audit-loggen er append-only.**
- **Ingen hemmeligheder i repoet.** Nye miljøvariabler tilføjes til `.env.example` og `src/lib/env.ts`.
- **Adgang tjekkes på serveren** i services. Skjulte knapper i UI'et er ikke sikkerhed.

## Databaseændringer

1. Ret tabellen i `src/modules/<modul>/schema.ts` (nye tabeller registreres i `src/db/schema.ts`).
2. `pnpm db:generate --name <beskrivende_navn>` og **læs den genererede SQL**.
3. Nye tabeller: tilføj `ALTER TABLE "<navn>" ENABLE ROW LEVEL SECURITY;` i en migration (testen i `tests/integration/migrations.test.ts` fejler ellers).
4. Destruktive ændringer (drop/rename af kolonner med data) laves i trin: tilføj nyt → kopiér data → skift kode → fjern gammelt i en senere release.
5. Datamigrationer, der ikke kan udtrykkes i ren SQL, laves som `pnpm db:generate --custom` med håndskrevet SQL.
6. Migrationer, der er kørt på staging eller produktion, redigeres aldrig. Lav en ny.
7. Tag backup af produktion før en risikabel migration (se runbook).

CI fejler, hvis `schema.ts` er ændret uden en tilhørende migration.

## Tests

| Type        | Placering                     | Hvornår                                                                     |
| ----------- | ----------------------------- | --------------------------------------------------------------------------- |
| Unit        | `src/**/*.test.ts`            | Rene funktioner: policies, beregninger, regler                              |
| Integration | `tests/integration/*.test.ts` | Services mod rigtig Postgres: adgang, statusovergange, økonomi, migrationer |
| End-to-end  | `tests/e2e/*.spec.ts`         | Hele brugerrejser i browseren                                               |

Spec afsnit 0.9 kræver automatiske tests for auth, adgang, matching, budgetter, statusovergange, økonomiske beregninger og datamigrationer. Hver milestone afsluttes med en testrapport i `docs/test-reports/`.

## Versionering og releases

- `main` er altid deploybar. Ingen direkte commits til `main`.
- Commit-beskeder: kort imperativ første linje (f.eks. "Tilføj kanaler til foreningsprofil").
- Hver godkendt milestone tagges `v0.<milestone>.0` og får en sektion i `CHANGELOG.md`.
