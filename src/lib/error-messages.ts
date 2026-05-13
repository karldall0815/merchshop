import type { ErrorCode } from "./action-result";

export const ERROR_LABELS: Record<ErrorCode, string> = {
  VALIDATION_ERROR:                          "Bitte prüfe deine Eingaben.",
  INSUFFICIENT_STOCK:                        "Nicht genug Bestand vorhanden.",
  INVALID_STATE_TRANSITION:                  "Diese Aktion ist im aktuellen Status nicht möglich.",
  PERMISSION_DENIED:                         "Dafür hast du keine Berechtigung.",
  NOT_FOUND:                                 "Datensatz nicht gefunden.",
  CATEGORY_CHANGE_REQUIRES_CONFIRM:          "Bitte bestätige den Kategoriewechsel.",
  CATEGORY_SCHEMA_CHANGE_REQUIRES_CONFIRM:   "Schema-Änderung betrifft bestehende Artikel — bitte bestätige.",
  INTERNAL_ERROR:                            "Ein interner Fehler ist aufgetreten. Bitte später erneut versuchen.",
};

export function labelForCode(code: ErrorCode): string {
  return ERROR_LABELS[code] ?? "Ein unbekannter Fehler ist aufgetreten.";
}
