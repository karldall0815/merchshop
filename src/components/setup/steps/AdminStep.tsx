"use client";

import { useTransition, useState } from "react";
import { submitAdmin } from "@/modules/setup/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminStep() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");
    if (password !== confirm) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }
    if (password.length < 12) {
      setError("Passwort muss mindestens 12 Zeichen lang sein.");
      return;
    }
    startTransition(async () => {
      try {
        await submitAdmin({
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          password,
        });
      } catch (e) {
        if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
        setError(e instanceof Error ? e.message : "unbekannter Fehler");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">Admin-Account anlegen</h2>
      <div className="space-y-2">
        <Label htmlFor="name">Anzeigename *</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-Mail *</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Passwort * (min. 12 Zeichen)</Label>
        <Input id="password" name="password" type="password" required minLength={12} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Passwort bestätigen *</Label>
        <Input id="confirm" name="confirm" type="password" required minLength={12} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Anlegen…" : "Weiter"}</Button>
    </form>
  );
}
