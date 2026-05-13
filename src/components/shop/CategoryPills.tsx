"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface CategoryLite { id: string; name: string; }

export function CategoryPills({ categories, activeId }: { categories: CategoryLite[]; activeId: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function navigate(id: string | null) {
    const next = new URLSearchParams(sp.toString());
    for (const k of Array.from(next.keys())) if (k.startsWith("attr.")) next.delete(k);
    if (id) next.set("cat", id); else next.delete("cat");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button onClick={() => navigate(null)}
        className={`rounded-full px-3 py-1 text-sm border ${!activeId ? "bg-primary text-primary-foreground" : ""}`}>
        Alle
      </button>
      {categories.map((c) => (
        <button key={c.id} onClick={() => navigate(c.id)}
          className={`rounded-full px-3 py-1 text-sm border ${activeId === c.id ? "bg-primary text-primary-foreground" : ""}`}>
          {c.name}
        </button>
      ))}
    </div>
  );
}
