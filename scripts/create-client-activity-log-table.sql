-- Create client_activity_log table for audit trail
-- Tracks all admin actions performed on clients

CREATE TABLE IF NOT EXISTS client_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Reference to the client
    client_id UUID NOT NULL REFERENCES platform_clients(id) ON DELETE CASCADE,
    -- Action performed
    action VARCHAR(100) NOT NULL,
    -- Common actions: 'created', 'approved', 'status_changed', 'tier_changed',
    -- 'trial_extended', 'suspended', 'reactivated', 'cancelled', 'note_added',
    -- 'subdomain_assigned', 'cms_provisioned'

    -- Who performed the action (admin user_id)
    performed_by TEXT NOT NULL,
    performed_by_email VARCHAR(255),

    -- Before and after state (for auditing)
    previous_value JSONB,
    new_value JSONB,

    -- Additional context
    notes TEXT,

    -- Request metadata
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_activity_client ON client_activity_log(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_action ON client_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_performed_by ON client_activity_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_activity_date ON client_activity_log(created_at DESC);

-- Composite index for client timeline queries
CREATE INDEX IF NOT EXISTS idx_activity_client_timeline
    ON client_activity_log(client_id, created_at DESC);
