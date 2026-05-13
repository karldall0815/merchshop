# Changelog

Alle nennenswerten Änderungen werden hier dokumentiert.

Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionsnummern folgen [SemVer](https://semver.org/lang/de/).

## [Unreleased]

### Added
- Initiales Repo-Setup: README, CLAUDE.md, AGENTS.md, CONTRIBUTING.md, SECURITY.md
- Design-Dokument für MerchShop MVP
- Docker-Compose für lokale Entwicklung (PostgreSQL + MinIO + MailHog)
- Dockerfile (Multi-Stage) für Produktion
- GitHub Actions Workflows: CI (Lint/Typecheck/Test/Build) und Docker-Build/Push zu GHCR
- PR-Template
- Spec: webbasierter First-Run Installations-Wizard mit 10 Schritten (Sprache, System-Check, Branding, Admin-Account, S3-Storage, E-Mail, DHL, Workflow-Defaults, initiale User, Review), Setting-Storage mit AES-256-GCM-Verschlüsselung und ENV-Override-Priorität
- Doku-Pflicht als Dauer-Regel in `CLAUDE.md` verankert (laufende projektinterne Doku wird **lokal** gepflegt, nicht im Repo veröffentlicht).

[Unreleased]: https://github.com/OWNER/merchshop/compare/main...HEAD
