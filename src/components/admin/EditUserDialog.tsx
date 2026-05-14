"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { UserForm, type UserFormUser } from "@/components/admin/UserForm";

interface Props {
  user: UserFormUser;
  costCenters: string[];
}

export function EditUserDialog({ user, costCenters }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        render={
          <Button type="button" size="sm" variant="ghost">
            Bearbeiten
          </Button>
        }
      />
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-40" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(640px,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg focus:outline-none">
          <div className="mb-4 space-y-1">
            <Dialog.Title className="text-lg font-semibold">
              Benutzer bearbeiten
            </Dialog.Title>
            <Dialog.Description className="text-sm text-muted-foreground">
              Änderungen werden sofort wirksam und im Audit-Log protokolliert.
            </Dialog.Description>
          </div>

          <UserForm
            mode="edit"
            user={user}
            costCenters={costCenters}
            onSaved={() => setOpen(false)}
          />

          <div className="mt-4 flex justify-end">
            <Dialog.Close
              render={
                <Button type="button" variant="ghost">
                  Schließen
                </Button>
              }
            />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
