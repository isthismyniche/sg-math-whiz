import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabase } from './supabase.js'

/**
 * Extract and validate the user ID from the request.
 * Returns the user ID string if valid, or sends an error response and returns null.
 */
export async function authenticateRequest(
  req: VercelRequest,
  res: VercelResponse
): Promise<string | null> {
  const userId = req.headers['x-user-id'] as string | undefined

  if (!userId) {
    res.status(401).json({ error: 'Missing x-user-id header' })
    return null
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  if (error || !data) {
    res.status(401).json({ error: 'User not found' })
    return null
  }

  return userId
}
