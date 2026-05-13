"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Home,
  Store,
  ShoppingCart,
  Package,
  CheckSquare,
  Tag,
  Boxes,
  Truck,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { CartBadge } from "@/components/nav/CartBadge";

type Role = "admin" | "agentur" | "approver" | "requester";

type NavItem = { href: string; label: string; icon: LucideIcon; allow: Role[] };

// Primary nav (left side). Workflow-ordered.
const PRIMARY: NavItem[] = [
  { href: "/", label: "Start", icon: Home, allow: ["admin", "agentur", "approver", "requester"] },
  { href: "/shop", label: "Shop", icon: Store, allow: ["admin", "agentur", "approver", "requester"] },
  { href: "/orders", label: "Bestellungen", icon: Package, allow: ["admin", "agentur", "approver", "requester"] },
  { href: "/approvals", label: "Freigaben", icon: CheckSquare, allow: ["admin", "approver"] },
  { href: "/catalog", label: "Artikel", icon: Tag, allow: ["admin", "agentur"] },
  { href: "/inventory", label: "Bestand", icon: Boxes, allow: ["admin", "agentur"] },
  { href: "/fulfillment", label: "Fulfillment", icon: Truck, allow: ["admin", "agentur"] },
  { href: "/reports", label: "Reports", icon: BarChart3, allow: ["admin", "agentur", "approver", "requester"] },
];

// Quick-access nav (right side) — utility actions distinct from the
// workflow itself. Cart for shoppers, settings for admin.
const UTILITY: NavItem[] = [
  { href: "/cart", label: "Warenkorb", icon: ShoppingCart, allow: ["admin", "agentur", "approver", "requester"] },
  { href: "/admin/users", label: "Einstellungen", icon: Settings, allow: ["admin"] },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function NavLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={item.label}
      aria-label={item.label}
      className="group relative inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 transition hover:bg-muted hover:text-foreground"
    >
      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      {item.href === "/cart" && (
        <span className="absolute -right-1 -top-1">
          <CartBadge />
        </span>
      )}
      <span className="pointer-events-none absolute top-full mt-1 z-10 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow transition group-hover:opacity-100 group-focus:opacity-100">
        {item.label}
      </span>
    </Link>
  );
}

export function TopNav({
  logoUrl,
  replaceWordmark = false,
}: {
  logoUrl?: string | null;
  replaceWordmark?: boolean;
}) {
  const { data, status } = useSession();
  if (status !== "authenticated") return null;
  const user = data?.user as { name?: string; email?: string; role?: Role } | undefined;
  const role = user?.role;
  if (!role) return null;
  const primary = PRIMARY.filter((n) => n.allow.includes(role));
  const utility = UTILITY.filter((n) => n.allow.includes(role));
  const showLogo = !!logoUrl;
  const showWordmark = !replaceWordmark || !showLogo;

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <nav className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            {showLogo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl!}
                alt="Logo"
                className="h-7 w-auto max-w-[140px] object-contain"
              />
            )}
            {showWordmark && <span>MerchShop</span>}
          </Link>
          <ul className="flex items-center gap-1 text-sm">
            {primary.map((n) => (
              <li key={n.href}>
                <NavLink item={n} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ul className="flex items-center gap-1">
            {utility.map((n) => (
              <li key={n.href}>
                <NavLink item={n} />
              </li>
            ))}
          </ul>
          {user?.name && (
            <span
              title={user.name}
              aria-label={user.name}
              className="ml-1 inline-flex h-9 w-9 select-none items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-foreground"
            >
              {initials(user.name)}
            </span>
          )}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
