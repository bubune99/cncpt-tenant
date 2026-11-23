-- Run first, outside a transaction (Postgres adds enum values on their own). Safe to re-run.
ALTER TYPE "EmailCampaignStatus" ADD VALUE IF NOT EXISTS 'STOPPED';
ALTER TYPE "EmailCampaignStatus" ADD VALUE IF NOT EXISTS 'FAILED';
