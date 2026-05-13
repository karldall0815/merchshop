"use client";

import { useTransition, useState } from "react";
import { submitEmail } from "@/modules/setup/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EmailStep() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"resend" | "smtp" | "later">("smtp");

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const testRecipient = String(formData.get("testRecipient") ?? "") || undefined;
        if (mode === "resend") {
          await submitEmail({
            mode: "resend",
            apiKey: String(formData.get("apiKey") ?? ""),
            from: String(formData.get("from") ?? ""),
          }, testRecipient);
        } else if (mode === "smtp") {
          await submitEmail({
            mode: "smtp",
            host: String(formData.get("host") ?? ""),
            port: Number(formData.get("port") ?? 587),
            user: String(formData.get("user") ?? "") || undefined,
            password: String(formData.get("password") ?? "") || undefined,
            secure: formData.get("secure") === "on",
            from: String(formData.get("from") ?? ""),
          }, testRecipient);
        } else {
          await submitEmail({ mode: "later" });
        }
      } catch (e) {
        if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
        setError(e instanceof Error ? e.message : "unbekannter Fehler");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">E-Mail-Versand</h2>
      <div className="flex gap-3 text-sm">
        {(["smtp", "resend", "later"] as const).map((m) => (
          <label key={m} className="flex items-center gap-1">
            <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} />
            {m === "smtp" ? "SMTP" : m === "resend" ? "Resend" : "Später konfigurieren"}
          </label>
        ))}
      </div>

      {mode === "resend" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="apiKey">Resend API-Key *</Label>
            <Input id="apiKey" name="apiKey" required />
          </div>
        </>
      )}
      {mode === "smtp" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="host">Host *</Label>
              <Input id="host" name="host" required defaultValue="localhost" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port *</Label>
              <Input id="port" name="port" type="number" required defaultValue="1025" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="user">User</Label>
            <Input id="user" name="user" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input id="password" name="password" type="password" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="secure" /> TLS (Port 465)
          </label>
        </>
      )}
      {mode !== "later" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="from">Absenderadresse *</Label>
            <Input id="from" name="from" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="testRecipient">Test-Mail an (optional)</Label>
            <Input id="testRecipient" name="testRecipient" type="email" />
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Teste…" : "Speichern"}</Button>
    </form>
  );
}
