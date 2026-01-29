-- Create teams and super admin tables for collaborative features
-- This migration adds support for:
-- 1. Teams/Organizations for collaborative project management
-- 2. Super admin system for platform-wide administration
-- 3. Platform activity logging for audit trails

-- =============================================================================
-- TEAMS / ORGANIZATIONS
-- =============================================================================

-- Main teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    owner_id VARCHAR(255) NOT NULL,
    -- Stripe billing
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    billing_email VARCHAR(255),
    -- Subscription tier (optional, for team-based billing)
    tier_id UUID REFERENCES subscription_tiers(id),
    -- Flexible settings storage
    settings JSONB DEFAULT '{}',
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for teams
CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug);
CREATE INDEX IF NOT EXISTS idx_teams_deleted ON teams(deleted_at) WHERE deleted_at IS NULL;

-- =============================================================================
-- TEAM ROLES ENUM
-- =============================================================================

-- Create enum type for team roles (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_role') THEN
        CREATE TYPE team_role AS ENUM ('owner', 'admin', 'member', 'viewer');
    END IF;
END$$;

-- =============================================================================
-- TEAM MEMBERS
-- =============================================================================

-- Team membership junction table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    role team_role NOT NULL DEFAULT 'member',
    -- Custom permissions override (array of permission strings)
    custom_permissions JSONB DEFAULT '[]',
    -- Invitation tracking
    invited_by VARCHAR(255),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Prevent duplicate memberships
    UNIQUE(team_id, user_id)
);

-- Indexes for team members
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);

-- =============================================================================
-- TEAM INVITATIONS
-- =============================================================================

-- Pending invitations to join teams
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role team_role NOT NULL DEFAULT 'member',
    -- Unique token for invitation link
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    invited_by VARCHAR(255) NOT NULL,
    -- Status tracking
    accepted_at TIMESTAMP WITH TIME ZONE,
    declined_at TIMESTAMP WITH TIME ZONE,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Prevent duplicate invitations to same email for same team
    UNIQUE(team_id, email)
);

-- Indexes for invitations
CREATE INDEX IF NOT EXISTS idx_team_invitations_team ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_expires ON team_invitations(expires_at);

-- =============================================================================
-- TEAM SUBDOMAINS (SHARED RESOURCES)
-- =============================================================================

-- Subdomains shared with teams for collaborative editing
CREATE TABLE IF NOT EXISTS team_subdomains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    subdomain VARCHAR(100) NOT NULL,
    -- Access level: 'view', 'edit', 'admin'
    access_level VARCHAR(50) DEFAULT 'edit',
    -- Who shared this subdomain
    added_by VARCHAR(255),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Prevent duplicate subdomain shares to same team
    UNIQUE(team_id, subdomain)
);

-- Indexes for team subdomains
CREATE INDEX IF NOT EXISTS idx_team_subdomains_team ON team_subdomains(team_id);
CREATE INDEX IF NOT EXISTS idx_team_subdomains_subdomain ON team_subdomains(subdomain);

-- =============================================================================
-- SUPER ADMINS
-- =============================================================================

-- Platform super administrators with elevated privileges
CREATE TABLE IF NOT EXISTS super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    -- Who granted super admin status
    granted_by VARCHAR(255),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Soft revocation
    revoked_at TIMESTAMP WITH TIME ZONE,
    -- Granular permissions (array, ["*"] means all permissions)
    permissions JSONB DEFAULT '["*"]'
);

-- Indexes for super admins
CREATE INDEX IF NOT EXISTS idx_super_admins_user ON super_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_super_admins_email ON super_admins(email);
CREATE INDEX IF NOT EXISTS idx_super_admins_active ON super_admins(revoked_at) WHERE revoked_at IS NULL;

-- =============================================================================
-- PLATFORM ACTIVITY LOG
-- =============================================================================

-- Audit log for all platform-level actions
CREATE TABLE IF NOT EXISTS platform_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Actor information
    actor_id VARCHAR(255),
    actor_email VARCHAR(255),
    -- Action details
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(255),
    -- Additional context as JSON
    details JSONB DEFAULT '{}',
    -- Request metadata
    ip_address VARCHAR(50),
    user_agent TEXT,
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for activity log
CREATE INDEX IF NOT EXISTS idx_activity_log_actor ON platform_activity_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON platform_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_target ON platform_activity_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON platform_activity_log(created_at DESC);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for teams table
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SEED INITIAL SUPER ADMIN (Optional - uncomment and modify as needed)
-- =============================================================================

-- To add yourself as the initial super admin, uncomment and run:
-- INSERT INTO super_admins (user_id, email, granted_by, permissions)
-- VALUES ('your-user-id-here', 'your-email@example.com', 'system', '["*"]')
-- ON CONFLICT (user_id) DO NOTHING;
