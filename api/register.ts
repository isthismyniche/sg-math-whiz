import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabase } from './_lib/supabase.js'
import type { RegisterRequest } from '../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = req.body as RegisterRequest

  if (!body.userId || !body.displayName?.trim()) {
    return res.status(400).json({ error: 'userId and displayName are required' })
  }

  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('users')
    .upsert(
      { id: body.userId, display_name: body.displayName.trim() },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.json({ id: data.id, displayName: data.display_name })
}
