#!/usr/bin/env bash
# Scant gestagete bzw. getrackte Dateien auf personenbezogene Daten und Secrets.
# Bricht ab, falls Treffer gefunden werden. Wird von Pre-Commit-Hook und CI aufgerufen.
#
# Verwendung:
#   scripts/check-no-pii.sh           # staged-Modus (Pre-Commit)
#   scripts/check-no-pii.sh --all     # alle getrackten Dateien (CI)

set -euo pipefail

MODE="${1:-staged}"

if [[ "$MODE" == "--all" ]]; then
  FILES=$(git ls-files)
else
  FILES=$(git diff --cached --name-only --diff-filter=ACM)
fi

# Bestimmte Dateien sind erlaubte Ausnahmen (z.B. die Hook-Datei selbst).
EXCLUDE_REGEX='^(scripts/check-no-pii\.sh|\.github/workflows/pii-scan\.yml)$'

# Such-Patterns. Hinweis: bewusst grob — false positives lieber prüfen.
declare -A PATTERNS=(
  ["E-Mail-Adresse"]='[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
  ["AWS Access Key"]='AKIA[0-9A-Z]{16}'
  ["Private Key Header"]='-----BEGIN [A-Z ]*PRIVATE KEY-----'
  ["JWT Token"]='eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'
  ["Generic Secret"]='(api[_-]?key|secret|password|token)[[:space:]]*[:=][[:space:]]*["'\''][^"'\'' ]{12,}["'\'']'
)

# Treffer, die mit diesen Mustern matchen, sind erlaubt:
# - RFC-2606-reservierte Dokumentations-Domains (example.com/.org/.net, .test, .invalid, .localhost, .example)
# - Offensichtliche Platzhalter aus Test-Fixtures (test.local, *.localhost, name@localhost)
# - Beispiel-Mailadressen in Spec/Plan-Dokumenten (anonymisiert)
ALLOWLIST_REGEX='@(example\.(com|org|net|test)|test\.(local|invalid)|localhost|merchshop\.local|.+\.localhost)\b|^[^@]*@localhost$|change-me|placeholder|your-.*-here|<[A-Za-z_]+>'

FAILED=0

for FILE in $FILES; do
  [[ -f "$FILE" ]] || continue
  [[ "$FILE" =~ $EXCLUDE_REGEX ]] && continue

  # In Doku-/Test-Verzeichnissen sind generische Test-Strings ("test-...-secret-...")
  # erwartete Fixtures, keine echten Geheimnisse — Generic-Secret-Pattern dort skippen.
  SKIP_GENERIC=0
  if [[ "$FILE" =~ ^(docs/|.+\.test\.(ts|tsx|js)$|tests/) ]]; then
    SKIP_GENERIC=1
  fi

  for NAME in "${!PATTERNS[@]}"; do
    [[ "$NAME" == "Generic Secret" && $SKIP_GENERIC -eq 1 ]] && continue
    PATTERN="${PATTERNS[$NAME]}"
    MATCHES=$(grep -EnH -- "$PATTERN" "$FILE" 2>/dev/null || true)
    [[ -z "$MATCHES" ]] && continue
    # Allowlist-Filter: Zeilen rauswerfen, deren Treffer ausschließlich aus erlaubten Beispieldaten besteht.
    FILTERED=$(echo "$MATCHES" | grep -Ev -- "$ALLOWLIST_REGEX" || true)
    if [[ -n "$FILTERED" ]]; then
      echo "✖ $NAME in $FILE:"
      echo "$FILTERED" | sed 's/^/    /'
      FAILED=1
    fi
  done
done

if [[ $FAILED -ne 0 ]]; then
  cat <<'EOF'

──────────────────────────────────────────────────────────────
Potenzielle personenbezogene Daten oder Secrets im Diff!
Dieses Repo ist öffentlich. Bitte entfernen oder anonymisieren.

False positive? Datei in scripts/check-no-pii.sh erlauben oder
das Pattern lokal mit "git commit --no-verify" umgehen
(NUR wenn du sicher bist).
──────────────────────────────────────────────────────────────
EOF
  exit 1
fi

echo "✔ Kein PII-Treffer."
