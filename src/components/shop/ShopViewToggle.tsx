"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import { useEffect } from "react";

export type ShopView = "grid" | "list";

// The toggle pushes the selected view into the URL query and keeps it
// in localStorage so the next /shop visit defaults to the user's last
// pick. URL is the source of truth (server-rendered), localStorage is
// only consulted to restore a missing query.
export function ShopViewToggle({ current }: { current: ShopView }) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();

  // First-visit restore: if the URL has no `view=`, but a previous
  // choice lives in localStorage, transparently apply it.
  useEffect(() => {
    if (params.get("view")) return;
    const saved = (typeof window !== "undefined" && localStorage.getItem("shop:view")) as
      | ShopView
      | null;
    if (saved && saved !== current) {
      const next = new URLSearchParams(params);
      next.set("view", saved);
      router.replace(`${pathname}?${next.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function select(view: ShopView) {
    if (typeof window !== "undefined") localStorage.setItem("shop:view", view);
    const next = new URLSearchParams(params);
    next.set("view", view);
    router.push(`${pathname}?${next.toString()}`);
  }

  const baseBtn =
    "inline-flex h-9 w-9 items-center justify-center rounded-md transition";
  const activeCls = "bg-foreground text-background";
  const idleCls = "text-foreground/70 hover:bg-muted hover:text-foreground";

  return (
    <div className="inline-flex items-center gap-1 rounded-md border p-1">
      <button
        type="button"
        title="Raster"
        aria-label="Rasteransicht"
        aria-pressed={current === "grid"}
        onClick={() => select("grid")}
        className={`${baseBtn} ${current === "grid" ? activeCls : idleCls}`}
      >
        <LayoutGrid className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        title="Liste"
        aria-label="Listenansicht"
        aria-pressed={current === "list"}
        onClick={() => select("list")}
        className={`${baseBtn} ${current === "list" ? activeCls : idleCls}`}
      >
        <List className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}
