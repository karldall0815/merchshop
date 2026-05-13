"use client";

import { useTransition, useState } from "react";
import { submitBranding } from "@/modules/setup/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BrandingStep() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await submitBranding({
          appName: String(formData.get("appName") ?? ""),
          subtitle: String(formData.get("subtitle") ?? "") || undefined,
          primaryColor: String(formData.get("primaryColor") ?? "#0f172a"),
          publicAppUrl: String(formData.get("publicAppUrl") ?? "") || undefined,
        });
      } catch (e) {
        if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
        setError(e instanceof Error ? e.message : "unbekannter Fehler");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">Branding</h2>
      <div className="space-y-2">
        <Label htmlFor="appName">Shop-Name *</Label>
        <Input id="appName" name="appName" required maxLength={80} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="subtitle">Untertitel</Label>
        <Input id="subtitle" name="subtitle" maxLength={160} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="primaryColor">Primärfarbe *</Label>
        <Input id="primaryColor" name="primaryColor" type="color" defaultValue="#0f172a" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="publicAppUrl">Public-App-URL</Label>
        <Input id="publicAppUrl" name="publicAppUrl" type="url" placeholder="https://merch.example.test" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Speichern…" : "Weiter"}</Button>
    </form>
  );
}
