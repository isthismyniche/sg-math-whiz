import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client using service role key
// This bypasses RLS and has full database access — only use in API routes
export function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(url, key)
}
