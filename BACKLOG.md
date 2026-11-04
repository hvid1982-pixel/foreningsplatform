# Backlog

Milepælene følger spec afsnit 15. En milestone startes først, når den forrige er godkendt af ejeren.

## Milepæle

| #   | Navn                | Indhold                                                                                                                                                            | Gate                                                                                 | Status       |
| --- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------------ |
| M0  | Fundament           | Repo, miljø, migrationer, login, roller, admin-skal, seed, CI, docs, staging                                                                                       | Kan køres og logges ind som hver rolle                                               | Til review   |
| M1  | Udbud               | Forenings-onboarding i trin med kladde, profil, kanaler, lokationer, standard- og egne produkter, admin-godkendelse, link til onboardinghjælp, brancheudelukkelser | En rigtig forening kan registrere sig og publicere godkendte produkter uden udvikler | Ikke startet |
| M2  | Efterspørgsel       | Virksomhedsprofil, kort/liste-søgning, filtre, produktdetaljer, manuel kampagnebygger, kladder                                                                     | Virksomhed kan vælge rigtige tilbud og gemme en prissat kampagnekladde               | Ikke startet |
| M3  | Anbefaling          | Redigerbar foreslået pakke, budgetvalidering, udelukkelsesregler, manuelle valg                                                                                    | Deterministiske tests viser, at små/nye klubber forbliver mulige                     | Ikke startet |
| M4  | Kontrahering        | Indsend, invitér, accept/afslag, alternativer, endelig bekræftelse, uforanderlige snapshots, statusmaskine                                                         | Ingen kampagne bliver aktiv uden nødvendige godkendelser                             | Ikke startet |
| M5  | Levering og økonomi | Opgaver, uploads, review, rapport, manuel faktura-/udbetalingsjournal, audit                                                                                       | En hel kampagne kan køre fra registrering til fakturering med korrekte snapshots     | Ikke startet |
| M6  | Overdragelse        | Regression/sikkerhed, staging, backup/restore-øvelse, driftsrunbook, endelige docs                                                                                 | En professionel udvikler kan klone, konfigurere, køre, teste og deploye selvstændigt | Ikke startet |

## Åbne beslutninger til ejeren

Se `DECISIONS.md` for detaljer. Skal være afklaret senest ved den nævnte milestone.

- [ ] Kortudbyder (tiles) – før M2
- [ ] Bookingside til onboardinghjælp (URL) – før M1-demo
- [ ] Minimumskatalog og dokumentationskrav pr. produkt – før M1
- [ ] Prissætning af egne produkter – før M1
- [ ] Om foreninger skal godkende hver kampagne – før M4
- [ ] Platformgebyr, betaler, moms, kontraktform – før M4
- [ ] Betalingsfrister, annullering, underlevering, refusion – før M5
- [ ] Handelsbetingelser og privatlivspolitik (juridisk review) – før pilot
- [ ] E-mailudbyder til staging/produktion (f.eks. Resend, Postmark, Brevo) – før M1-pilot

## Teknisk backlog

- Fejlmonitorering (Sentry eller tilsvarende) – M1 eller M6
- Brugerflade til at ændre forretningsregler (findes i service-laget; UI mangler) – M1
- Admin-UI til at ændre organisationsstatus (service findes) – M1
- Flere teammedlemmer pr. organisation og invitationer – efter MVP
- Mulighed for at én bruger repræsenterer flere foreninger – efter MVP
- Row-level security som ekstra sikkerhedslag – overvejes i M6
- Backup/restore-øvelse og driftsrunbook – M6
- Separat produktionsmiljø (eget Supabase-projekt) – før pilot med rigtige penge
