import Link from "next/link";

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto max-w-3xl py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Support</h1>
      <nav className="flex gap-4 border-b pb-2 text-sm">
        <Link href="/support" className="hover:underline">FAQ</Link>
        <Link href="/support/report" className="hover:underline">Fehler melden</Link>
      </nav>
      <div>{children}</div>
    </div>
  );
}
