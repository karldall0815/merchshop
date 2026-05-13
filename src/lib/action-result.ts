export type ErrorCode =
  | "VALIDATION_ERROR"
  | "INSUFFICIENT_STOCK"
  | "INVALID_STATE_TRANSITION"
  | "PERMISSION_DENIED"
  | "NOT_FOUND"
  | "CATEGORY_CHANGE_REQUIRES_CONFIRM"
  | "CATEGORY_SCHEMA_CHANGE_REQUIRES_CONFIRM"
  | "INTERNAL_ERROR";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; code: ErrorCode; message: string; details?: Record<string, unknown> };

export function ok(): { ok: true };
export function ok<T>(data: T): { ok: true; data: T };
export function ok<T>(data?: T) {
  return data === undefined ? { ok: true as const } : { ok: true as const, data };
}

export function fail(code: ErrorCode, message: string, details?: Record<string, unknown>) {
  return { ok: false as const, code, message, ...(details ? { details } : {}) };
}
