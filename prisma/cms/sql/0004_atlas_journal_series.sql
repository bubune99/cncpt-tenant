-- Atlas Redesign G03+G04: Blog series, contributors, related posts, distribution channels
-- Idempotent — safe to run multiple times

-- Blog series (G03)
CREATE TABLE IF NOT EXISTS blog_series (
  id             TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id      INTEGER     REFERENCES subdomains(id) ON DELETE CASCADE,
  title          TEXT        NOT NULL,
  slug           TEXT        NOT NULL,
  description    TEXT,
  cover_image_id TEXT,
  post_count     INTEGER     NOT NULL DEFAULT 0,
  position       INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_blog_series_tenant ON blog_series(tenant_id);

-- Junction: post belongs to series
CREATE TABLE IF NOT EXISTS blog_post_series (
  post_id   TEXT    NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  series_id TEXT    NOT NULL REFERENCES blog_series(id) ON DELETE CASCADE,
  position  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, series_id)
);

-- Blog contributors (G03)
CREATE TABLE IF NOT EXISTS blog_contributors (
  post_id  TEXT    NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id  TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role     TEXT    NOT NULL DEFAULT 'author',
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, user_id)
);

-- Related posts (G03)
CREATE TABLE IF NOT EXISTS blog_post_related (
  post_id         TEXT    NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  related_post_id TEXT    NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  position        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, related_post_id)
);

-- Add shop_product_ids array to blog_posts (G03)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS shop_product_ids TEXT[] DEFAULT '{}';

-- Distribution channels (G04)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'distribution_channel') THEN
    CREATE TYPE distribution_channel AS ENUM ('WEB','NEWSLETTER','RSS','TWITTER_X','MASTODON','INSTAGRAM');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_publish_status') THEN
    CREATE TYPE channel_publish_status AS ENUM ('DRAFT','SCHEDULED','PUBLISHED','FAILED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS post_distribution_channels (
  id           TEXT                    PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id      TEXT                    NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  channel      distribution_channel    NOT NULL,
  enabled      BOOLEAN                 NOT NULL DEFAULT false,
  copy         TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status       channel_publish_status  NOT NULL DEFAULT 'DRAFT',
  metadata     JSONB,
  created_at   TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_post_dist_channels_post ON post_distribution_channels(post_id);
