"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitUsers, type ProvisionedUser } from "@/modules/setup/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Row = { role: "agentur" | "approver" | "requester"; name: string; email: string };

export function UsersStep() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [provisioned, setProvisioned] = useState<ProvisionedUser[] | null>(null);

  function add(role: Row["role"]) {
    setRows((r) => [...r, { role, name: "", email: "" }]);
  }
  function update(i: number, patch: Partial<Row>) {
    setRows((r) => r.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function remove(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  function onSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await submitUsers({ users: rows.filter((r) => r.email && r.name) });
        if (result.length > 0) {
          setProvisioned(result);
        } else {
          router.push("/setup");
          router.refresh();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "unbekannter Fehler");
      }
    });
  }

  function onContinue() {
    router.push("/setup");
    router.refresh();
  }

  if (provisioned && provisioned.length > 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Initiale User — Temporäre Passwörter</h2>
        <Alert>
          <AlertTitle>Bitte notieren: Einmalige Anzeige</AlertTitle>
          <AlertDescription>
            <p className="mb-3 text-sm">
              Diese Passwörter werden nur jetzt angezeigt. Bitte an die jeweiligen User weitergeben.
            </p>
            <ul className="space-y-1 font-mono text-xs">
              {provisioned.map((u) => (
                <li key={u.email} className="flex gap-2">
                  <span className="min-w-0 flex-1 truncate">{u.email}</span>
                  <span className="shrink-0 select-all font-bold">{u.tempPassword}</span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
        <Button onClick={onContinue}>Weiter zum Review</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Initiale User (optional)</h2>
      <p className="text-sm text-muted-foreground">
        User können auch später im Admin-Bereich angelegt werden.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => add("agentur")}>+ Agentur-User</Button>
        <Button type="button" variant="outline" onClick={() => add("approver")}>+ Genehmiger</Button>
        <Button type="button" variant="outline" onClick={() => add("requester")}>+ Besteller</Button>
      </div>
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li key={i} className="grid grid-cols-[100px_1fr_1fr_auto] items-center gap-2">
            <span className="text-xs uppercase">{r.role}</span>
            <Input value={r.name} placeholder="Name" onChange={(e) => update(i, { name: e.target.value })} />
            <Input value={r.email} type="email" placeholder="E-Mail" onChange={(e) => update(i, { email: e.target.value })} />
            <Button type="button" variant="ghost" onClick={() => remove(i)}>×</Button>
          </li>
        ))}
      </ul>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={onSubmit} disabled={pending}>{pending ? "Speichern…" : "Weiter"}</Button>
    </div>
  );
}
