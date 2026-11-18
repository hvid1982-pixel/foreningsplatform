# Backlog

Milepælene følger spec afsnit 15. En milestone startes først, når den forrige er godkendt af ejeren.

## Milepæle

| #   | Navn                | Indhold                                                                                                                                                            | Gate                                                                                 | Status                     |
| --- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | -------------------------- |
| M0  | Fundament           | Repo, miljø, migrationer, login, roller, admin-skal, seed, CI, docs, staging                                                                                       | Kan køres og logges ind som hver rolle                                               | Godkendt                   |
| M1  | Udbud               | Forenings-onboarding i trin med kladde, profil, kanaler, lokationer, standard- og egne produkter, admin-godkendelse, link til onboardinghjælp, brancheudelukkelser | En rigtig forening kan registrere sig og publicere godkendte produkter uden udvikler | Godkendt (M1.1 til review) |
| M2  | Efterspørgsel       | Virksomhedsprofil, kort/liste-søgning, filtre, produktdetaljer, manuel kampagnebygger, kladder                                                                     | Virksomhed kan vælge rigtige tilbud og gemme en prissat kampagnekladde               | Ikke startet               |
| M3  | Anbefaling          | Redigerbar foreslået pakke, budgetvalidering, udelukkelsesregler, manuelle valg                                                                                    | Deterministiske tests viser, at små/nye klubber forbliver mulige                     | Ikke startet               |
| M4  | Kontrahering        | Indsend, invitér, accept/afslag, alternativer, endelig bekræftelse, uforanderlige snapshots, statusmaskine                                                         | Ingen kampagne bliver aktiv uden nødvendige godkendelser                             | Ikke startet               |
| M5  | Levering og økonomi | Opgaver, uploads, review, rapport, manuel faktura-/udbetalingsjournal, audit                                                                                       | En hel kampagne kan køre fra registrering til fakturering med korrekte snapshots     | Ikke startet               |
| M6  | Overdragelse        | Regression/sikkerhed, staging, backup/restore-øvelse, driftsrunbook, endelige docs                                                                                 | En professionel udvikler kan klone, konfigurere, køre, teste og deploye selvstændigt | Ikke startet               |

## Åbne beslutninger til ejeren

Se `DECISIONS.md` for detaljer. Skal være afklaret senest ved den nævnte milestone.

- [ ] Kortudbyder (tiles) – før M2
- [ ] Bookingside til onboardinghjælp (URL) – kan indtastes af admin under Forretningsregler, når den findes
- [ ] Bekræft standardkatalog, prisrammer og dokumentationskrav (forslag i D-012) – før pilot
- [ ] Bekræft prissætning af egne produkter (forslag i D-014) – før pilot
- [ ] Om foreninger skal godkende hver kampagne – før M4
- [ ] Platformgebyr, betaler, moms, kontraktform – før M4
- [ ] Betalingsfrister, annullering, underlevering, refusion – før M5
- [ ] Handelsbetingelser og privatlivspolitik (juridisk review) – før pilot
- [ ] E-mailudbyder til staging/produktion (f.eks. Resend, Postmark, Brevo) – før M1-pilot
- [ ] Brancher: må foreninger selv tilføje brancher, eller kun platformen (med anmodning fra foreningen)? – før M3 (gennemgang #9)
- [ ] Hovedforening, der opretter på vegne af flere afdelinger – før pilot (gennemgang #10)
- [ ] Supabase Pro eller daglig "ping", så databasen ikke sættes på pause – før pilot

## Ønsker fra ejerens gennemgang

Fra gennemgangen af M1 (`docs/feedback/m1-gennemgang.md`, numrene henviser dertil). Taget i M1.1: #1–5, #6 (flere kanaler, redigering), #7, #11, #14, #15 og forklaring på #12.

- Virksomheden kan stille spørgsmål til et sted ("Andet sted") før de godkender en kampagne (#5) – M4
- Integration med Facebook/Instagram m.fl. for målt rækkevidde (#6, #8) – efter MVP; kræver app-godkendelse hos Meta
- Billeder af steder og produkter, f.eks. bane eller skærm i klubhuset (#13) – M2 sammen med fillagring
- Samlet kampagneoverblik for admin: aktive, planlagte og afsluttede (#16) – M2 (kladder) og M4 (status)
- Contract-migration, der sletter de gamle kolonner `category_id`, `channel_id`, `location_id` (ADR-016) – når M1.1 er i produktion

## Teknisk backlog

- Fejlmonitorering (Sentry eller tilsvarende) – M1 eller M6
- Brugerflade, hvor admin redigerer en forenings profil på dens vegne (services tillader det, ADR-015) – efter behov
- Geokodning af adresser til koordinater (felter findes) – M2
- Billeder og medier på produkter – M2 eller senere
- E-mail til foreningen ved godkendelse eller tilbagesendelse – M1-pilot sammen med mailudbyder
- Redigering af kategorier og brancher i admin (data findes; i dag via seed) – efter behov
- Flere teammedlemmer pr. organisation og invitationer – efter MVP
- Mulighed for at én bruger repræsenterer flere foreninger – efter MVP
- Row-level security som ekstra sikkerhedslag – overvejes i M6
- Backup/restore-øvelse og driftsrunbook – M6
- Separat produktionsmiljø (eget Supabase-projekt) – før pilot med rigtige penge
