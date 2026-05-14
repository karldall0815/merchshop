"use client";

import { useState, useTransition } from "react";
import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { setUserActive } from "@/modules/admin/users";
import { EditUserDialog } from "@/components/admin/EditUserDialog";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  defaultCostCenter: string | null;
};

interface Props {
  user: UserItem;
  costCenters: string[];
}

export function UserRow({ user, costCenters }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleActive() {
    setError(null);
    startTransition(async () => {
      try {
        await setUserActive(user.id, !user.active);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Fehler");
      }
    });
  }

  return (
    <tr className={user.active ? "" : "opacity-60"}>
      <td className="px-4 py-3 font-medium">{user.name}</td>
      <td className="px-4 py-3">
        {user.active ? (
          <span className="text-green-700 dark:text-green-400">aktiv</span>
        ) : (
          <span className="text-muted-foreground">inaktiv</span>
        )}
      </td>
      <td className="px-4 py-3 space-y-1">
        <div className="flex flex-wrap gap-2">
          <EditUserDialog
            user={{
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              defaultCostCenter: user.defaultCostCenter,
            }}
            costCenters={costCenters}
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={toggleActive}
          >
            {user.active ? "Deaktivieren" : "Aktivieren"}
          </Button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}
