-- Rate-limit counts in CNCPT's own database (lib/cms/rate-limit/db-limit.ts), replacing the deleted Upstash store.
-- Owner, inbox 67cd4334: "Add the table to the CNCPT database (as Dzidzor does)". Same shape as Dzidzor's
-- usage_counters. Additive only: one new table and its index, nothing existing is changed. Safe to run twice.
CREATE TABLE IF NOT EXISTS "usage_counters" (
  "kind"        TEXT         NOT NULL,
  "identity"    TEXT         NOT NULL,
  "windowStart" BIGINT       NOT NULL,
  "windowMs"    BIGINT       NOT NULL,
  "amount"      BIGINT       NOT NULL DEFAULT 0,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "usage_counters_pkey" PRIMARY KEY ("kind", "identity")
);
CREATE INDEX IF NOT EXISTS "usage_counters_kind_windowStart_idx" ON "usage_counters" ("kind", "windowStart");
