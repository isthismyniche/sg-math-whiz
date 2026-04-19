import { getSupabase } from '../_lib/supabase.js'
import { authenticateRequest } from '../_lib/auth.js'
import { json } from '../_lib/response.js'
import type { StreakLeaderboardEntry } from '../../src/types'

export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)

  const auth = await authenticateRequest(req)
  if (auth instanceof Response) return auth
  const userId = auth

  const supabase = getSupabase()

  const { data: users, error: uErr } = await supabase
    .from('users')
    .select('id, display_name')

  if (uErr || !users) return json({ error: 'Failed to fetch users' }, 500)

  const entries: StreakLeaderboardEntry[] = []

  for (const user of users) {
    const { data: streak } = await supabase.rpc('compute_current_streak', { p_user_id: user.id })
    const currentStreak = streak ?? 0
    if (currentStreak === 0) continue

    const { data: avgData } = await supabase
      .from('attempts')
      .select('time_ms')
      .eq('user_id', user.id)
      .eq('is_correct', true)
      .eq('is_daily', true)

    const avgTimeMs = avgData && avgData.length > 0
      ? Math.round(avgData.reduce((sum, a) => sum + a.time_ms, 0) / avgData.length)
      : 0

    entries.push({ rank: 0, displayName: user.display_name, currentStreak, avgTimeMs, userId: user.id })
  }

  entries.sort((a, b) => b.currentStreak - a.currentStreak || a.avgTimeMs - b.avgTimeMs)
  entries.forEach((e, i) => { e.rank = i + 1 })

  const top = entries.slice(0, 50)
  const userRank = entries.find((e) => e.userId === userId)?.rank ?? null

  return json({ entries: top, userRank })
}
