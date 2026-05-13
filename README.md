# MerchShop

Internes Merchandise-Bestell- und Bestandssystem. Ersetzt den bisherigen "Zuruf-Prozess" für Werbeartikel durch einen transparenten, nachvollziehbaren Workflow mit Bestandsführung, Genehmigung und Versand-Tracking.

## Features (MVP)

- **Artikelverwaltung** mit Bildern, Beschreibung, Bestand und Mindestbestand
- **4-Rollen-System**: Admin, Agentur, Genehmiger, Besteller
- **Bestellprozess** mit Pflichtfeldern Anlass, Kostenstelle, Lieferadresse, Wunschtermin
- **Genehmigungs-Workflow** mit E-Mail-Benachrichtigung
- **Fulfillment** mit DHL-Tracking-Integration
- **Bestandslogik** mit Soft-Reservierung und Audit-Trail
- **Reporting** mit Dashboards und CSV-Export
- **Mindestbestand-Alerts** per E-Mail

## Tech-Stack

- Next.js 15 (App Router) + TypeScript
- PostgreSQL 16 + Prisma ORM
- NextAuth.js (Argon2id, optional TOTP-2FA)
- Tailwind CSS + shadcn/ui + recharts
- MinIO (S3-kompatibel) für Bild-Storage
- Docker / Docker Compose für Deployment

## Quick Start (Entwicklung)

```bash
cp .env.example .env
docker compose up -d postgres minio
pnpm install
pnpm prisma migrate dev
pnpm dev
```

App läuft auf <http://localhost:3000>. Der erste Aufruf leitet automatisch auf den **Setup-Wizard** unter `/setup`.

## Produktiv-Deployment

```bash
# Nur das Nötigste in .env: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, APP_URL
docker compose -f docker-compose.prod.yml up -d
```

Beim ersten Aufruf von `https://<deine-domain>/` startet ein **webbasierter Installations-Wizard**, der alle weiteren Einstellungen abfragt:

1. Sprache & Zeitzone
2. System-Check (DB, Migrations)
3. Branding (Name, Logo, Farbe)
4. Admin-Account anlegen (inkl. optionalem 2FA)
5. Object-Storage (S3/MinIO) konfigurieren + testen
6. E-Mail-Versand (Resend/SMTP) konfigurieren + Test-Mail
7. Versand (DHL) — optional
8. Workflow-Defaults (Kostenstellen, Mindestbestand, Genehmigungsregeln)
9. Initiale Rollen-User — optional
10. Zusammenfassung & Abschluss

Nach Abschluss ist die Instanz vollumfänglich lauffähig. Sensible Werte werden AES-verschlüsselt in der DB abgelegt. ENV-Variablen haben Vorrang vor DB-Werten — wer Secrets per Vault/Doppler injiziert, überspringt die entsprechenden Wizard-Schritte automatisch.

## Dokumentation

- [Design-Dokument](docs/superpowers/specs/2026-05-11-merchshop-design.md) — Vollständige Spezifikation
- [CLAUDE.md](CLAUDE.md) — Hinweise für KI-Assistenten im Repo
- [CONTRIBUTING.md](CONTRIBUTING.md) — Entwicklungs-Workflow

## Rollen

| Rolle | Zugriff |
|---|---|
| Admin | Vollzugriff, User-/Rollenverwaltung, Audit-Log |
| Agentur | Artikelverwaltung, Fulfillment, Versand |
| Genehmiger | Bestellungen freigeben/ablehnen |
| Besteller | Bestellungen aufgeben, eigene Historie |

## Lizenz

Proprietär. Alle Rechte vorbehalten.
