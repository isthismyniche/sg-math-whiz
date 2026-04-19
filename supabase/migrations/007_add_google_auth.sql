-- Add google_sub column to link Google OAuth identities to app users.
-- google_sub stores the Supabase Auth user ID (stable per Google account).
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub TEXT UNIQUE;
