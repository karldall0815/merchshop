"use client";

import { useState, useTransition } from "react";
import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  resetUserPassword,
  setUserActive,
  updateUserDefaultCostCenter,
  updateUserRole,
} from "@/modules/admin/users";

const ROLES: Role[] = ["requester", "approver", "agentur", "admin"];

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  defaultCostCenter: string | null;
};

export function UserRow({ user }: { user: UserItem }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [costCenter, setCostCenter] = useState(user.defaultCostCenter ?? "");
  const [ccSaved, setCcSaved] = useState(false);

  function run(fn: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Fehler");
      }
    });
  }

  return (
    <tr className={user.active ? "" : "opacity-60"}>
      <td className="px-4 py-3 font-medium">{user.name}</td>
      <td className="px-4 py-3">{user.email}</td>
      <td className="px-4 py-3">
        <select
          value={user.role}
          disabled={pending}
          onChange={(e) => run(() => updateUserRole(user.id, e.target.value as Role))}
          className="rounded-md border bg-background px-2 py-1 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        {user.active ? (
          <span className="text-green-700 dark:text-green-400">aktiv</span>
        ) : (
          <span className="text-muted-foreground">inaktiv</span>
        )}
      </td>
      <td className="px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setCcSaved(false);
            run(async () => {
              await updateUserDefaultCostCenter({
                userId: user.id,
                defaultCostCenter: costCenter,
              });
              setCcSaved(true);
            });
          }}
          className="flex items-center gap-2"
        >
          <Input
            type="text"
            value={costCenter}
            onChange={(e) => {
              setCostCenter(e.target.value);
              setCcSaved(false);
            }}
            placeholder="z. B. KST-4711"
            maxLength={120}
            className="w-44"
          />
          <Button type="submit" size="sm" variant="ghost" disabled={pending}>
            Speichern
          </Button>
          {ccSaved && (
            <span className="text-xs text-green-700 dark:text-green-400">
              gespeichert
            </span>
          )}
        </form>
      </td>
      <td className="px-4 py-3 space-y-2">
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => run(() => setUserActive(user.id, !user.active))}
          >
            {user.active ? "Deaktivieren" : "Aktivieren"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => setResetting((v) => !v)}
          >
            Passwort
          </Button>
        </div>
        {resetting && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                await resetUserPassword(user.id, newPw);
                setNewPw("");
                setResetting(false);
              });
            }}
            className="flex gap-2"
          >
            <Input
              type="password"
              minLength={10}
              required
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="neues Passwort (min. 10)"
              className="w-64"
            />
            <Button type="submit" size="sm" disabled={pending}>
              Setzen
            </Button>
          </form>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}
