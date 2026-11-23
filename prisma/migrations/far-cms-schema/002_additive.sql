-- CNCPT takes the far-cms schema (card 10, c645e053, step 2): additive only.
-- Generated from: far-cms packages/db fragments merged with --site (CNCPT's Subdomain), --app (CNCPT-only models and its
-- User, ApiKey, ApiKeyUsage) and --extend (CNCPT's fields and constraints on shared models), diffed against the CNCPT
-- staging branch. Kept: new tables, new columns (each nullable or with a default), new indexes and uniques, foreign keys,
-- two enum values. Left out: CNCPT's existing drift (also in a diff of its own schema), and the 21 changes that need the
-- mount (global uniques becoming per site, 4 column alterations), which come with step 3.
BEGIN;

CREATE TYPE "EmailSuppressionReason" AS ENUM ('UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED', 'MANUAL');

CREATE TYPE "PuckTemplateType" AS ENUM ('SECTION', 'PAGE');

CREATE TYPE "TourStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TYPE "TourVisibility" AS ENUM ('TENANT', 'PUBLIC', 'DRAFT');

CREATE TYPE "TourRunStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

CREATE TABLE "api_key_class_usage" (
    "tenant_id" INTEGER,
    "apiKeyId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "costClass" TEXT NOT NULL,
    "calls" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_key_class_usage_pkey" PRIMARY KEY ("apiKeyId","day","costClass")
);

CREATE TABLE "page_revisions" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "pageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "PageStatus" NOT NULL,
    "content" JSONB,
    "reason" TEXT NOT NULL,
    "meta" JSONB,
    "createdById" TEXT,
    "createdByEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_suppressions" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "emailHash" TEXT NOT NULL,
    "reason" "EmailSuppressionReason" NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_suppressions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "form_rule_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "formId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "ruleId" TEXT,
    "ruleName" TEXT,
    "actionType" TEXT NOT NULL,
    "actionKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "detail" TEXT,
    "source" TEXT NOT NULL DEFAULT 'auto',
    "jobId" TEXT,
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_rule_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "form_rate_limits" (
    "key" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "formId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "form_rate_limits_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "form_bulk_jobs" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "formId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "spec" JSONB NOT NULL,
    "total" INTEGER NOT NULL,
    "cursor" INTEGER NOT NULL DEFAULT 0,
    "ran" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'running',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_bulk_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tours" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "steps" JSONB NOT NULL,
    "status" "TourStatus" NOT NULL DEFAULT 'DRAFT',
    "authorId" TEXT,
    "visibility" "TourVisibility" NOT NULL DEFAULT 'TENANT',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tours_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tour_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "tourId" TEXT NOT NULL,
    "userId" TEXT,
    "status" "TourRunStatus" NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "abandonedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "tour_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ade_change_sets" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "workspaceId" TEXT NOT NULL DEFAULT 'default',
    "ownerId" TEXT,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rationale" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ade_change_sets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ade_change_set_items" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "changeSetId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "operation" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "blockIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rationale" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "resultId" TEXT,
    "revisionId" TEXT,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ade_change_set_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ade_change_comments" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "changeSetId" TEXT NOT NULL,
    "itemId" TEXT,
    "authorId" TEXT,
    "authorEmail" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'comment',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ade_change_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ade_tasks" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "workspaceId" TEXT NOT NULL DEFAULT 'default',
    "userId" TEXT,
    "permission" TEXT,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "href" TEXT,
    "targetType" TEXT,
    "targetId" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'open',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ade_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ade_coverage" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "route" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "units" INTEGER NOT NULL DEFAULT 0,
    "toolGaps" INTEGER NOT NULL DEFAULT 0,
    "uiGaps" INTEGER NOT NULL DEFAULT 0,
    "hidden" INTEGER NOT NULL DEFAULT 0,
    "runBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ade_coverage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ade_user_prefs" (
    "userId" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "splitRatio" DOUBLE PRECISION,
    "prefs" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ade_user_prefs_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "ade_records" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "workspaceId" TEXT NOT NULL DEFAULT 'default',
    "type" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "data" JSONB NOT NULL,
    "pageId" TEXT,
    "legacyRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ade_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ade_edit_locks" (
    "targetKey" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "tabId" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "heartbeatAt" TIMESTAMP(3) NOT NULL,
    "requestedById" TEXT,
    "requestedByName" TEXT,
    "requestedAt" TIMESTAMP(3),

    CONSTRAINT "ade_edit_locks_pkey" PRIMARY KEY ("targetKey")
);

CREATE TABLE "agent_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "conversationId" TEXT,
    "messageId" TEXT,
    "userId" TEXT,
    "area" TEXT,
    "route" TEXT,
    "request" TEXT,
    "model" TEXT,
    "effort" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "tainted" BOOLEAN NOT NULL DEFAULT false,
    "taintedBy" TEXT,
    "steps" INTEGER NOT NULL DEFAULT 0,
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "cacheRead" INTEGER NOT NULL DEFAULT 0,
    "cacheWrite" INTEGER NOT NULL DEFAULT 0,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "costEstimate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "toolGroupsLoaded" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "droppedSpans" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_spans" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "runId" TEXT NOT NULL,
    "parentId" TEXT,
    "seq" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startMs" INTEGER NOT NULL,
    "endMs" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "detail" TEXT,
    "effect" TEXT,
    "tainted" BOOLEAN NOT NULL DEFAULT false,
    "changeSetId" TEXT,
    "auditLogId" TEXT,
    "inputRedacted" JSONB,
    "outputSummary" TEXT,
    "callId" TEXT,

    CONSTRAINT "agent_spans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ade_waits" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "userId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "conversationId" TEXT,
    "callId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "step" JSONB,
    "tokenHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "action" TEXT,
    "output" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ackedAt" TIMESTAMP(3),

    CONSTRAINT "ade_waits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ade_revisions" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "changed" TEXT[],
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "actorKind" TEXT NOT NULL,
    "actorUserId" TEXT,
    "runId" TEXT,
    "changeSetId" TEXT,
    "reason" TEXT,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ade_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ade_handoffs" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "device" TEXT NOT NULL DEFAULT 'phone',
    "changeSetId" TEXT,
    "conversationId" TEXT,
    "href" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "clientKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ade_handoffs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "connector_accounts" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'personal',
    "accountEnc" TEXT,
    "grantedScopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "accessTokenEnc" TEXT NOT NULL,
    "refreshTokenEnc" TEXT,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connector_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "client_feedback" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "createdById" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "screen" TEXT NOT NULL DEFAULT '',
    "senderName" TEXT NOT NULL DEFAULT '',
    "dedupeKey" TEXT,
    "unitRef" TEXT,
    "note" TEXT NOT NULL,
    "screenshotMediaId" TEXT,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "forwardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_feedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "feedback_deliveries" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "feedbackId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "externalId" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "feedback_digests" (
    "day" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "count" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_digests_pkey" PRIMARY KEY ("day")
);

CREATE TABLE "feedback_screenshots" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER,
    "createdById" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "bytes" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_screenshots_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "addresses" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "admin_users" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "ai_conversations" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "ai_documents" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "ai_messages" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "ai_streams" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "ai_suggestions" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "ai_votes" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "analytics_events" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "audit_logs" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "blog_categories" ADD COLUMN     "canonicalUrl" TEXT;

ALTER TABLE "blog_categories" ADD COLUMN     "noIndex" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "blog_categories" ADD COLUMN     "ogDescription" TEXT;

ALTER TABLE "blog_categories" ADD COLUMN     "ogTitle" TEXT;

ALTER TABLE "blog_comments" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "blog_post_categories" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "blog_post_tags" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "blog_posts" ADD COLUMN     "homeOrder" INTEGER;

ALTER TABLE "blog_tags" ADD COLUMN     "metaDescription" TEXT;

ALTER TABLE "blog_tags" ADD COLUMN     "metaTitle" TEXT;

ALTER TABLE "bundle_assets" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "canva_connections" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "cart_items" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "categories" ADD COLUMN     "metaDescription" TEXT;

ALTER TABLE "categories" ADD COLUMN     "metaTitle" TEXT;

ALTER TABLE "cms_modules" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "custom_animations" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "custom_components" ADD COLUMN "puckConfig" JSONB;

-- CNCPT keeps the same data as "editorConfig"; copy it so the column can be required
UPDATE "custom_components" SET "puckConfig" = "editorConfig" WHERE "puckConfig" IS NULL;

ALTER TABLE "custom_components" ALTER COLUMN "puckConfig" SET NOT NULL;

ALTER TABLE "custom_components" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "customer_addresses" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "digital_downloads" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "discount_usages" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "email_ab_tests" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "email_automation_enrollment_steps" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "email_automation_enrollments" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "email_automation_steps" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "email_automations" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "email_campaigns" ADD COLUMN     "audience" JSONB;

ALTER TABLE "email_campaigns" ADD COLUMN     "audienceDoneAt" TIMESTAMP(3);

ALTER TABLE "email_campaigns" ADD COLUMN     "failedCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "email_campaigns" ADD COLUMN     "lastError" TEXT;

ALTER TABLE "email_campaigns" ADD COLUMN     "sendCursor" TEXT;

ALTER TABLE "email_campaigns" ADD COLUMN     "sendStartedById" TEXT;

ALTER TABLE "email_campaigns" ADD COLUMN     "testSentAt" TIMESTAMP(3);

ALTER TABLE "email_link_clicks" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "email_links" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "email_queue_items" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "email_recipients" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "email_recipients" ADD COLUMN     "claimedAt" TIMESTAMP(3);

ALTER TABLE "email_recipients" ADD COLUMN     "nextAttemptAt" TIMESTAMP(3);

ALTER TABLE "email_recipients" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "email_segment_members" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "email_segments" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "form_submissions" ADD COLUMN     "notes" TEXT;

ALTER TABLE "form_submissions" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'new';

ALTER TABLE "form_submissions" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "forms" ADD COLUMN     "automations" JSONB;

ALTER TABLE "forms" ADD COLUMN     "captchaEnabled" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "forms" ADD COLUMN     "display" JSONB;

ALTER TABLE "forms" ADD COLUMN     "retentionMonths" INTEGER;

ALTER TABLE "help_content" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "help_tours" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "license_keys" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "mcp_servers" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "media" ADD COLUMN     "canvaDesignId" TEXT;

ALTER TABLE "media_tags_on_media" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "media_usage" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "order_items" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "order_progress" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "order_workflow_stages" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "page_bundles" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "pages" ADD COLUMN     "canonicalUrl" TEXT;

ALTER TABLE "pages" ADD COLUMN     "noIndex" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "pages" ADD COLUMN     "ogDescription" TEXT;

ALTER TABLE "pages" ADD COLUMN     "ogImageId" TEXT;

ALTER TABLE "pages" ADD COLUMN     "ogTitle" TEXT;

ALTER TABLE "pages" ADD COLUMN     "scheduledAt" TIMESTAMP(3);

ALTER TABLE "payments" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "platform_activity_log" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "plugins" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "primitive_executions" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "primitives" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "product_categories" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "product_custom_fields" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "product_images" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "product_option_values" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "product_options" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "product_variant_option_values" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "product_variants" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "products" ADD COLUMN     "canonicalUrl" TEXT;

ALTER TABLE "products" ADD COLUMN     "noIndex" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "products" ADD COLUMN     "ogDescription" TEXT;

ALTER TABLE "products" ADD COLUMN     "ogImageId" TEXT;

ALTER TABLE "products" ADD COLUMN     "ogTitle" TEXT;

ALTER TABLE "puck_templates" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "shipments" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "subscription_tiers" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "subscriptions" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "super_admins" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "team_invitations" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "team_members" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "team_subdomains" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "teams" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "usage_counters" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "variant_custom_field_values" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "wishlist_items" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "workflow_executions" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "workflow_logs" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "workflow_nodes" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "workflow_steps" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "workflow_templates" ADD COLUMN     "tenant_id" INTEGER;

ALTER TABLE "workflows" ADD COLUMN     "tenant_id" INTEGER;

CREATE INDEX "api_key_class_usage_day_idx" ON "api_key_class_usage"("day");

CREATE INDEX "api_key_class_usage_tenant_id_idx" ON "api_key_class_usage"("tenant_id");

CREATE INDEX "page_revisions_pageId_createdAt_idx" ON "page_revisions"("pageId", "createdAt");

CREATE INDEX "page_revisions_tenant_id_idx" ON "page_revisions"("tenant_id");

CREATE UNIQUE INDEX "email_suppressions_emailHash_key" ON "email_suppressions"("emailHash");

CREATE INDEX "email_suppressions_tenant_id_idx" ON "email_suppressions"("tenant_id");

CREATE UNIQUE INDEX "form_rule_runs_dedupeKey_key" ON "form_rule_runs"("dedupeKey");

CREATE INDEX "form_rule_runs_submissionId_createdAt_idx" ON "form_rule_runs"("submissionId", "createdAt");

CREATE INDEX "form_rule_runs_formId_ruleId_idx" ON "form_rule_runs"("formId", "ruleId");

CREATE INDEX "form_rule_runs_jobId_idx" ON "form_rule_runs"("jobId");

CREATE INDEX "form_rule_runs_tenant_id_idx" ON "form_rule_runs"("tenant_id");

CREATE INDEX "form_rate_limits_windowStart_idx" ON "form_rate_limits"("windowStart");

CREATE INDEX "form_rate_limits_tenant_id_idx" ON "form_rate_limits"("tenant_id");

CREATE INDEX "form_bulk_jobs_formId_createdAt_idx" ON "form_bulk_jobs"("formId", "createdAt");

CREATE INDEX "form_bulk_jobs_tenant_id_idx" ON "form_bulk_jobs"("tenant_id");

CREATE INDEX "tours_slug_idx" ON "tours"("slug");

CREATE INDEX "tours_status_visibility_idx" ON "tours"("status", "visibility");

CREATE INDEX "tours_tenant_id_idx" ON "tours"("tenant_id");

CREATE UNIQUE INDEX "tours_tenant_id_slug_key" ON "tours"("tenant_id", "slug");

CREATE INDEX "tour_runs_tourId_status_idx" ON "tour_runs"("tourId", "status");

CREATE INDEX "tour_runs_userId_idx" ON "tour_runs"("userId");

CREATE INDEX "tour_runs_tenant_id_idx" ON "tour_runs"("tenant_id");

CREATE INDEX "ade_change_sets_workspaceId_status_createdAt_idx" ON "ade_change_sets"("workspaceId", "status", "createdAt");

CREATE INDEX "ade_change_sets_ownerId_idx" ON "ade_change_sets"("ownerId");

CREATE INDEX "ade_change_sets_tenant_id_idx" ON "ade_change_sets"("tenant_id");

CREATE INDEX "ade_change_set_items_changeSetId_idx" ON "ade_change_set_items"("changeSetId");

CREATE INDEX "ade_change_set_items_status_category_idx" ON "ade_change_set_items"("status", "category");

CREATE INDEX "ade_change_set_items_targetType_targetId_idx" ON "ade_change_set_items"("targetType", "targetId");

CREATE INDEX "ade_change_set_items_revisionId_idx" ON "ade_change_set_items"("revisionId");

CREATE INDEX "ade_change_set_items_tenant_id_idx" ON "ade_change_set_items"("tenant_id");

CREATE INDEX "ade_change_comments_changeSetId_createdAt_idx" ON "ade_change_comments"("changeSetId", "createdAt");

CREATE INDEX "ade_change_comments_tenant_id_idx" ON "ade_change_comments"("tenant_id");

CREATE UNIQUE INDEX "ade_tasks_dedupeKey_key" ON "ade_tasks"("dedupeKey");

CREATE INDEX "ade_tasks_workspaceId_status_priority_idx" ON "ade_tasks"("workspaceId", "status", "priority");

CREATE INDEX "ade_tasks_userId_status_idx" ON "ade_tasks"("userId", "status");

CREATE INDEX "ade_tasks_tenant_id_idx" ON "ade_tasks"("tenant_id");

CREATE UNIQUE INDEX "ade_coverage_route_key" ON "ade_coverage"("route");

CREATE INDEX "ade_coverage_tenant_id_idx" ON "ade_coverage"("tenant_id");

CREATE INDEX "ade_user_prefs_tenant_id_idx" ON "ade_user_prefs"("tenant_id");

CREATE INDEX "ade_records_type_status_idx" ON "ade_records"("type", "status");

CREATE INDEX "ade_records_scheduledAt_idx" ON "ade_records"("scheduledAt");

CREATE INDEX "ade_records_pageId_idx" ON "ade_records"("pageId");

CREATE INDEX "ade_records_legacyRef_idx" ON "ade_records"("legacyRef");

CREATE INDEX "ade_records_tenant_id_idx" ON "ade_records"("tenant_id");

CREATE UNIQUE INDEX "ade_records_tenant_id_workspaceId_type_slug_key" ON "ade_records"("tenant_id", "workspaceId", "type", "slug");

CREATE INDEX "ade_edit_locks_userId_idx" ON "ade_edit_locks"("userId");

CREATE INDEX "ade_edit_locks_tenant_id_idx" ON "ade_edit_locks"("tenant_id");

CREATE INDEX "agent_runs_userId_startedAt_idx" ON "agent_runs"("userId", "startedAt");

CREATE INDEX "agent_runs_status_startedAt_idx" ON "agent_runs"("status", "startedAt");

CREATE INDEX "agent_runs_startedAt_idx" ON "agent_runs"("startedAt");

CREATE INDEX "agent_runs_conversationId_idx" ON "agent_runs"("conversationId");

CREATE INDEX "agent_runs_tenant_id_idx" ON "agent_runs"("tenant_id");

CREATE INDEX "agent_spans_runId_idx" ON "agent_spans"("runId");

CREATE INDEX "agent_spans_callId_idx" ON "agent_spans"("callId");

CREATE INDEX "agent_spans_tenant_id_idx" ON "agent_spans"("tenant_id");

CREATE UNIQUE INDEX "ade_waits_tokenHash_key" ON "ade_waits"("tokenHash");

CREATE INDEX "ade_waits_userId_status_idx" ON "ade_waits"("userId", "status");

CREATE INDEX "ade_waits_userId_callId_idx" ON "ade_waits"("userId", "callId");

CREATE INDEX "ade_waits_conversationId_idx" ON "ade_waits"("conversationId");

CREATE INDEX "ade_waits_createdAt_idx" ON "ade_waits"("createdAt");

CREATE INDEX "ade_waits_tenant_id_idx" ON "ade_waits"("tenant_id");

CREATE INDEX "ade_revisions_entityType_entityId_createdAt_idx" ON "ade_revisions"("entityType", "entityId", "createdAt");

CREATE INDEX "ade_revisions_actorUserId_createdAt_idx" ON "ade_revisions"("actorUserId", "createdAt");

CREATE INDEX "ade_revisions_createdAt_idx" ON "ade_revisions"("createdAt");

CREATE INDEX "ade_revisions_tenant_id_idx" ON "ade_revisions"("tenant_id");

CREATE UNIQUE INDEX "ade_revisions_entityType_entityId_version_key" ON "ade_revisions"("entityType", "entityId", "version");

CREATE INDEX "ade_handoffs_userId_status_createdAt_idx" ON "ade_handoffs"("userId", "status", "createdAt");

CREATE INDEX "ade_handoffs_changeSetId_idx" ON "ade_handoffs"("changeSetId");

CREATE INDEX "ade_handoffs_tenant_id_idx" ON "ade_handoffs"("tenant_id");

CREATE UNIQUE INDEX "ade_handoffs_userId_clientKey_key" ON "ade_handoffs"("userId", "clientKey");

CREATE INDEX "connector_accounts_userId_idx" ON "connector_accounts"("userId");

CREATE INDEX "connector_accounts_tenant_id_idx" ON "connector_accounts"("tenant_id");

CREATE UNIQUE INDEX "connector_accounts_userId_provider_scope_key" ON "connector_accounts"("userId", "provider", "scope");

CREATE UNIQUE INDEX "client_feedback_dedupeKey_key" ON "client_feedback"("dedupeKey");

CREATE INDEX "client_feedback_status_createdAt_idx" ON "client_feedback"("status", "createdAt");

CREATE INDEX "client_feedback_createdById_idx" ON "client_feedback"("createdById");

CREATE INDEX "client_feedback_tenant_id_idx" ON "client_feedback"("tenant_id");

CREATE INDEX "feedback_deliveries_status_nextAttemptAt_idx" ON "feedback_deliveries"("status", "nextAttemptAt");

CREATE INDEX "feedback_deliveries_tenant_id_idx" ON "feedback_deliveries"("tenant_id");

CREATE UNIQUE INDEX "feedback_deliveries_feedbackId_channel_key" ON "feedback_deliveries"("feedbackId", "channel");

CREATE INDEX "feedback_digests_tenant_id_idx" ON "feedback_digests"("tenant_id");

CREATE INDEX "feedback_screenshots_createdById_idx" ON "feedback_screenshots"("createdById");

CREATE INDEX "feedback_screenshots_tenant_id_idx" ON "feedback_screenshots"("tenant_id");

CREATE INDEX "addresses_tenant_id_idx" ON "addresses"("tenant_id");

CREATE INDEX "admin_users_tenant_id_idx" ON "admin_users"("tenant_id");

CREATE INDEX "ai_conversations_tenant_id_idx" ON "ai_conversations"("tenant_id");

CREATE INDEX "ai_documents_tenant_id_idx" ON "ai_documents"("tenant_id");

CREATE INDEX "ai_messages_tenant_id_idx" ON "ai_messages"("tenant_id");

CREATE INDEX "ai_streams_tenant_id_idx" ON "ai_streams"("tenant_id");

CREATE INDEX "ai_suggestions_tenant_id_idx" ON "ai_suggestions"("tenant_id");

CREATE INDEX "ai_votes_tenant_id_idx" ON "ai_votes"("tenant_id");

CREATE INDEX "analytics_events_tenant_id_idx" ON "analytics_events"("tenant_id");

CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs"("tenant_id");

CREATE UNIQUE INDEX "back_in_stock_subscriptions_tenant_id_email_productId_varia_key" ON "back_in_stock_subscriptions"("tenant_id", "email", "productId", "variantId");

CREATE INDEX "blog_comments_tenant_id_idx" ON "blog_comments"("tenant_id");

CREATE INDEX "blog_post_categories_tenant_id_idx" ON "blog_post_categories"("tenant_id");

CREATE INDEX "blog_post_tags_tenant_id_idx" ON "blog_post_tags"("tenant_id");

CREATE INDEX "blog_posts_homeOrder_idx" ON "blog_posts"("homeOrder");

CREATE INDEX "bundle_assets_tenant_id_idx" ON "bundle_assets"("tenant_id");

CREATE INDEX "canva_connections_tenant_id_idx" ON "canva_connections"("tenant_id");

CREATE INDEX "cart_items_tenant_id_idx" ON "cart_items"("tenant_id");

CREATE INDEX "cms_modules_tenant_id_idx" ON "cms_modules"("tenant_id");

CREATE UNIQUE INDEX "cms_modules_tenant_id_slug_key" ON "cms_modules"("tenant_id", "slug");

CREATE INDEX "custom_animations_tenant_id_idx" ON "custom_animations"("tenant_id");

CREATE INDEX "custom_components_tenant_id_idx" ON "custom_components"("tenant_id");

CREATE UNIQUE INDEX "custom_components_tenant_id_name_key" ON "custom_components"("tenant_id", "name");

CREATE INDEX "customer_addresses_tenant_id_idx" ON "customer_addresses"("tenant_id");

CREATE INDEX "digital_downloads_tenant_id_idx" ON "digital_downloads"("tenant_id");

CREATE INDEX "discount_usages_tenant_id_idx" ON "discount_usages"("tenant_id");

CREATE INDEX "email_ab_tests_tenant_id_idx" ON "email_ab_tests"("tenant_id");

CREATE INDEX "email_automation_enrollment_steps_tenant_id_idx" ON "email_automation_enrollment_steps"("tenant_id");

CREATE INDEX "email_automation_enrollments_tenant_id_idx" ON "email_automation_enrollments"("tenant_id");

CREATE INDEX "email_automation_steps_tenant_id_idx" ON "email_automation_steps"("tenant_id");

CREATE INDEX "email_automations_tenant_id_idx" ON "email_automations"("tenant_id");

CREATE INDEX "email_link_clicks_tenant_id_idx" ON "email_link_clicks"("tenant_id");

CREATE INDEX "email_links_tenant_id_idx" ON "email_links"("tenant_id");

CREATE INDEX "email_queue_items_tenant_id_idx" ON "email_queue_items"("tenant_id");

CREATE INDEX "email_recipients_campaignId_status_idx" ON "email_recipients"("campaignId", "status");

CREATE INDEX "email_recipients_tenant_id_idx" ON "email_recipients"("tenant_id");

CREATE UNIQUE INDEX "email_recipients_tenant_id_campaignId_email_key" ON "email_recipients"("tenant_id", "campaignId", "email");

CREATE INDEX "email_segment_members_tenant_id_idx" ON "email_segment_members"("tenant_id");

CREATE INDEX "email_segments_tenant_id_idx" ON "email_segments"("tenant_id");

CREATE INDEX "form_submissions_formId_status_idx" ON "form_submissions"("formId", "status");

CREATE INDEX "help_content_tenant_id_idx" ON "help_content"("tenant_id");

CREATE INDEX "help_tours_tenant_id_idx" ON "help_tours"("tenant_id");

CREATE UNIQUE INDEX "help_tours_tenant_id_slug_key" ON "help_tours"("tenant_id", "slug");

CREATE INDEX "license_keys_tenant_id_idx" ON "license_keys"("tenant_id");

CREATE UNIQUE INDEX "license_keys_tenant_id_key_key" ON "license_keys"("tenant_id", "key");

CREATE INDEX "mcp_servers_tenant_id_idx" ON "mcp_servers"("tenant_id");

CREATE UNIQUE INDEX "mcp_servers_tenant_id_name_key" ON "mcp_servers"("tenant_id", "name");

CREATE INDEX "media_canvaDesignId_idx" ON "media"("canvaDesignId");

CREATE UNIQUE INDEX "media_tenant_id_key_key" ON "media"("tenant_id", "key");

CREATE INDEX "media_tags_on_media_tenant_id_idx" ON "media_tags_on_media"("tenant_id");

CREATE INDEX "media_usage_tenant_id_idx" ON "media_usage"("tenant_id");

CREATE INDEX "order_items_tenant_id_idx" ON "order_items"("tenant_id");

CREATE INDEX "order_progress_tenant_id_idx" ON "order_progress"("tenant_id");

CREATE INDEX "order_workflow_stages_tenant_id_idx" ON "order_workflow_stages"("tenant_id");

CREATE UNIQUE INDEX "order_workflow_stages_tenant_id_workflowId_slug_key" ON "order_workflow_stages"("tenant_id", "workflowId", "slug");

CREATE INDEX "page_bundles_tenant_id_idx" ON "page_bundles"("tenant_id");

CREATE INDEX "pages_scheduledAt_idx" ON "pages"("scheduledAt");

CREATE INDEX "payments_tenant_id_idx" ON "payments"("tenant_id");

CREATE INDEX "platform_activity_log_tenant_id_idx" ON "platform_activity_log"("tenant_id");

CREATE INDEX "plugins_tenant_id_idx" ON "plugins"("tenant_id");

CREATE UNIQUE INDEX "plugins_tenant_id_slug_key" ON "plugins"("tenant_id", "slug");

CREATE UNIQUE INDEX "plugins_tenant_id_name_key" ON "plugins"("tenant_id", "name");

CREATE INDEX "primitive_executions_tenant_id_idx" ON "primitive_executions"("tenant_id");

CREATE INDEX "primitives_tenant_id_idx" ON "primitives"("tenant_id");

CREATE UNIQUE INDEX "primitives_tenant_id_name_key" ON "primitives"("tenant_id", "name");

CREATE INDEX "product_categories_tenant_id_idx" ON "product_categories"("tenant_id");

CREATE INDEX "product_custom_fields_tenant_id_idx" ON "product_custom_fields"("tenant_id");

CREATE INDEX "product_images_tenant_id_idx" ON "product_images"("tenant_id");

CREATE INDEX "product_option_values_tenant_id_idx" ON "product_option_values"("tenant_id");

CREATE INDEX "product_options_tenant_id_idx" ON "product_options"("tenant_id");

CREATE INDEX "product_variant_option_values_tenant_id_idx" ON "product_variant_option_values"("tenant_id");

CREATE INDEX "product_variants_tenant_id_idx" ON "product_variants"("tenant_id");

CREATE INDEX "puck_templates_tenant_id_idx" ON "puck_templates"("tenant_id");

CREATE UNIQUE INDEX "puck_templates_tenant_id_slug_key" ON "puck_templates"("tenant_id", "slug");

CREATE UNIQUE INDEX "review_votes_tenant_id_reviewId_email_key" ON "review_votes"("tenant_id", "reviewId", "email");

CREATE INDEX "shipments_tenant_id_idx" ON "shipments"("tenant_id");

CREATE INDEX "subscription_tiers_tenant_id_idx" ON "subscription_tiers"("tenant_id");

CREATE UNIQUE INDEX "subscription_tiers_tenant_id_name_key" ON "subscription_tiers"("tenant_id", "name");

CREATE INDEX "subscriptions_tenant_id_idx" ON "subscriptions"("tenant_id");

CREATE INDEX "super_admins_tenant_id_idx" ON "super_admins"("tenant_id");

CREATE INDEX "team_invitations_tenant_id_idx" ON "team_invitations"("tenant_id");

CREATE UNIQUE INDEX "team_invitations_tenant_id_team_id_email_key" ON "team_invitations"("tenant_id", "team_id", "email");

CREATE INDEX "team_members_tenant_id_idx" ON "team_members"("tenant_id");

CREATE INDEX "team_subdomains_tenant_id_idx" ON "team_subdomains"("tenant_id");

CREATE INDEX "teams_tenant_id_idx" ON "teams"("tenant_id");

CREATE UNIQUE INDEX "teams_tenant_id_slug_key" ON "teams"("tenant_id", "slug");

CREATE INDEX "usage_counters_tenant_id_idx" ON "usage_counters"("tenant_id");

CREATE INDEX "variant_custom_field_values_tenant_id_idx" ON "variant_custom_field_values"("tenant_id");

CREATE INDEX "wishlist_items_tenant_id_idx" ON "wishlist_items"("tenant_id");

CREATE INDEX "workflow_executions_tenant_id_idx" ON "workflow_executions"("tenant_id");

CREATE INDEX "workflow_logs_tenant_id_idx" ON "workflow_logs"("tenant_id");

CREATE INDEX "workflow_nodes_tenant_id_idx" ON "workflow_nodes"("tenant_id");

CREATE INDEX "workflow_steps_tenant_id_idx" ON "workflow_steps"("tenant_id");

CREATE INDEX "workflow_templates_tenant_id_idx" ON "workflow_templates"("tenant_id");

CREATE UNIQUE INDEX "workflow_templates_tenant_id_slug_key" ON "workflow_templates"("tenant_id", "slug");

CREATE INDEX "workflows_tenant_id_idx" ON "workflows"("tenant_id");

CREATE UNIQUE INDEX "workflows_tenant_id_slug_key" ON "workflows"("tenant_id", "slug");

ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "api_key_class_usage" ADD CONSTRAINT "api_key_class_usage_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "usage_counters" ADD CONSTRAINT "usage_counters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "addresses" ADD CONSTRAINT "addresses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mcp_servers" ADD CONSTRAINT "mcp_servers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "products" ADD CONSTRAINT "products_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_images" ADD CONSTRAINT "product_images_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_options" ADD CONSTRAINT "product_options_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_option_values" ADD CONSTRAINT "product_option_values_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_variant_option_values" ADD CONSTRAINT "product_variant_option_values_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_custom_fields" ADD CONSTRAINT "product_custom_fields_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "variant_custom_field_values" ADD CONSTRAINT "variant_custom_field_values_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "license_keys" ADD CONSTRAINT "license_keys_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "digital_downloads" ADD CONSTRAINT "digital_downloads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shipments" ADD CONSTRAINT "shipments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_workflow_stages" ADD CONSTRAINT "order_workflow_stages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_progress" ADD CONSTRAINT "order_progress_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pages" ADD CONSTRAINT "pages_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "page_revisions" ADD CONSTRAINT "page_revisions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "page_revisions" ADD CONSTRAINT "page_revisions_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "media_tags_on_media" ADD CONSTRAINT "media_tags_on_media_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "media_usage" ADD CONSTRAINT "media_usage_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_votes" ADD CONSTRAINT "ai_votes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_streams" ADD CONSTRAINT "ai_streams_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_documents" ADD CONSTRAINT "ai_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "primitives" ADD CONSTRAINT "primitives_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "plugins" ADD CONSTRAINT "plugins_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflows" ADD CONSTRAINT "workflows_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_nodes" ADD CONSTRAINT "workflow_nodes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "primitive_executions" ADD CONSTRAINT "primitive_executions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_logs" ADD CONSTRAINT "workflow_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_recipients" ADD CONSTRAINT "email_recipients_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_suppressions" ADD CONSTRAINT "email_suppressions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "puck_templates" ADD CONSTRAINT "puck_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_automations" ADD CONSTRAINT "email_automations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_automation_steps" ADD CONSTRAINT "email_automation_steps_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_automation_enrollments" ADD CONSTRAINT "email_automation_enrollments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_automation_enrollment_steps" ADD CONSTRAINT "email_automation_enrollment_steps_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_segments" ADD CONSTRAINT "email_segments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_segment_members" ADD CONSTRAINT "email_segment_members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_links" ADD CONSTRAINT "email_links_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_link_clicks" ADD CONSTRAINT "email_link_clicks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_ab_tests" ADD CONSTRAINT "email_ab_tests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_rule_runs" ADD CONSTRAINT "form_rule_runs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_rule_runs" ADD CONSTRAINT "form_rule_runs_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "form_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_rate_limits" ADD CONSTRAINT "form_rate_limits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_bulk_jobs" ADD CONSTRAINT "form_bulk_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blog_post_categories" ADD CONSTRAINT "blog_post_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "discount_usages" ADD CONSTRAINT "discount_usages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "email_queue_items" ADD CONSTRAINT "email_queue_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "page_bundles" ADD CONSTRAINT "page_bundles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bundle_assets" ADD CONSTRAINT "bundle_assets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "custom_animations" ADD CONSTRAINT "custom_animations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "custom_components" ADD CONSTRAINT "custom_components_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "help_content" ADD CONSTRAINT "help_content_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "help_tours" ADD CONSTRAINT "help_tours_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscription_tiers" ADD CONSTRAINT "subscription_tiers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "teams" ADD CONSTRAINT "teams_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_members" ADD CONSTRAINT "team_members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_subdomains" ADD CONSTRAINT "team_subdomains_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "super_admins" ADD CONSTRAINT "super_admins_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "platform_activity_log" ADD CONSTRAINT "platform_activity_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "canva_connections" ADD CONSTRAINT "canva_connections_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tours" ADD CONSTRAINT "tours_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tour_runs" ADD CONSTRAINT "tour_runs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tour_runs" ADD CONSTRAINT "tour_runs_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cms_modules" ADD CONSTRAINT "cms_modules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ade_change_sets" ADD CONSTRAINT "ade_change_sets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ade_change_set_items" ADD CONSTRAINT "ade_change_set_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ade_change_set_items" ADD CONSTRAINT "ade_change_set_items_changeSetId_fkey" FOREIGN KEY ("changeSetId") REFERENCES "ade_change_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ade_change_comments" ADD CONSTRAINT "ade_change_comments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ade_change_comments" ADD CONSTRAINT "ade_change_comments_changeSetId_fkey" FOREIGN KEY ("changeSetId") REFERENCES "ade_change_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ade_tasks" ADD CONSTRAINT "ade_tasks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ade_coverage" ADD CONSTRAINT "ade_coverage_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ade_user_prefs" ADD CONSTRAINT "ade_user_prefs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ade_records" ADD CONSTRAINT "ade_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ade_edit_locks" ADD CONSTRAINT "ade_edit_locks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "agent_spans" ADD CONSTRAINT "agent_spans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "agent_spans" ADD CONSTRAINT "agent_spans_runId_fkey" FOREIGN KEY ("runId") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ade_waits" ADD CONSTRAINT "ade_waits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ade_revisions" ADD CONSTRAINT "ade_revisions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ade_handoffs" ADD CONSTRAINT "ade_handoffs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "connector_accounts" ADD CONSTRAINT "connector_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "connector_accounts" ADD CONSTRAINT "connector_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "client_feedback" ADD CONSTRAINT "client_feedback_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "feedback_deliveries" ADD CONSTRAINT "feedback_deliveries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "feedback_digests" ADD CONSTRAINT "feedback_digests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "feedback_screenshots" ADD CONSTRAINT "feedback_screenshots_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "subdomains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
