-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('BUG', 'FEATURE', 'GENERAL', 'OTHER');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" VARCHAR(255) NOT NULL,
    "user_email" VARCHAR(255) NOT NULL,
    "user_name" VARCHAR(255),
    "tenant_id" INTEGER,
    "type" "FeedbackType" NOT NULL DEFAULT 'GENERAL',
    "subject" VARCHAR(255),
    "message" TEXT NOT NULL,
    "page_url" VARCHAR(500),
    "user_agent" TEXT,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "admin_notes" TEXT,
    "resolved_by" VARCHAR(255),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_feedback_user" ON "feedback"("user_id");

-- CreateIndex
CREATE INDEX "idx_feedback_tenant" ON "feedback"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_feedback_status" ON "feedback"("status");

-- CreateIndex
CREATE INDEX "idx_feedback_type" ON "feedback"("type");

-- CreateIndex
CREATE INDEX "idx_feedback_created" ON "feedback"("created_at" DESC);
