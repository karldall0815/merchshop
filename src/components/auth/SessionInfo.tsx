"use client";

import { useSession } from "next-auth/react";

export function SessionInfo() {
  const { data, status } = useSession();
  if (status === "loading") {
    return <p className="text-sm text-muted-foreground">Sitzung wird geladen…</p>;
  }
  if (!data?.user) {
    return <p className="text-sm text-muted-foreground">Keine aktive Sitzung.</p>;
  }
  const user = data.user as { name?: string; email?: string; role?: string };
  return (
    <p className="text-sm text-muted-foreground">
      Eingeloggt als <strong>{user.name ?? "?"}</strong>
      {user.email ? ` (${user.email})` : null}
      {user.role ? ` · Rolle: ${user.role}` : null}
    </p>
  );
}
