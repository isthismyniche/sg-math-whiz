-- User attempts
-- time_ms stores milliseconds as integer (PO-approved deviation from PRD's time_seconds numeric)
-- is_daily = true when attempted on the question's assigned date
CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id),
  question_id UUID NOT NULL REFERENCES questions(id),
  submitted_answer NUMERIC,
  is_correct BOOLEAN NOT NULL,
  time_ms INTEGER NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  is_daily BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(user_id, question_id)
);

CREATE INDEX idx_attempts_user ON attempts(user_id);
CREATE INDEX idx_attempts_question ON attempts(question_id);
CREATE INDEX idx_attempts_daily_correct ON attempts(question_id, is_correct, time_ms)
  WHERE is_daily = TRUE AND is_correct = TRUE;
