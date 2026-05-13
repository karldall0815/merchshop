# Contributing

## ⚠️ Öffentliches Repo — keine personenbezogenen Daten

Dieses Repository ist **public**. Vor jedem Commit prüfen:

- Keine E-Mail-Adressen (auch nicht in Doku, Tests, Seed-Daten)
- Keine Klar- oder Nicknamen, keine Kundennamen, keine internen Bezeichner
- Keine echten Adressen, Telefonnummern, Kostenstellen
- Keine Secrets, API-Keys, Tokens, Passwörter, Zertifikate
- Lokale Git-Identität anonym halten: `git config user.email "merchshop@localhost"` und `git config user.name "MerchShop"`
- Commit-Messages OHNE `Co-Authored-By:`-Trailer mit echten Mailadressen

Der Pre-Commit-Hook (`scripts/check-no-pii.sh`) blockt typische Treffer; zusätzlich läuft im CI ein Secret-Scan via Gitleaks.

## Voraussetzungen

- Node.js 20+
- pnpm 9+
- Docker + Docker Compose
- Git

## Setup

```bash
git clone <repo-url> merchshop
cd merchshop
cp .env.example .env       # Werte anpassen
docker compose up -d postgres minio
pnpm install
pnpm prisma migrate dev
pnpm prisma db seed        # optional: Demo-Daten
pnpm dev
```

## Workflow

1. Feature-Branch von `main`: `git checkout -b feat/<kurzbeschreibung>`
2. Kleine, fokussierte Commits (Conventional Commits)
3. Tests schreiben (Pflicht für Business-Logik)
4. `pnpm verify` lokal grün (lint + typecheck + test + build)
5. Pull Request gegen `main`, mit Beschreibung des Why
6. Review durch mindestens eine zweite Person
7. CI grün → Squash-Merge

## Branch-Schutz

- `main` ist protected
- Force-Push verboten
- Direkter Commit auf `main` nur in Notfällen mit Admin-Recht

## Commit-Messages

Conventional Commits:

```
<type>(<scope>?): <subject>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `build`, `ci`

Beispiele:

```
feat(orders): add approval workflow with email notification
fix(inventory): correct soft-reservation calc on cancelled orders
refactor(catalog): extract image upload into separate module
```

## Tests

```bash
pnpm test          # Vitest Unit-Tests
pnpm test:watch    # Watch-Mode
pnpm test:e2e      # Playwright E2E
pnpm test:cov      # Coverage
```

Pflicht-Coverage > 80 % auf `src/modules/{orders,inventory,approvals,shipping}`.

## Code-Style

- ESLint + Prettier via `pnpm lint` / `pnpm format`
- TypeScript strict mode, keine `any` außer mit Begründung im Kommentar
- React Server Components als Default, Client-Components nur wo nötig
- Dateinamen kebab-case, Komponenten PascalCase

## Datenmodell-Änderungen

1. Schema in `prisma/schema.prisma` ändern
2. `pnpm prisma migrate dev --name <beschreibung>`
3. Migration committen, **niemals** edit nach Merge auf `main`
4. Bei Breaking Changes: Migrations-Plan in PR-Beschreibung dokumentieren

## Release

- Tag auf `main`: `vX.Y.Z` (SemVer)
- GitHub Actions baut Docker-Image und pusht zu GHCR
- CHANGELOG.md pflegen

## Fragen?

Im Issue-Tracker eröffnen oder im Team-Channel posten.
