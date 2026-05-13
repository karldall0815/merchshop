import { db } from "@/lib/db";

export type AuditFilter = {
  entity?: string;
  actorId?: string;
  action?: string;
  q?: string;
  limit?: number;
};

// Audit-log filter. `q` is a free-text search across entityId so
// orderNumbers / productIds dropped into the search box still match.
export async function listAudit(filter: AuditFilter = {}) {
  const limit = Math.min(filter.limit ?? 200, 500);
  return db.auditLog.findMany({
    where: {
      ...(filter.entity ? { entity: filter.entity } : {}),
      ...(filter.actorId ? { actorId: filter.actorId } : {}),
      ...(filter.action ? { action: filter.action } : {}),
      ...(filter.q
        ? {
            OR: [
              { entityId: { contains: filter.q, mode: "insensitive" as const } },
              { action: { contains: filter.q, mode: "insensitive" as const } },
              { entity: { contains: filter.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actor: { select: { name: true, role: true } },
    },
  });
}

export async function distinctAuditEntities() {
  const rows = await db.auditLog.findMany({
    distinct: ["entity"],
    select: { entity: true },
    orderBy: { entity: "asc" },
  });
  return rows.map((r) => r.entity);
}
