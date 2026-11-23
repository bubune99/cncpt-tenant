-- Rollback: the table only holds short-lived rate-limit counts; dropping it loses nothing that matters.
DROP TABLE IF EXISTS "usage_counters";
