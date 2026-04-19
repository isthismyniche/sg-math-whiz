import { getSupabase } from './_lib/supabase.js'
import { authenticateRequest } from './_lib/auth.js'
import { getTodaySGT } from './_lib/dates.js'
import { json } from './_lib/response.js'
import type { UserStats } from '../src/types'

export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)

  const auth = await authenticateRequest(req)
  if (auth instanceof Response) return auth
  const userId = auth

  const supabase = getSupabase()
  const today = getTodaySGT()

  const { data: user } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', userId)
    .single()

  const { data: currentStreak } = await supabase.rpc('compute_current_streak', { p_user_id: userId })
  const { data: bestStreak } = await supabase.rpc('compute_best_streak', { p_user_id: userId })

  const { count: totalAttempts } = await supabase
    .from('attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_daily', true)

  const { count: totalCorrect } = await supabase
    .from('attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_daily', true)
    .eq('is_correct', true)

  const { data: todayQ } = await supabase
    .from('questions')
    .select('id')
    .eq('date', today)
    .single()

  let attemptedToday = false
  if (todayQ) {
    const { count } = await supabase
      .from('attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('question_id', todayQ.id)
    attemptedToday = (count ?? 0) > 0
  }

  const stats: UserStats = {
    displayName: user?.display_name ?? 'Anonymous',
    currentStreak: currentStreak ?? 0,
    bestStreak: bestStreak ?? 0,
    totalAttempts: totalAttempts ?? 0,
    totalCorrect: totalCorrect ?? 0,
    attemptedToday,
  }

  return json(stats)
}
