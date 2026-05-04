-- Phase 2 RLS coverage for tenant-scoped models that 001_enable_rls.sql missed.
--
-- These tables are listed in TENANT_SCOPED_MODELS in lib/cms/db/tenant-context.ts
-- and have a tenant_id column, but were not enabled for Postgres RLS — leaving
-- only the application-level Prisma middleware as the isolation boundary.
-- Per the platform's defense-in-depth design, every tenant-scoped table should
-- carry both layers.
--
-- Tables in this migration are either currently empty (PII-grade tables that
-- never got data) or contain rows with non-NULL tenant_id (existing rows
-- already pass the new policy). Tables that contain NULL-tenant rows by
-- design (roles, role_assignments, partials — platform-level shared
-- defaults) are intentionally omitted; their policy needs explicit
-- "OR tenant_id IS NULL" semantics that should be a separate, audited
-- decision.
--
-- Pattern mirrors 001_enable_rls.sql: ENABLE + FORCE row level security,
-- DROP IF EXISTS to keep idempotent, then create the canonical pair of
-- policies (read/update/delete via ALL, insert separately).

BEGIN;

-- ============================================================================
-- Email marketing
-- ============================================================================

ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_email_subscribers ON email_subscribers;
CREATE POLICY tenant_isolation_email_subscribers ON email_subscribers
  USING (is_super_admin() OR tenant_id = current_tenant_id());
DROP POLICY IF EXISTS tenant_insert_email_subscribers ON email_subscribers;
CREATE POLICY tenant_insert_email_subscribers ON email_subscribers
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_email_campaigns ON email_campaigns;
CREATE POLICY tenant_isolation_email_campaigns ON email_campaigns
  USING (is_super_admin() OR tenant_id = current_tenant_id());
DROP POLICY IF EXISTS tenant_insert_email_campaigns ON email_campaigns;
CREATE POLICY tenant_insert_email_campaigns ON email_campaigns
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_email_templates ON email_templates;
CREATE POLICY tenant_isolation_email_templates ON email_templates
  USING (is_super_admin() OR tenant_id = current_tenant_id());
DROP POLICY IF EXISTS tenant_insert_email_templates ON email_templates;
CREATE POLICY tenant_insert_email_templates ON email_templates
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- ============================================================================
-- Forms (PII: form_submissions stores user-submitted data)
-- ============================================================================

ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_forms ON forms;
CREATE POLICY tenant_isolation_forms ON forms
  USING (is_super_admin() OR tenant_id = current_tenant_id());
DROP POLICY IF EXISTS tenant_insert_forms ON forms;
CREATE POLICY tenant_insert_forms ON forms
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_form_submissions ON form_submissions;
CREATE POLICY tenant_isolation_form_submissions ON form_submissions
  USING (is_super_admin() OR tenant_id = current_tenant_id());
DROP POLICY IF EXISTS tenant_insert_form_submissions ON form_submissions;
CREATE POLICY tenant_insert_form_submissions ON form_submissions
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- ============================================================================
-- Events + registrations (PII: registrants are real people)
-- ============================================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_events ON events;
CREATE POLICY tenant_isolation_events ON events
  USING (is_super_admin() OR tenant_id = current_tenant_id());
DROP POLICY IF EXISTS tenant_insert_events ON events;
CREATE POLICY tenant_insert_events ON events
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_event_registrations ON event_registrations;
CREATE POLICY tenant_isolation_event_registrations ON event_registrations
  USING (is_super_admin() OR tenant_id = current_tenant_id());
DROP POLICY IF EXISTS tenant_insert_event_registrations ON event_registrations;
CREATE POLICY tenant_insert_event_registrations ON event_registrations
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

ALTER TABLE event_ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_ticket_types FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_event_ticket_types ON event_ticket_types;
CREATE POLICY tenant_isolation_event_ticket_types ON event_ticket_types
  USING (is_super_admin() OR tenant_id = current_tenant_id());
DROP POLICY IF EXISTS tenant_insert_event_ticket_types ON event_ticket_types;
CREATE POLICY tenant_insert_event_ticket_types ON event_ticket_types
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

ALTER TABLE event_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_speakers FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_event_speakers ON event_speakers;
CREATE POLICY tenant_isolation_event_speakers ON event_speakers
  USING (is_super_admin() OR tenant_id = current_tenant_id());
DROP POLICY IF EXISTS tenant_insert_event_speakers ON event_speakers;
CREATE POLICY tenant_insert_event_speakers ON event_speakers
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

ALTER TABLE event_schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_schedule_items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_event_schedule_items ON event_schedule_items;
CREATE POLICY tenant_isolation_event_schedule_items ON event_schedule_items
  USING (is_super_admin() OR tenant_id = current_tenant_id());
DROP POLICY IF EXISTS tenant_insert_event_schedule_items ON event_schedule_items;
CREATE POLICY tenant_insert_event_schedule_items ON event_schedule_items
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- ============================================================================
-- Financial / commerce
-- ============================================================================

ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_gift_cards ON gift_cards;
CREATE POLICY tenant_isolation_gift_cards ON gift_cards
  USING (is_super_admin() OR tenant_id = current_tenant_id());
DROP POLICY IF EXISTS tenant_insert_gift_cards ON gift_cards;
CREATE POLICY tenant_insert_gift_cards ON gift_cards
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_gift_card_transactions ON gift_card_transactions;
CREATE POLICY tenant_isolation_gift_card_transactions ON gift_card_transactions
  USING (is_super_admin() OR tenant_id = current_tenant_id());
DROP POLICY IF EXISTS tenant_insert_gift_card_transactions ON gift_card_transactions;
CREATE POLICY tenant_insert_gift_card_transactions ON gift_card_transactions
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

-- ============================================================================
-- Other tenant-scoped models
-- ============================================================================

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_site_settings ON site_settings;
CREATE POLICY tenant_isolation_site_settings ON site_settings
  USING (is_super_admin() OR tenant_id = current_tenant_id());
DROP POLICY IF EXISTS tenant_insert_site_settings ON site_settings;
CREATE POLICY tenant_insert_site_settings ON site_settings
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_review_votes ON review_votes;
CREATE POLICY tenant_isolation_review_votes ON review_votes
  USING (is_super_admin() OR tenant_id = current_tenant_id());
DROP POLICY IF EXISTS tenant_insert_review_votes ON review_votes;
CREATE POLICY tenant_insert_review_votes ON review_votes
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

ALTER TABLE media_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_tags FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_media_tags ON media_tags;
CREATE POLICY tenant_isolation_media_tags ON media_tags
  USING (is_super_admin() OR tenant_id = current_tenant_id());
DROP POLICY IF EXISTS tenant_insert_media_tags ON media_tags;
CREATE POLICY tenant_insert_media_tags ON media_tags
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_notifications ON notifications;
CREATE POLICY tenant_isolation_notifications ON notifications
  USING (is_super_admin() OR tenant_id = current_tenant_id());
DROP POLICY IF EXISTS tenant_insert_notifications ON notifications;
CREATE POLICY tenant_insert_notifications ON notifications
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_user_permissions ON user_permissions;
CREATE POLICY tenant_isolation_user_permissions ON user_permissions
  USING (is_super_admin() OR tenant_id = current_tenant_id());
DROP POLICY IF EXISTS tenant_insert_user_permissions ON user_permissions;
CREATE POLICY tenant_insert_user_permissions ON user_permissions
  FOR INSERT WITH CHECK (is_super_admin() OR tenant_id = current_tenant_id());

COMMIT;
