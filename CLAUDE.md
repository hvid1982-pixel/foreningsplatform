@AGENTS.md

# Arbejdsregler for AI-assistenter og udviklere

- Læs `ARCHITECTURE.md` og `docs/CHANGE_PROCESS.md`, før du ændrer noget.
- Forretningslogik hører til i `src/modules/<modul>/` (service, policies, validation), aldrig i komponenter.
- Hver service-funktion, der rører tenant-data, tager en `Actor` og tjekker adgang først.
- Databaseændringer: ret `schema.ts`, kør `pnpm db:generate`, gennemgå SQL'en, og commit den.
- Al UI-tekst skrives på dansk i `src/messages/da.ts`.
- Opdatér `CHANGELOG.md` (og `DECISIONS.md` ved beslutninger) i samme pull request.
- Kør `pnpm check` og `pnpm test:e2e` før push.
