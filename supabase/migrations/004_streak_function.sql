-- Compute current streak for a user (PRD §4.5)
--
-- Streak definition:
--   A streak counts consecutive CORRECT daily attempts, walking backwards
--   from the most recent attempt. Skipped days (no attempt) are IGNORED —
--   they neither break nor extend the streak. Only an INCORRECT answer
--   breaks the streak.
--
-- Example: User attempts on days 1, 3, 5, 7.
--   Correct on 1, 5, 7. Wrong on 3.
--   Current streak = 2 (days 5 and 7). Day 3 broke the earlier streak.
--   Days 2, 4, 6 are irrelevant.

CREATE OR REPLACE FUNCTION compute_current_streak(p_user_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  streak INTEGER := 0;
  rec RECORD;
BEGIN
  -- Walk backwards through all daily attempts, most recent first
  FOR rec IN
    SELECT a.is_correct
    FROM attempts a
    JOIN questions q ON a.question_id = q.id
    WHERE a.user_id = p_user_id
      AND a.is_daily = TRUE
    ORDER BY q.date DESC
  LOOP
    IF rec.is_correct THEN
      streak := streak + 1;
    ELSE
      -- Incorrect answer breaks the streak
      EXIT;
    END IF;
  END LOOP;

  RETURN streak;
END;
$$;

-- Compute best (longest) streak ever for a user
CREATE OR REPLACE FUNCTION compute_best_streak(p_user_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  best INTEGER := 0;
  current INTEGER := 0;
  rec RECORD;
BEGIN
  -- Walk forwards through all daily attempts, oldest first
  FOR rec IN
    SELECT a.is_correct
    FROM attempts a
    JOIN questions q ON a.question_id = q.id
    WHERE a.user_id = p_user_id
      AND a.is_daily = TRUE
    ORDER BY q.date ASC
  LOOP
    IF rec.is_correct THEN
      current := current + 1;
      IF current > best THEN
        best := current;
      END IF;
    ELSE
      current := 0;
    END IF;
  END LOOP;

  RETURN best;
END;
$$;
