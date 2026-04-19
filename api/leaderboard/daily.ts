import { getSupabase } from '../_lib/supabase.js'
import { authenticateRequest } from '../_lib/auth.js'
import { getTodaySGT } from '../_lib/dates.js'
import { json } from '../_lib/response.js'
import type { LeaderboardEntry } from '../../src/types'

export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)

  const auth = await authenticateRequest(req)
  if (auth instanceof Response) return auth
  const userId = auth

  const date = new URL(req.url).searchParams.get('date') ?? getTodaySGT()
  const supabase = getSupabase()

  const { data: question } = await supabase
    .from('questions')
    .select('id')
    .eq('date', date)
    .single()

  if (!question) return json({ entries: [], userRank: null, correctCount: 0, wrongCount: 0 })

  const { data: attempts, error } = await supabase
    .from('attempts')
    .select('user_id, time_ms')
    .eq('question_id', question.id)
    .eq('is_correct', true)
    .eq('is_daily', true)
    .order('time_ms', { ascending: true })
    .limit(50)

  if (error) return json({ error: error.message }, 500)

  const { count: wrongCount } = await supabase
    .from('attempts')
    .select('id', { count: 'exact', head: true })
    .eq('question_id', question.id)
    .eq('is_correct', false)
    .eq('is_daily', true)

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
  const correctCount = entries.length

  return json({ entries, userRank, correctCount, wrongCount: wrongCount ?? 0 })
}
