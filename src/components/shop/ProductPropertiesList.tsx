import type { AttributeSchemaItem, AttributeOption } from "@/modules/categories/defaults";

interface Props {
  schema: AttributeSchemaItem[];
  values: Record<string, unknown> | null;
}

function formatValue(item: AttributeSchemaItem, raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  switch (item.type) {
    case "boolean":
      return raw === true ? "✓" : null;
    case "select": {
      const o = (item.options ?? []).find((opt: AttributeOption) => opt.value === raw);
      return o?.label ?? String(raw);
    }
    case "multiselect": {
      const arr = (raw as string[]) ?? [];
      if (arr.length === 0) return null;
      const labels = arr.map((v) => (item.options ?? []).find((o) => o.value === v)?.label ?? v);
      return labels.join(", ");
    }
    case "date":
      try { return new Date(raw as string).toLocaleDateString("de-DE"); }
      catch { return String(raw); }
    case "url":
      return String(raw);
    default:
      return String(raw);
  }
}

export function ProductPropertiesList({ schema, values }: Props) {
  if (!values) return null;
  const sorted = [...schema].sort((a, b) => a.sortOrder - b.sortOrder);
  const rows = sorted
    .map((item) => ({ item, display: formatValue(item, values[item.key]) }))
    .filter((r) => r.display !== null);
  if (rows.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold uppercase text-muted-foreground">Eigenschaften</h3>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
        {rows.map(({ item, display }) => (
          <div key={item.key} className="contents">
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd>
              {item.type === "url" ? (
                <a href={display!} target="_blank" rel="noreferrer" className="underline">{display}</a>
              ) : display}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
