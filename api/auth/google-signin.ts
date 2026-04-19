import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Uses service role key to verify the Supabase access token and access the DB.
function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key, { auth: { persistSession: false } })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { accessToken } = req.body as { accessToken?: string }
  if (!accessToken) {
    return res.status(400).json({ error: 'accessToken is required' })
  }

  const supabase = getSupabase()

  // Verify the access token with Supabase Auth and get the user.
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  // user.id is Supabase Auth's stable UUID for this Google account.
  const googleSub = user.id
  const googleDisplayName = (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Player'
  ).slice(0, 30)

  // Look up an existing app user linked to this Google account.
  const { data: existing } = await supabase
    .from('users')
    .select('id, display_name')
    .eq('google_sub', googleSub)
    .single()

  if (existing) {
    return res.json({ userId: existing.id, displayName: existing.display_name })
  }

  // No existing user — create a new app user linked to this Google account.
  const newUserId = crypto.randomUUID()
  const { error: insertError } = await supabase
    .from('users')
    .insert({ id: newUserId, display_name: googleDisplayName, google_sub: googleSub })

  if (insertError) {
    return res.status(500).json({ error: insertError.message })
  }

  return res.json({ userId: newUserId, displayName: googleDisplayName, isNewUser: true })
}
