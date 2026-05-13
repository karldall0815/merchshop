export function StockBadge({ current, minStock }: { current: number; minStock: number }) {
  const low = minStock > 0 && current < minStock;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      low ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
    }`}>
      {low ? "Niedrig" : "OK"}
    </span>
  );
}
