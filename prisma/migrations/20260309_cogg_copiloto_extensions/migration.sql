-- Migration: CoggCopiloto Schema Extensions
-- Date: 2026-03-09
-- Phase 2: Extend Student and Teacher models for classroom-demo backend

-- ============================================================================
-- 1. Extend Teacher model for bcrypt authentication
-- ============================================================================

-- Make email NOT NULL and UNIQUE (required for auth)
ALTER TABLE "teachers" ALTER COLUMN "email" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "teachers_email_unique" ON "teachers"("email");

-- Add passwordHash column for bcrypt authentication
ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "password_hash" TEXT;

-- Add email index for fast lookups
CREATE INDEX IF NOT EXISTS "teachers_email_idx" ON "teachers"("email");

-- ============================================================================
-- 2. Extend Student model for CoggCopiloto classroom-demo
-- ============================================================================

-- Grid position for classroom layout
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "grid_row" INTEGER;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "grid_col" INTEGER;

-- Performance metrics
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "difficulty_score" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "engagement_score" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "performance_score" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "overall_data_score" DOUBLE PRECISION DEFAULT 0;

-- Clinical flags
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "rti_tier" INTEGER; -- 1, 2, 3 (RTI/MTSS tier)
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "has_diagnosis" BOOLEAN DEFAULT false;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "needs_attention" BOOLEAN DEFAULT false;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "referred_to_specialist" BOOLEAN DEFAULT false;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "has_academic_plan" BOOLEAN DEFAULT false;

-- SENNA Big Five (JSONB)
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "senna" JSONB;

-- Teacher quick note
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "teacher_brief" TEXT;

-- ============================================================================
-- 3. Comments for documentation
-- ============================================================================

COMMENT ON COLUMN "teachers"."email" IS 'Unique email for authentication (bcrypt-based login)';
COMMENT ON COLUMN "teachers"."password_hash" IS 'bcrypt hash of teacher password';

COMMENT ON COLUMN "students"."grid_row" IS 'Classroom grid position (row)';
COMMENT ON COLUMN "students"."grid_col" IS 'Classroom grid position (column)';
COMMENT ON COLUMN "students"."difficulty_score" IS 'Academic difficulty score (0-100)';
COMMENT ON COLUMN "students"."engagement_score" IS 'Classroom engagement score (0-100)';
COMMENT ON COLUMN "students"."performance_score" IS 'Overall performance score (0-100)';
COMMENT ON COLUMN "students"."overall_data_score" IS 'Composite data score for quick sorting';
COMMENT ON COLUMN "students"."rti_tier" IS 'RTI/MTSS tier (1=universal, 2=targeted, 3=intensive)';
COMMENT ON COLUMN "students"."has_diagnosis" IS 'Has formal clinical diagnosis (laudo)';
COMMENT ON COLUMN "students"."needs_attention" IS 'Flagged for teacher attention';
COMMENT ON COLUMN "students"."referred_to_specialist" IS 'Referred to psychologist/specialist';
COMMENT ON COLUMN "students"."has_academic_plan" IS 'Has individualized education plan (PEI)';
COMMENT ON COLUMN "students"."senna" IS 'SENNA Big Five scores (JSON: abertura, conscienciosidade, engSocial, amabilidade, resiliencia)';
COMMENT ON COLUMN "students"."teacher_brief" IS 'Teacher quick note/brief about student';
