-- Questions bank
-- date is the assigned challenge date (null = unscheduled)
-- correct_answer is NEVER exposed to the frontend before submission
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE,
  question_text TEXT NOT NULL,
  correct_answer NUMERIC NOT NULL,
  solution_explanation TEXT,
  source TEXT,
  topic TEXT,
  difficulty TEXT DEFAULT 'hard',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_date ON questions(date);
