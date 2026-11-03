# Changelog

Formatet følger [Keep a Changelog](https://keepachangelog.com/da/1.1.0/). Versioner følger milepælene.

## [Unreleased]

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
