-- Partial unique index: at most one Order per requester can sit in draft
-- (the cart). Prisma can introspect partial indexes but not author them
-- via schema.prisma, so we maintain this one manually here.
CREATE UNIQUE INDEX IF NOT EXISTS "Order_one_draft_per_requester"
  ON "Order"("requesterId")
  WHERE status = 'draft';
