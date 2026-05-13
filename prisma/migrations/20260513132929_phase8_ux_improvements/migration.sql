-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "desiredDateIsDeadline" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultCostCenter" TEXT;

-- CreateTable
CREATE TABLE "SupportReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "userAgent" TEXT,
    "errorDigest" TEXT,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "userMessage" TEXT,
    "count" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportReport_status_createdAt_idx" ON "SupportReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SupportReport_errorDigest_url_idx" ON "SupportReport"("errorDigest", "url");

-- AddForeignKey
ALTER TABLE "SupportReport" ADD CONSTRAINT "SupportReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportReport" ADD CONSTRAINT "SupportReport_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
