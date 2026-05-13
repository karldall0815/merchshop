import { db } from "@/lib/db";

export async function listSupportReports(filter?: {
  status?: "open" | "seen" | "resolved";
  type?: "auto" | "manual";
}) {
  return db.supportReport.findMany({
    where: {
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.type ? { type: filter.type } : {}),
    },
    orderBy: [{ status: "asc" }, { lastSeenAt: "desc" }],
    include: { reporter: { select: { id: true, name: true, email: true } } },
  });
}

export async function getSupportReport(id: string) {
  return db.supportReport.findUnique({
    where: { id },
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      resolvedBy: { select: { id: true, name: true } },
    },
  });
}

export async function countOpenSupportReports(): Promise<number> {
  return db.supportReport.count({ where: { status: "open" } });
}
