"use client";

import { useState, useTransition } from "react";
import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser, updateUser } from "@/modules/admin/users";

const ROLES = ["requester", "approver", "agentur", "admin"] as const;

export interface UserFormUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  defaultCostCenter: string | null;
}

interface CreateProps {
  mode: "create";
  user?: undefined;
  costCenters: string[];
  onSaved?: () => void;
}

interface EditProps {
  mode: "edit";
  user: UserFormUser;
  costCenters: string[];
  onSaved?: () => void;
}

type Props = CreateProps | EditProps;

export function UserForm(props: Props) {
  const isEdit = props.mode === "edit";
  const initial = props.user;

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [role, setRole] = useState<Role>(initial?.role ?? "requester");
  const [defaultCostCenter, setDefaultCostCenter] = useState<string>(
    initial?.defaultCostCenter ?? "",
  );
  const [password, setPassword] = useState("");

  // If the persisted cost center is not in the configured list (legacy data),
  // show it anyway so the admin can keep it or replace it.
  const ccOptions = props.costCenters.includes(defaultCostCenter) || !defaultCostCenter
    ? props.costCenters
    : [defaultCostCenter, ...props.costCenters];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    startTransition(async () => {
      try {
        if (isEdit) {
          await updateUser({
            userId: initial!.id,
            email,
            name,
            role,
            defaultCostCenter: defaultCostCenter || null,
            newPassword: password || null,
          });
        } else {
          await createUser({ email, name, role, password });
          setName("");
          setEmail("");
          setRole("requester");
          setDefaultCostCenter("");
        }
        setPassword("");
        setOk(true);
        props.onSaved?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
      }
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="uf-name">Name *</Label>
        <Input
          id="uf-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="uf-email">E-Mail *</Label>
        <Input
          id="uf-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="uf-role">Rolle *</Label>
        <select
          id="uf-role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
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
        <Label htmlFor="uf-cc">Default-Kostenstelle</Label>
        {ccOptions.length === 0 ? (
          <Input
            id="uf-cc"
            value={defaultCostCenter}
            onChange={(e) => setDefaultCostCenter(e.target.value)}
            placeholder="(keine Kostenstellen konfiguriert)"
            maxLength={120}
          />
        ) : (
          <select
            id="uf-cc"
            value={defaultCostCenter}
            onChange={(e) => setDefaultCostCenter(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">— keine —</option>
            {ccOptions.map((cc) => (
              <option key={cc} value={cc}>
                {cc}
              </option>
            ))}
          </select>
        )}
        <p className="text-xs text-muted-foreground">
          Auswahl wird in Grundeinstellungen → Kostenstellen gepflegt.
        </p>
      </div>
      <div className="md:col-span-2 space-y-2">
        <Label htmlFor="uf-password">
          {isEdit ? "Neues Passwort (leer lassen = unverändert)" : "Initial-Passwort * (min. 10)"}
        </Label>
        <Input
          id="uf-password"
          type="password"
          required={!isEdit}
          minLength={isEdit ? 0 : 10}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isEdit ? "leer lassen, um nicht zu ändern" : ""}
        />
      </div>
      <div className="md:col-span-2 space-y-2">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {ok && (
          <p className="text-sm text-green-600">
            {isEdit ? "Änderungen gespeichert." : "Benutzer angelegt."}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending
            ? isEdit
              ? "Speichere…"
              : "Lege an…"
            : isEdit
              ? "Speichern"
              : "Anlegen"}
        </Button>
      </div>
    </form>
  );
}
