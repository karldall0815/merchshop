import { db } from "@/lib/db";
import { ReinitSetupButton } from "@/components/admin/ReinitSetupButton";
import { SkuSettingsForm } from "@/components/admin/SkuSettingsForm";
import { getGeneralSettings } from "@/modules/admin/general-settings";

export const dynamic = "force-dynamic";

// Settings page is read-mostly: it lists non-secret values and offers a
// way to re-launch the wizard for SMTP/S3/branding tweaks. Direct edit
// of secrets via web form is intentionally NOT supported here — the
// wizard already covers that path and writes encrypted at rest.

const VISIBLE_KEYS = [
  "app.url",
  "email.mode",
  "email.from",
  "storage.endpoint",
  "storage.region",
  "storage.bucket",
  "branding.name",
];

export default async function AdminSettingsPage() {
  const rows = await db.setting.findMany({
    where: { key: { in: VISIBLE_KEYS } },
    orderBy: { key: "asc" },
  });
  const setup = await db.systemSetup.findUnique({ where: { id: 1 } });
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const general = await getGeneralSettings();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Grundeinstellungen</h1>
        <p className="text-sm text-muted-foreground">
          Anpassbare Stammwerte und Übersicht der ohne Klartext-Risiko anzeigbaren Settings. Geheime Werte
          (Passwörter, API-Keys) sind verschlüsselt gespeichert und werden hier
          nicht angezeigt — für Änderungen bitte den Setup-Wizard erneut starten.
        </p>
      </header>

      <section className="rounded-lg border bg-card p-4 space-y-3">
        <h2 className="font-medium">Artikelnummer-Schema (SKU)</h2>
        <p className="text-sm text-muted-foreground">
          Definiere Präfix und Anzahl der Ziffern für automatisch vorgeschlagene SKUs bei der Artikelanlage.
          Der Vorschlag basiert auf der höchsten vorhandenen passenden SKU + 1. Der Anleger kann den Vorschlag
          jederzeit überschreiben.
        </p>
        <SkuSettingsForm initial={general} />
      </section>

      <section className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Schlüssel</th>
              <th className="px-4 py-3 text-left font-medium">Wert</th>
              <th className="px-4 py-3 text-left font-medium">Geändert</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {VISIBLE_KEYS.map((k) => {
              const r = byKey.get(k);
              return (
                <tr key={k}>
                  <td className="px-4 py-3 font-mono text-xs">{k}</td>
                  <td className="px-4 py-3">
                    {r ? (
                      r.encrypted ? (
                        <span className="text-muted-foreground">(verschlüsselt)</span>
                      ) : (
                        <span className="font-mono text-xs">{r.value}</span>
                      )
                    ) : (
                      <span className="text-muted-foreground">— nicht gesetzt —</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {r ? new Date(r.updatedAt).toLocaleString("de-DE") : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border bg-card p-4 space-y-3">
        <h2 className="font-medium">System-Setup</h2>
        <p className="text-sm">
          Installiert am:{" "}
          <span className="font-mono">
            {setup?.installedAt
              ? new Date(setup.installedAt).toLocaleString("de-DE")
              : "—"}
          </span>{" "}
          · Version <span className="font-mono">{setup?.version ?? "—"}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Setup-Wizard erneut öffnen, um z. B. SMTP-Daten nachzutragen.
        </p>
        <ReinitSetupButton />
      </section>
    </div>
  );
}
