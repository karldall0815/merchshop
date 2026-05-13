"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser } from "@/modules/admin/users";

const ROLES = ["requester", "approver", "agentur", "admin"] as const;

export function NewUserForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("requester");
  const [password, setPassword] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    startTransition(async () => {
      try {
        await createUser({ email, name, role, password });
        setEmail("");
        setName("");
        setPassword("");
        setRole("requester");
        setOk(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Anlegen fehlgeschlagen");
      }
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-Mail *</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Rolle *</Label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Initial-Passwort * (min. 10)</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={10}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="md:col-span-2 space-y-2">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {ok && <p className="text-sm text-green-600">Benutzer angelegt.</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Lege an…" : "Anlegen"}
        </Button>
      </div>
    </form>
  );
}
