import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabase } from './_lib/supabase.js'
import { authenticateRequest } from './_lib/auth.js'
import { getTodaySGT } from './_lib/dates.js'
import type { UserStats } from '../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = await authenticateRequest(req, res)
  if (!userId) return

  const supabase = getSupabase()
  const today = getTodaySGT()

  // Fetch user profile
  const { data: user } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', userId)
    .single()

  // Compute streaks
  const { data: currentStreak } = await supabase.rpc(
    'compute_current_streak',
    { p_user_id: userId }
  )
  const { data: bestStreak } = await supabase.rpc('compute_best_streak', {
    p_user_id: userId,
  })

  // Count total attempts and correct attempts
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

  // Check if user attempted today's question
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

  return res.json(stats)
}
