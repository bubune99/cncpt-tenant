-- Webhook Events table for idempotency
-- Tracks processed webhook event IDs to prevent double-processing on retries
-- Used by both CMS Stripe webhooks (via Prisma) and platform webhooks (via raw SQL)

CREATE TABLE IF NOT EXISTS webhook_events (
  id         TEXT PRIMARY KEY,         -- Stripe event ID (e.g., evt_xxx)
  source     TEXT NOT NULL DEFAULT 'stripe',
  type       TEXT NOT NULL,            -- Event type (e.g., checkout.session.completed)
  processed  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_source ON webhook_events(source);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Auto-cleanup: remove events older than 90 days (optional, run via cron)
-- DELETE FROM webhook_events WHERE created_at < NOW() - INTERVAL '90 days';
