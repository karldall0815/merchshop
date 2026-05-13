"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

// Submits as GET via the URL so the search state is shareable and the
// server component on /shop re-renders with the new query string.
export function ShopSearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    const target = q ? `/shop?q=${encodeURIComponent(q)}` : "/shop";
    startTransition(() => router.push(target));
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Artikel suchen…"
        className="max-w-sm"
      />
      {pending && <span className="text-xs text-muted-foreground">sucht…</span>}
    </form>
  );
}
