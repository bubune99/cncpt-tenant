-- Platform Invites table for super-admin user invitation system
-- Allows super admins to invite new users to the platform

CREATE TABLE IF NOT EXISTS platform_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  invited_by TEXT NOT NULL,  -- super admin user ID
  invited_by_email TEXT,     -- super admin email for display
  tier TEXT DEFAULT 'starter',
  message TEXT,              -- personal message in invite email
  token TEXT UNIQUE NOT NULL, -- for the invite link
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  accepted_at TIMESTAMPTZ,
  accepted_by TEXT,          -- user ID who accepted
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for platform invites
CREATE INDEX IF NOT EXISTS idx_platform_invites_email ON platform_invites(email);
CREATE INDEX IF NOT EXISTS idx_platform_invites_token ON platform_invites(token);
CREATE INDEX IF NOT EXISTS idx_platform_invites_status ON platform_invites(status);
CREATE INDEX IF NOT EXISTS idx_platform_invites_invited_by ON platform_invites(invited_by);
CREATE INDEX IF NOT EXISTS idx_platform_invites_expires ON platform_invites(expires_at);

-- Platform user metadata table for admin notes, suspension, soft deletion
-- This stores admin-side metadata about users that Stack Auth doesn't track
CREATE TABLE IF NOT EXISTS platform_user_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,  -- Stack Auth user ID
  admin_notes TEXT,              -- Admin notes about this user
  suspended_at TIMESTAMPTZ,
  suspended_by TEXT,             -- Admin who suspended
  suspension_reason TEXT,
  deleted_at TIMESTAMPTZ,        -- Soft delete timestamp
  deleted_by TEXT,               -- Admin who deleted
  deletion_reason TEXT,
  hard_delete_after TIMESTAMPTZ, -- When to hard-delete (30 days after soft-delete)
  tier_override TEXT,            -- Manual tier override
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user metadata
CREATE INDEX IF NOT EXISTS idx_platform_user_metadata_user ON platform_user_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_user_metadata_suspended ON platform_user_metadata(suspended_at) WHERE suspended_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_platform_user_metadata_deleted ON platform_user_metadata(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_platform_user_metadata_hard_delete ON platform_user_metadata(hard_delete_after) WHERE hard_delete_after IS NOT NULL;

-- Trigger for updated_at on platform_invites
DROP TRIGGER IF EXISTS update_platform_invites_updated_at ON platform_invites;
CREATE TRIGGER update_platform_invites_updated_at
    BEFORE UPDATE ON platform_invites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on platform_user_metadata
DROP TRIGGER IF EXISTS update_platform_user_metadata_updated_at ON platform_user_metadata;
CREATE TRIGGER update_platform_user_metadata_updated_at
    BEFORE UPDATE ON platform_user_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
