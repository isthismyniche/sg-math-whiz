-- Seed data for testing — two sample questions
-- Run this AFTER the schema migrations (001-004)
-- Assigns one question to today's date (SGT) and one to yesterday

INSERT INTO questions (date, question_text, correct_answer, solution_explanation, source, topic, difficulty)
VALUES
  (
    (NOW() AT TIME ZONE 'Asia/Singapore')::date,
    'A shop sold a shirt at a 20% discount off its usual price of $45. A week later, the shop offered a further 15% discount off the discounted price. What was the final selling price of the shirt in dollars?',
    30.60,
    'Step 1: First discount = 20% of $45 = $9. Price after first discount = $45 - $9 = $36.

Step 2: Second discount = 15% of $36 = $5.40. Final price = $36 - $5.40 = $30.60.

Key Insight: The two discounts are applied sequentially, not added together. A "20% + 15% discount" is NOT a 35% discount. 35% of $45 would give $29.25 — a common mistake.

Answer: 30.60',
    'Sample — Percentage Discounts',
    'Percentages',
    'hard'
  ),
  (
    ((NOW() AT TIME ZONE 'Asia/Singapore') - INTERVAL '1 day')::date,
    'A tank is 3/4 filled with water. After 36 litres of water are poured out, the tank is 1/4 full. What is the full capacity of the tank in litres?',
    72,
    'Step 1: Water removed = 3/4 - 1/4 = 2/4 = 1/2 of the tank.

Step 2: 1/2 of the tank = 36 litres.

Step 3: Full capacity = 36 × 2 = 72 litres.

Key Insight: You don''t need the actual capacity to find the fraction removed — just subtract the fractions, then solve.

Answer: 72',
    'Sample — Fractions',
    'Fractions & Ratios',
    'hard'
  );
