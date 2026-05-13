"use client";

import { useTransition, useState } from "react";
import { submitShipping } from "@/modules/setup/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ShippingStep() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"sandbox" | "production" | "later">("later");

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "later") {
          await submitShipping({ mode: "later" });
        } else {
          await submitShipping({
            mode,
            apiKey: String(formData.get("apiKey") ?? ""),
            user: String(formData.get("user") ?? ""),
            password: String(formData.get("password") ?? ""),
            accountNumber: String(formData.get("accountNumber") ?? ""),
            senderName: String(formData.get("senderName") ?? ""),
            senderStreet: String(formData.get("senderStreet") ?? ""),
            senderZip: String(formData.get("senderZip") ?? ""),
            senderCity: String(formData.get("senderCity") ?? ""),
            senderCountry: String(formData.get("senderCountry") ?? "DE"),
          });
        }
      } catch (e) {
        if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
        setError(e instanceof Error ? e.message : "unbekannter Fehler");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">Versand (DHL)</h2>
      <p className="text-sm text-muted-foreground">Optional. Kann auch später im Admin-Bereich konfiguriert werden.</p>
      <div className="flex gap-3 text-sm">
        {(["sandbox", "production", "later"] as const).map((m) => (
          <label key={m} className="flex items-center gap-1">
            <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} />
            {m === "sandbox" ? "Sandbox" : m === "production" ? "Produktion" : "Später"}
          </label>
        ))}
      </div>

      {mode !== "later" && (
        <>
          <div className="space-y-2"><Label htmlFor="apiKey">API-Key *</Label><Input id="apiKey" name="apiKey" required /></div>
          <div className="space-y-2"><Label htmlFor="user">User *</Label><Input id="user" name="user" required /></div>
          <div className="space-y-2"><Label htmlFor="password">Passwort *</Label><Input id="password" name="password" type="password" required /></div>
          <div className="space-y-2"><Label htmlFor="accountNumber">Kundennummer *</Label><Input id="accountNumber" name="accountNumber" required /></div>
          <fieldset className="space-y-2 rounded-md border p-3">
            <legend className="text-sm font-medium">Default-Absenderadresse</legend>
            <Input name="senderName" placeholder="Name *" required />
            <Input name="senderStreet" placeholder="Straße & Hausnr. *" required />
            <div className="grid grid-cols-2 gap-2">
              <Input name="senderZip" placeholder="PLZ *" required />
              <Input name="senderCity" placeholder="Ort *" required />
            </div>
            <Input name="senderCountry" placeholder="Land (ISO) *" defaultValue="DE" required />
          </fieldset>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Speichern…" : "Weiter"}</Button>
    </form>
  );
}
