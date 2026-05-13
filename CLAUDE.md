# CLAUDE.md

Hinweise für Claude Code und andere KI-Assistenten, die in diesem Repo arbeiten.

## Projekt-Kontext

**MerchShop** ist ein internes Merchandise-Bestell- und Bestandssystem für einen Kunden einer Marketing-Agentur. Hauptzweck: Transparenz und Nachvollziehbarkeit beim Versand von Werbeartikeln (wer, wann, was, wofür).

Die vollständige Spezifikation liegt **lokal** unter `docs/superpowers/specs/` (gitignored, siehe unten). **Vor größeren Änderungen immer dort nachlesen.**

## Doku-Pflicht (DAUERAUFGABE — IMMER befolgen)

Das Projekt unterhält eine fortlaufende **lokale, NICHT im Repo veröffentlichte** Doku unter `docs/`. **Diese Doku ist Teil der Definition-of-Done für jede Aufgabe.** Eine Aufgabe gilt erst als erledigt, wenn die zugehörigen Doku-Einträge geschrieben sind.

### 🚫 Public-Repo: KEINE interne Doku, KEINE Infrastruktur

Dieses Repo ist öffentlich auf GitHub. **Alles unter `docs/` außer `docs/README.md` ist gitignored** (`.gitignore` Regel `docs/* / !docs/README.md`). Niemals committen oder pushen:

- Inhalt aus `docs/security/` — Audit-Findings, Incidents, IP-Adressen, Host- oder Domain-Namen, Reverse-Proxy-Setup, Port-Listen, Service-Stati
- Inhalt aus `docs/journal/`, `docs/decisions/`, `docs/superpowers/specs/`, `docs/superpowers/plans/` — interne Arbeits-Doku, Architektur-Begründungen, Roadmap-Detail
- **Auch keine indirekten Verweise:** Pfadnamen, Filenames oder Inhalts-Zitate aus diesen Dokumenten in committable Dateien (z.B. `README.md`, `CLAUDE.md`, Commit-Messages).

`docs/README.md` selbst bleibt minimal — nur ein Platzhalter ohne Strukturhinweise.

**Wenn ein Tool/Skill den Push-Schritt anbieten würde:** stoppen, User fragen. Push auf Remote ist im Default verboten ohne explizite Freigabe pro Push.

### Was wo aktualisiert wird (alles lokal)

| Anlass | Wo (lokal) | Wie |
|--------|------------|-----|
| **Jede Arbeits-Sitzung** | `docs/journal/YYYY-MM-DD.md` | Eintrag oder Section anhängen — Format siehe `docs/journal/README.md` |
| **Security-relevante Änderung** | `docs/security/log.md` | Append-only mit Verifikations-Output. Audits/Incidents als eigene Datei. |
| **Architektur-Entscheidung** | `docs/decisions/NNNN-…md` | Neues ADR aus Template, Index pflegen |
| **Spec-Änderung** | `docs/superpowers/specs/…` | Direkt updaten + Journal-Eintrag |
| **Mergebare Code-Änderung** (geht ins Public-Repo) | `CHANGELOG.md` Abschnitt `[Unreleased]` | Keep-a-Changelog-Stil, **keine** Infrastruktur-Details |

### Wann

- **Während der Arbeit:** ADR / `security/log.md` direkt zu den jeweiligen Änderungen.
- **Am Sitzungsende:** Journal-Eintrag schreiben, auch wenn nichts gemerged wurde.
- **Niemals nachträglich rekonstruieren, wenn Details schon weg sind** — lieber kurz und ehrlich als detailliert und falsch.

### Parallele Agents

Wenn Doku-Pflege parallel zu produktiver Arbeit laufen soll, **kann ein Background-Agent (`Agent`, `subagent_type=general-purpose`) gestartet werden**, der `git log` liest, geänderte Dateien analysiert und Journal-/Security-Log-Einträge vorschlägt. **Pflicht für diesen Agent:** er darf nichts in den Git-Index packen oder pushen, sondern nur unter `docs/` schreiben (das ist gitignored). Faustregel: parallel-Agent nur, wenn Hauptarbeit ohnehin wartet (Build, Migration). Sonst inline.

### Was nicht in die Doku gehört

- **PII** (Mails, Klarnamen).
- Inhalte, die identisch im Code, Commit oder Schema stehen. Doku ist für das **Warum** und das **Was-überrascht-hat**, nicht für Wiederholung.
- Routine-Refactors ohne Verhaltensänderung — Git-Log reicht.

## Sprache & Stil

- **Kommunikation mit dem User:** Deutsch
- **Code, Variablen, Kommentare im Code, Commit-Messages:** Englisch
- **Doku in `docs/`:** Deutsch (User-facing) oder Englisch (technisch) — Konsistenz innerhalb eines Dokuments wahren

## Tech-Stack (verbindlich)

- Next.js 15 (App Router) + TypeScript (strict)
- PostgreSQL 16, Prisma ORM
- NextAuth.js (Credentials + optional Magic-Link)
- Tailwind CSS + shadcn/ui
- pnpm als Paketmanager
- Vitest für Unit-Tests, Playwright für E2E

Keine zusätzlichen Frameworks oder UI-Bibliotheken ohne Rücksprache einführen.

## First-Run Setup-Wizard

Beim ersten Start läuft ein webbasierter Wizard unter `/setup` (Design-Doc Abschnitt 8a). Wichtige Regeln:

- **ENV überschreibt DB.** Werte aus ENV haben immer Vorrang vor `Setting`-Tabelle. Wenn ein Wizard-Schritt komplett per ENV abgedeckt ist, wird er übersprungen.
- **Sensible Settings** (Passwörter, API-Keys) werden AES-256-GCM-verschlüsselt; Master-Key via HKDF aus `NEXTAUTH_SECRET`.
- **Setup-Token** in signiertem Cookie verhindert Hijacking nach Container-Start.
- **Idempotenz:** Jeder Schritt persistiert sofort, Reload schadet nicht.
- **Statemachine zentral** in `src/modules/setup/state-machine.ts`. Schritte nie direkt überspringen.

## Architektur-Prinzipien

- **Module statt Mono-Klumpen:** Logik in `src/modules/<modulname>/` kapseln (catalog, inventory, orders, approvals, shipping, reporting, audit, notifications, auth, admin).
- **Server-Actions bevorzugen** für Mutationen statt API-Routes, wenn nicht von Externen aufgerufen.
- **RBAC zweistufig:** Middleware *und* Server-Action-Check. Vertraue nie nur dem Client.
- **Bestand nur via `StockMovement`** verändern — keine direkten Updates auf `Product.stock`/`Variant.stock`.
- **`OrderItem` speichert Snapshots** von Name & Bild, damit historische Bestellungen lesbar bleiben.
- **Append-only Log:** `AuditLog` und `StockMovement` niemals updaten oder löschen.

## Rollen

`admin` | `agentur` | `approver` | `requester` — siehe Design-Doc Abschnitt 2.

## Order-Statemachine

```
draft → pending → approved → processing → shipped → delivered
            ↓
         rejected
            ↓
        cancelled  (nur vor processing)
```

Übergänge zentral in `src/modules/orders/state-machine.ts` validieren. Keine Status direkt setzen.

## Konventionen

- **Dateinamen:** kebab-case (`order-status.ts`), Komponenten PascalCase (`OrderCard.tsx`)
- **Imports:** absolute Pfade via `@/` Alias
- **Tests:** neben dem Code (`foo.ts` + `foo.test.ts`)
- **Migrations:** immer via `prisma migrate dev --name <beschreibung>`, niemals SQL von Hand
- **Bilder:** nur via signierte URLs aus MinIO ausliefern, nie direkt aus public/

## Geheimnisse & Konfiguration

**Dieses Repo ist öffentlich.** Niemals folgendes committen:

- E-Mail-Adressen (auch nicht in Doku, Beispielen, Kommentaren, Commit-Messages)
- Echte oder Nicknamen, Klarnamen, Initialen, Personenbezüge
- API-Keys, Passwörter, Tokens, Zugangsdaten, Zertifikate, Private Keys
- Reale Adressen, Telefonnummern, Kundennamen, Kostenstellen, interne Bezeichner

Stattdessen:
- Alle Konfiguration über ENV-Variablen — siehe `.env.example` (nur leere Slots!)
- Lokale Overrides in `.env.local` (gitignored)
- Test-Seeds verwenden Fake-Daten (Faker.js o.ä.), niemals echte Adressen
- Git-Identität lokal anonym halten (`git config user.email "merchshop@localhost"`)
- Commit-Messages enthalten KEINE `Co-Authored-By:`-Zeilen mit echten Mailadressen
- Vor jedem Commit läuft `scripts/check-no-pii.sh` als Pre-Commit-Hook

## Test-Pflicht

Pflicht-Tests vor jedem Merge:
- Order-Statemachine (alle Übergänge + verbotene)
- Bestandslogik (Soft-Reservierung, Abbuchung, Race-Conditions)
- RBAC-Middleware pro Rolle
- Mindestbestand-Alert

## Commit-Konventionen

Conventional Commits:
- `feat:` neue Funktion
- `fix:` Bugfix
- `refactor:` ohne Verhaltensänderung
- `docs:` nur Doku
- `test:` Tests
- `chore:` Build/Tooling

PRs gegen `main`, mit Review.

## Was nicht im MVP gebaut wird

- Zahlungsabwicklung
- Öffentlicher Shop / Gast-Bestellungen
- Mandantenfähigkeit
- Mobile Apps (PWA reicht)
- SSO/SAML

Wenn der User nach diesen Features fragt: kurz auf die Roadmap (Design-Doc Abschnitt 11) verweisen und nachfragen, ob das ins MVP soll.

## Hilfreiche Befehle

```bash
pnpm dev                  # Dev-Server
pnpm test                 # Unit-Tests
pnpm test:e2e             # Playwright
pnpm prisma studio        # DB-Browser
pnpm prisma migrate dev   # Neue Migration
pnpm lint                 # ESLint
pnpm typecheck            # tsc --noEmit
docker compose up -d      # DB + MinIO lokal
```
