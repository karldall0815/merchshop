"use client";

import { useTransition } from "react";
import type { DesignPreset } from "@/modules/admin/design/presets";
import { Button } from "@/components/ui/button";
import { applyPreset } from "@/modules/admin/design/actions";
import { Check } from "lucide-react";

export function PresetCard({
  preset,
  active,
}: {
  preset: DesignPreset;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function activate() {
    startTransition(async () => {
      await applyPreset(preset.id);
    });
  }

  // Inline preview tile painted in the preset's actual tokens so the
  // admin sees the design *before* committing.
  return (
    <div
      className="overflow-hidden rounded-lg border"
      style={{ background: preset.tokens.background, color: preset.tokens.foreground }}
    >
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{preset.name}</p>
            <p
              className="text-xs"
              style={{
                color: preset.mode === "dark" ? preset.tokens.muted : preset.tokens.foreground,
                opacity: 0.7,
              }}
            >
              {preset.description}
            </p>
          </div>
          {active && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs"
              style={{
                background: preset.tokens.primary,
                color: preset.mode === "dark" ? "#fff" : "#fff",
              }}
            >
              <Check className="h-3 w-3" strokeWidth={2.5} />
              aktiv
            </span>
          )}
        </div>

        <div className="rounded p-3" style={{ background: preset.tokens.card }}>
          <p className="text-sm font-medium" style={{ color: preset.tokens.foreground }}>
            Beispiel-Karte
          </p>
          <button
            type="button"
            className="mt-2 rounded px-3 py-1 text-xs"
            style={{
              background: preset.tokens.primary,
              color: "#fff",
              pointerEvents: "none",
            }}
          >
            Aktion
          </button>
        </div>

        <div className="flex gap-1">
          {(["primary", "accent", "muted", "border"] as const).map((k) => (
            <span
              key={k}
              className="h-4 w-4 rounded"
              style={{ background: preset.tokens[k] }}
              title={`${k}: ${preset.tokens[k]}`}
            />
          ))}
        </div>
      </div>

      <div className="border-t p-3" style={{ borderColor: preset.tokens.border }}>
        {active ? (
          <p className="text-center text-xs" style={{ opacity: 0.6 }}>
            Bereits aktiv
          </p>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            disabled={pending}
            onClick={activate}
            style={{ borderColor: preset.tokens.border }}
          >
            {pending ? "Wird angewendet…" : "Anwenden"}
          </Button>
        )}
      </div>
    </div>
  );
}
