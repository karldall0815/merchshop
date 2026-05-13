# AGENTS.md

Generische Hinweise für alle KI-Agenten (Claude, Copilot, Codex, Cursor, Gemini etc.).

Diese Datei ergänzt [CLAUDE.md](CLAUDE.md). Bei Konflikt: CLAUDE.md > AGENTS.md > Default-Verhalten.

## Vor jeder Aufgabe lesen

1. [Design-Dokument](docs/superpowers/specs/2026-05-11-merchshop-design.md) — verbindliche Spezifikation
2. [CLAUDE.md](CLAUDE.md) — Tech-Stack, Konventionen, Rollen
3. [CONTRIBUTING.md](CONTRIBUTING.md) — Workflow

## Goldene Regeln

1. **Keine Erfindungen.** Wenn etwas im Design-Doc nicht steht, frag nach oder kennzeichne es als Vorschlag — nicht stillschweigend hinzufügen.
2. **Keine Drive-by-Refactorings.** Nur Code anfassen, der für die Aufgabe relevant ist.
3. **Tests gehören dazu.** Business-Logik ohne Test wird nicht gemergt.
4. **Sicherheit zuerst.** Keine Rollen-Checks weglassen, keine Secrets loggen, keine ungeschützten Dateipfade.
5. **Append-only respektieren.** `AuditLog` und `StockMovement` niemals updaten oder löschen.
6. **Statemachine respektieren.** Order-Status nur über die zentrale Statemachine ändern.

## Was ein Agent niemals tut

- **Personenbezogene Daten** ins Repo schreiben (Mailadressen, Klar-/Nicknamen, Adressen, Telefonnummern, Kundennamen) — Repo ist öffentlich
- **Co-Authored-By** mit echter Mailadresse in Commit-Messages setzen
- Geheimnisse / API-Keys ins Repo committen
- `prisma db push --force-reset` in nicht-Dev-Umgebung
- Migrations rückwärts editieren (immer neue Migration)
- Bestand direkt auf `Product`/`ProductVariant` schreiben
- Bestellstatus direkt setzen ohne Statemachine
- Auth-Middleware oder RBAC-Checks umgehen "für Tests"
- Bilder als Base64 oder in Git speichern (gehört in MinIO)

## Definition of Done

Eine Aufgabe ist erst fertig, wenn:

- [ ] Code geschrieben + dokumentiert (wo Why nicht offensichtlich)
- [ ] Unit-Tests für Business-Logik grün
- [ ] `pnpm typecheck` und `pnpm lint` grün
- [ ] Bei UI-Änderungen: lokal im Browser getestet
- [ ] PR-Beschreibung erklärt das Why
- [ ] Design-Doc oder CLAUDE.md bei Änderungen am Konzept aktualisiert

## Eskalation

Wenn unklar:
- Frag den User auf Deutsch.
- Schlage 2–3 Optionen mit Trade-offs vor, statt eine zu erraten.
- Bei Sicherheits- oder Datenmodell-Änderungen: immer Rücksprache.
