"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AttributeSchemaItem } from "@/modules/categories/defaults";

interface Props { schema: AttributeSchemaItem[]; }

export function CustomFiltersSidebar({ schema }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function get(key: string, suffix = ""): string {
    return sp.get(`attr.${key}${suffix ? "." + suffix : ""}`) ?? "";
  }
  function getAll(key: string): string[] {
    return sp.getAll(`attr.${key}`);
  }
  function setSingle(key: string, suffix: string | "", value: string) {
    const next = new URLSearchParams(sp.toString());
    const fullKey = `attr.${key}${suffix ? "." + suffix : ""}`;
    if (value) next.set(fullKey, value); else next.delete(fullKey);
    router.push(`${pathname}?${next.toString()}`);
  }
  function toggleMulti(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    const current = next.getAll(`attr.${key}`);
    next.delete(`attr.${key}`);
    const has = current.includes(value);
    const after = has ? current.filter((v) => v !== value) : [...current, value];
    for (const v of after) next.append(`attr.${key}`, v);
    router.push(`${pathname}?${next.toString()}`);
  }
  function reset() {
    const next = new URLSearchParams(sp.toString());
    for (const k of Array.from(next.keys())) if (k.startsWith("attr.")) next.delete(k);
    router.push(`${pathname}?${next.toString()}`);
  }

  const filterable = schema.filter((s) => s.type !== "text" && s.type !== "longtext" && s.type !== "url");
  if (filterable.length === 0) return null;

  return (
    <div className="space-y-4 rounded border p-3 text-sm">
      <h3 className="font-semibold">Filter</h3>
      {filterable.map((item) => (
        <div key={item.key}>
          <Label className="text-xs uppercase">{item.label}</Label>
          {item.type === "number" && (
            <div className="flex gap-2 mt-1">
              <Input type="number" placeholder="min" value={get(item.key, "min")}
                onChange={(e) => setSingle(item.key, "min", e.target.value)} />
              <Input type="number" placeholder="max" value={get(item.key, "max")}
                onChange={(e) => setSingle(item.key, "max", e.target.value)} />
            </div>
          )}
          {item.type === "date" && (
            <div className="flex gap-2 mt-1">
              <Input type="date" value={get(item.key, "gte")}
                onChange={(e) => setSingle(item.key, "gte", e.target.value)} />
              <Input type="date" value={get(item.key, "lte")}
                onChange={(e) => setSingle(item.key, "lte", e.target.value)} />
            </div>
          )}
          {item.type === "boolean" && (
            <label className="flex items-center gap-2 mt-1">
              <input type="checkbox" checked={get(item.key) === "true"}
                onChange={(e) => setSingle(item.key, "", e.target.checked ? "true" : "")} />
              nur „ja"
            </label>
          )}
          {item.type === "select" && (
            <div className="space-y-1 mt-1">
              {(item.options ?? []).map((o) => (
                <label key={o.value} className="flex items-center gap-2">
                  <input type="checkbox" checked={getAll(item.key).includes(o.value)}
                    onChange={() => toggleMulti(item.key, o.value)} />
                  {o.label}
                </label>
              ))}
            </div>
          )}
          {item.type === "multiselect" && (
            <div className="space-y-1 mt-1">
              {(item.options ?? []).map((o) => (
                <label key={o.value} className="flex items-center gap-2">
                  <input type="checkbox" checked={getAll(item.key).includes(o.value)}
                    onChange={() => toggleMulti(item.key, o.value)} />
                  {o.label}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={reset}>Filter zurücksetzen</Button>
    </div>
  );
}
