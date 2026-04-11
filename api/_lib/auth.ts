import { getSupabase } from './supabase'

/**
 * Extract and validate the user ID from the request.
 * Returns the user ID string if valid, or a Response error to return immediately.
 */
export async function authenticateRequest(
  request: Request
): Promise<{ userId: string } | { error: Response }> {
  const userId = request.headers.get('x-user-id')

  if (!userId) {
    return {
      error: Response.json(
        { error: 'Missing x-user-id header' },
        { status: 401 }
      ),
    }
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return {
      error: Response.json(
        { error: 'User not found' },
        { status: 401 }
      ),
    }
  }

  return { userId }
}
