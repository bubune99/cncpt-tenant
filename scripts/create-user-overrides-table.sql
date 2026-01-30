-- User Overrides Table
-- Allows super admins to grant special permissions to users
-- such as unlimited subdomains, free AI credits, payment bypass

CREATE TABLE IF NOT EXISTS user_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The user receiving the override
  user_id VARCHAR(255) NOT NULL,
  user_email VARCHAR(255),

  -- Override flags
  unlimited_subdomains BOOLEAN DEFAULT false,
  unlimited_ai_credits BOOLEAN DEFAULT false,
  bypass_payment BOOLEAN DEFAULT false,

  -- Specific limits override (NULL means use tier default)
  subdomain_limit_override INTEGER,  -- Specific limit, -1 for unlimited
  monthly_credit_allocation INTEGER, -- Extra monthly credits to allocate

  -- Audit trail
  granted_by_user_id VARCHAR(255) NOT NULL,
  granted_by_email VARCHAR(255),
  grant_reason TEXT,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Expiration (NULL = never expires)
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Soft delete / revocation
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by_user_id VARCHAR(255),
  revoke_reason TEXT,

  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_overrides_user_id ON user_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_user_overrides_active ON user_overrides(user_id)
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_overrides_granted_by ON user_overrides(granted_by_user_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_overrides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_user_overrides_updated_at ON user_overrides;
CREATE TRIGGER trigger_user_overrides_updated_at
  BEFORE UPDATE ON user_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_user_overrides_updated_at();

-- Credit grants table for one-time credit allocations
CREATE TABLE IF NOT EXISTS credit_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The user receiving credits
  user_id VARCHAR(255) NOT NULL,
  user_email VARCHAR(255),

  -- Credit details
  credits_amount INTEGER NOT NULL,
  credit_type VARCHAR(20) DEFAULT 'purchased', -- 'monthly' or 'purchased' (purchased never expires)

  -- Audit trail
  granted_by_user_id VARCHAR(255) NOT NULL,
  granted_by_email VARCHAR(255),
  grant_reason TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'applied', 'failed'
  applied_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,

  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for credit grants
CREATE INDEX IF NOT EXISTS idx_credit_grants_user_id ON credit_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_grants_status ON credit_grants(status);
CREATE INDEX IF NOT EXISTS idx_credit_grants_pending ON credit_grants(user_id) WHERE status = 'pending';
