import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabase } from '../_lib/supabase'
import { authenticateRequest } from '../_lib/auth'
import type { StreakLeaderboardEntry } from '../../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = await authenticateRequest(req, res)
  if (!userId) return

  const supabase = getSupabase()

  // Fetch all users
  const { data: users, error: uErr } = await supabase
    .from('users')
    .select('id, display_name')

  if (uErr || !users) {
    return res.status(500).json({ error: 'Failed to fetch users' })
  }

  // Compute streak for each user
  const entries: StreakLeaderboardEntry[] = []

  for (const user of users) {
    const { data: streak } = await supabase.rpc('compute_current_streak', {
      p_user_id: user.id,
    })

    const currentStreak = streak ?? 0
    if (currentStreak === 0) continue

    // Compute average time for correct daily attempts
    const { data: avgData } = await supabase
      .from('attempts')
      .select('time_ms')
      .eq('user_id', user.id)
      .eq('is_correct', true)
      .eq('is_daily', true)

    const avgTimeMs = avgData && avgData.length > 0
      ? Math.round(avgData.reduce((sum, a) => sum + a.time_ms, 0) / avgData.length)
      : 0

    entries.push({
      rank: 0,
      displayName: user.display_name,
      currentStreak,
      avgTimeMs,
      userId: user.id,
    })
  }

  // Sort by streak descending, then by avg time ascending
  entries.sort((a, b) => b.currentStreak - a.currentStreak || a.avgTimeMs - b.avgTimeMs)

  // Assign ranks
  entries.forEach((e, i) => {
    e.rank = i + 1
  })

  // Limit to top 50
  const top = entries.slice(0, 50)
  const userRank = entries.find((e) => e.userId === userId)?.rank ?? null

  return res.json({ entries: top, userRank })
}
