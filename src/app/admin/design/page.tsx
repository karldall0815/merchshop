import { getActiveTheme } from "@/lib/theme";
import { getSetting } from "@/lib/settings";
import { PRESETS } from "@/modules/admin/design/presets";
import { PresetCard } from "@/components/admin/design/PresetCard";
import { CrawlImporter } from "@/components/admin/design/CrawlImporter";
import { BrandingForm } from "@/components/admin/design/BrandingForm";

export const dynamic = "force-dynamic";

export default async function AdminDesignPage() {
  const theme = await getActiveTheme();
  const logoUrl = (await getSetting("branding.logo")) || null;
  const replaceWordmark = (await getSetting("branding.replace_wordmark")) === "true";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Design</h1>
        <p className="text-sm text-muted-foreground">
          Vorlage wählen, eigene Website analysieren oder Logo hinterlegen. Änderungen
          gelten sofort für alle Seiten.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Aktives Design</h2>
        <div className="rounded-lg border bg-card p-4 text-sm">
          <p>
            Preset: <span className="font-mono">{theme.preset}</span>
            {theme.font && (
              <>
                {" · "}Schrift: <span className="font-mono">{theme.font}</span>
              </>
            )}
          </p>
          <div className="mt-3 flex gap-2">
            {(["background", "foreground", "primary", "card", "muted", "accent", "border"] as const).map(
              (k) => (
                <div key={k} className="text-center">
                  <span
                    className="inline-block h-10 w-10 rounded border"
                    style={{ background: theme.tokens[k] }}
                    title={`${k}: ${theme.tokens[k]}`}
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">{k}</p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Vorlagen</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PRESETS.map((p) => (
            <PresetCard key={p.id} preset={p} active={theme.preset === p.id} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Aus Website importieren</h2>
        <CrawlImporter />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Logo</h2>
        <BrandingForm initialLogoUrl={logoUrl} initialReplaceWordmark={replaceWordmark} />
      </section>
    </div>
  );
}
