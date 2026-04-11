-- Users table
-- id is generic text: UUID from localStorage at MVP, Supabase auth UID post-MVP
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
