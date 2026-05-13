type MovementRowProps = {
  delta: number;
  reason: string;
  comment?: string | null;
  variantLabel?: string | null;
  actorName?: string | null;
  createdAt: Date;
};

const REASON_LABELS: Record<string, string> = {
  initial: "Erstbefüllung",
  restock: "Nachschub",
  order: "Bestellung",
  correction: "Korrektur",
  return_to_stock: "Rücklauf",
};

export function MovementRow(p: MovementRowProps) {
  const positive = p.delta > 0;
  return (
    <li className="grid grid-cols-[120px_80px_1fr_180px] items-center gap-3 border-b py-2 text-sm">
      <time className="text-muted-foreground">{p.createdAt.toLocaleString("de-DE")}</time>
      <span className={positive ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
        {positive ? "+" : ""}{p.delta}
      </span>
      <span>
        <strong>{REASON_LABELS[p.reason] ?? p.reason}</strong>
        {p.variantLabel ? ` · Variante ${p.variantLabel}` : null}
        {p.comment ? ` · ${p.comment}` : null}
      </span>
      <span className="text-muted-foreground">{p.actorName ?? "—"}</span>
    </li>
  );
}
