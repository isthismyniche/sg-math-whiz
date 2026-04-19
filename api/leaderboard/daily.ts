import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabase } from '../_lib/supabase.js'
import { authenticateRequest } from '../_lib/auth.js'
import { getTodaySGT } from '../_lib/dates.js'
import type { LeaderboardEntry } from '../../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = await authenticateRequest(req, res)
  if (!userId) return

  const date = (req.query.date as string) ?? getTodaySGT()

  const supabase = getSupabase()

  // Find the question for this date
  const { data: question } = await supabase
    .from('questions')
    .select('id')
    .eq('date', date)
    .single()

  if (!question) {
    return res.json({ entries: [], userRank: null })
  }

  // Fetch all correct daily attempts, sorted by time
  const { data: attempts, error } = await supabase
    .from('attempts')
    .select('user_id, time_ms')
    .eq('question_id', question.id)
    .eq('is_correct', true)
    .eq('is_daily', true)
    .order('time_ms', { ascending: true })
    .limit(50)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // Fetch display names for all users in the leaderboard
  const userIds = attempts?.map((a) => a.user_id) ?? []
  const { data: users } = await supabase
    .from('users')
    .select('id, display_name')
    .in('id', userIds.length > 0 ? userIds : ['__none__'])

  const userMap = new Map(users?.map((u) => [u.id, u.display_name]) ?? [])

  const entries: LeaderboardEntry[] =
    attempts?.map((a, i) => ({
      rank: i + 1,
      displayName: userMap.get(a.user_id) ?? 'Anonymous',
      timeMs: a.time_ms,
      userId: a.user_id,
    })) ?? []

  const userRank = entries.find((e) => e.userId === userId)?.rank ?? null

  return res.json({ entries, userRank })
}
