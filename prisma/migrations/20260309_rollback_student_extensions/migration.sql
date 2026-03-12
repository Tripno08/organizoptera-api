-- Rollback: Remove CoggCopiloto student extensions from Organizoptera
-- These fields belong in Profileoptera, not in the shared organizational schema.
-- Date: 2026-03-09

ALTER TABLE "students" DROP COLUMN IF EXISTS "grid_row";
ALTER TABLE "students" DROP COLUMN IF EXISTS "grid_col";
ALTER TABLE "students" DROP COLUMN IF EXISTS "difficulty_score";
ALTER TABLE "students" DROP COLUMN IF EXISTS "engagement_score";
ALTER TABLE "students" DROP COLUMN IF EXISTS "performance_score";
ALTER TABLE "students" DROP COLUMN IF EXISTS "overall_data_score";
ALTER TABLE "students" DROP COLUMN IF EXISTS "rti_tier";
ALTER TABLE "students" DROP COLUMN IF EXISTS "has_diagnosis";
ALTER TABLE "students" DROP COLUMN IF EXISTS "needs_attention";
ALTER TABLE "students" DROP COLUMN IF EXISTS "referred_to_specialist";
ALTER TABLE "students" DROP COLUMN IF EXISTS "has_academic_plan";
ALTER TABLE "students" DROP COLUMN IF EXISTS "senna";
ALTER TABLE "students" DROP COLUMN IF EXISTS "teacher_brief";
