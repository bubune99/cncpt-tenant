-- Support Tickets System Tables
-- In-house CRM for managing customer inquiries and support

-- Support Tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- The customer who created the ticket
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  category TEXT NOT NULL DEFAULT 'General',
  assigned_to TEXT,  -- Support agent user_id
  subdomain TEXT,  -- Optional: which subdomain this relates to
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- Indexes for support_tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_updated_at ON support_tickets(updated_at DESC);

-- Support Messages table (conversation history)
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,  -- User ID of sender
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'support', 'system')),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',  -- Array of attachment URLs/metadata
  is_internal BOOLEAN DEFAULT FALSE,  -- Internal notes not visible to customer
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for support_messages
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender_id ON support_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at);

-- Support Tags for categorization
CREATE TABLE IF NOT EXISTS support_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6B7280',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ticket-Tag junction table
CREATE TABLE IF NOT EXISTS support_ticket_tags (
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES support_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (ticket_id, tag_id)
);

-- Canned Responses for quick replies
CREATE TABLE IF NOT EXISTS support_canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  shortcut TEXT,  -- Quick trigger like /greeting
  created_by TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer notes (CRM feature)
CREATE TABLE IF NOT EXISTS customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,  -- The user being noted about
  author_id TEXT NOT NULL,  -- Who wrote the note
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON customer_notes(customer_id);

-- Insert default tags
INSERT INTO support_tags (name, color, description) VALUES
  ('bug', '#EF4444', 'Bug reports and issues'),
  ('feature', '#3B82F6', 'Feature requests'),
  ('billing', '#10B981', 'Billing and payment questions'),
  ('urgent', '#F59E0B', 'Requires immediate attention'),
  ('documentation', '#8B5CF6', 'Documentation improvements')
ON CONFLICT (name) DO NOTHING;

-- Insert default canned responses
INSERT INTO support_canned_responses (title, content, category, shortcut) VALUES
  ('Greeting', 'Hello! Thank you for reaching out to our support team. How can I help you today?', 'General', '/greeting'),
  ('Closing - Resolved', 'I''m glad I could help resolve your issue. If you have any other questions, please don''t hesitate to reach out. Have a great day!', 'Closing', '/resolved'),
  ('Need More Info', 'Thank you for your message. To better assist you, could you please provide the following additional information:\n\n1. Your subdomain URL\n2. Steps to reproduce the issue\n3. Any error messages you''re seeing', 'Information', '/moreinfo'),
  ('Escalation', 'I''ve escalated your ticket to our senior support team. They will review your case and get back to you within 24 hours.', 'Escalation', '/escalate')
ON CONFLICT DO NOTHING;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_support_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS support_tickets_updated_at ON support_tickets;
CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_ticket_timestamp();

-- View for ticket summary with customer info
CREATE OR REPLACE VIEW support_ticket_summary AS
SELECT
  t.id,
  t.title,
  t.status,
  t.priority,
  t.category,
  t.created_at,
  t.updated_at,
  t.user_id as customer_id,
  u.display_name as customer_name,
  u.primary_email as customer_email,
  t.assigned_to,
  a.display_name as assigned_name,
  (SELECT COUNT(*) FROM support_messages WHERE ticket_id = t.id) as message_count,
  (SELECT MAX(created_at) FROM support_messages WHERE ticket_id = t.id) as last_message_at
FROM support_tickets t
LEFT JOIN users u ON t.user_id = u.id
LEFT JOIN users a ON t.assigned_to = a.id;

COMMENT ON TABLE support_tickets IS 'Support tickets for customer inquiries - in-house CRM';
COMMENT ON TABLE support_messages IS 'Conversation history for support tickets';
COMMENT ON TABLE customer_notes IS 'Internal notes about customers for CRM purposes';
