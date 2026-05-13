"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      type="button"
      title="Abmelden"
      aria-label="Abmelden"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="group relative inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 transition hover:bg-muted hover:text-foreground"
    >
      <LogOut className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      <span className="pointer-events-none absolute top-full mt-1 z-10 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow transition group-hover:opacity-100 group-focus:opacity-100">
        Abmelden
      </span>
    </button>
  );
}
