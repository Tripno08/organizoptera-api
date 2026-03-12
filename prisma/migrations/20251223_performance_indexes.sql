-- Performance Optimization Indexes
-- Created: 2025-12-23
-- Purpose: Optimize hot queries identified in performance baseline

-- Student Skills (hot path)
CREATE INDEX IF NOT EXISTS idx_student_skills_lookup 
  ON student_skills(student_id, skill_code, proficiency);

CREATE INDEX IF NOT EXISTS idx_student_skills_student 
  ON student_skills(student_id, last_practiced);

-- Responses (frequent queries)
CREATE INDEX IF NOT EXISTS idx_responses_student_activity 
  ON responses(student_id, activity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_responses_student_recent 
  ON responses(student_id, created_at DESC);

-- Activities (search and filter)
CREATE INDEX IF NOT EXISTS idx_activities_published 
  ON activities(status, published_at DESC) 
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_activities_search 
  ON activities(title, subject, grade_level) 
  WHERE status = 'published';

-- Gamification (rankings)
CREATE INDEX IF NOT EXISTS idx_gamification_rankings 
  ON gamification_profiles(level DESC, total_xp DESC);

CREATE INDEX IF NOT EXISTS idx_gamification_student 
  ON gamification_profiles(student_id, level);

-- Assessment sessions (recent activity)
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_recent 
  ON assessment_sessions(student_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessment_sessions_status 
  ON assessment_sessions(status, student_id);

-- Comments for query planner
COMMENT ON INDEX idx_student_skills_lookup IS 'Composite index for skill progress queries';
COMMENT ON INDEX idx_responses_student_activity IS 'Optimize response history queries';
COMMENT ON INDEX idx_activities_published IS 'Speed up published activities listing';

-- Analyze tables for query planner
ANALYZE student_skills;
ANALYZE responses;
ANALYZE activities;
ANALYZE gamification_profiles;
ANALYZE assessment_sessions;

