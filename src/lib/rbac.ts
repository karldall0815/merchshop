import type { SessionUser } from "@/modules/auth/session";

export type AppRole = "admin" | "agentur" | "approver" | "requester";

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function hasRole(user: SessionUser | null, allowed: AppRole[]): boolean {
  if (!user) return false;
  return allowed.includes(user.role as AppRole);
}

export function requireRole(user: SessionUser | null, allowed: AppRole[]): SessionUser {
  if (!user || !hasRole(user, allowed)) throw new ForbiddenError();
  return user;
}
