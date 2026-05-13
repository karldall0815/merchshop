"use client";

import { useState } from "react";
import { FAQ_ENTRIES, type FaqAudience, type FaqEntry } from "@/lib/support-faq";

const AUDIENCE_LABELS: Record<FaqAudience, string> = {
  all: "Alle",
  requester: "Besteller",
  approver: "Freigeber",
  agentur: "Agentur",
  admin: "Admin",
};

export function FaqAccordion({ defaultAudience }: { defaultAudience?: FaqAudience }) {
  const [search, setSearch] = useState("");
  const [audience, setAudience] = useState<FaqAudience | "all">(defaultAudience ?? "all");

  const filtered = FAQ_ENTRIES.filter((e: FaqEntry) => {
    const matchAud = audience === "all" || e.audience.includes(audience) || e.audience.includes("all");
    const q = search.trim().toLowerCase();
    const matchSearch = !q || e.question.toLowerCase().includes(q) || e.answer.toLowerCase().includes(q);
    return matchAud && matchSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suche nach Stichwort…"
          className="rounded-md border px-3 py-1.5 text-sm flex-1 min-w-[12rem]"
        />
        <div className="flex flex-wrap gap-1">
          {(["all", "requester", "approver", "agentur", "admin"] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAudience(a)}
              className={`rounded-full px-3 py-1 text-xs border ${audience === a ? "bg-primary text-primary-foreground" : ""}`}
            >
              {AUDIENCE_LABELS[a]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          Keine passende Frage gefunden. Versuch andere Stichworte oder einen anderen Filter.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => (
            <details key={e.id} className="rounded-md border p-3 [&_summary]:cursor-pointer">
              <summary className="font-medium">{e.question}</summary>
              <p className="mt-2 text-sm whitespace-pre-line text-muted-foreground">{e.answer}</p>
              <div className="mt-2 flex gap-1">
                {e.audience.map((a) => (
                  <span key={a} className="rounded bg-muted px-1.5 py-0.5 text-[0.625rem] uppercase text-muted-foreground">
                    {AUDIENCE_LABELS[a]}
                  </span>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
