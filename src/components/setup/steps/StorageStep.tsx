"use client";

import { useTransition, useState } from "react";
import { submitStorage } from "@/modules/setup/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StorageStep() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await submitStorage({
          endpoint: String(formData.get("endpoint") ?? ""),
          region: String(formData.get("region") ?? "eu-central-1"),
          bucket: String(formData.get("bucket") ?? ""),
          accessKey: String(formData.get("accessKey") ?? ""),
          secretKey: String(formData.get("secretKey") ?? ""),
          forcePathStyle: formData.get("forcePathStyle") === "on",
        });
      } catch (e) {
        if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
        setError(e instanceof Error ? e.message : "unbekannter Fehler");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">Object-Storage (S3/MinIO)</h2>
      <p className="text-sm text-muted-foreground">
        Beim Speichern wird ein Verbindungstest durchgeführt (Upload + Löschen einer Test-Datei).
      </p>
      <div className="space-y-2">
        <Label htmlFor="endpoint">Endpoint *</Label>
        <Input id="endpoint" name="endpoint" type="url" required defaultValue="http://localhost:9000" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <Input id="region" name="region" defaultValue="eu-central-1" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bucket">Bucket *</Label>
          <Input id="bucket" name="bucket" required defaultValue="merchshop-images" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="accessKey">Access Key *</Label>
        <Input id="accessKey" name="accessKey" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="secretKey">Secret Key *</Label>
        <Input id="secretKey" name="secretKey" type="password" required />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="forcePathStyle" defaultChecked /> Path-Style (für MinIO)
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Teste…" : "Verbindung testen & speichern"}</Button>
    </form>
  );
}
