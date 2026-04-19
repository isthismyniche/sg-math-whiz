-- Add diagram_url column to questions
ALTER TABLE questions ADD COLUMN IF NOT EXISTS diagram_url TEXT;

-- Create public Supabase Storage bucket for question diagrams
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'question-diagrams',
  'question-diagrams',
  true,
  5242880, -- 5MB max per image
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;
