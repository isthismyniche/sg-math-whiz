import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabase } from './_lib/supabase'
import { authenticateRequest } from './_lib/auth'
import { getTodaySGT } from './_lib/dates'
import type { SubmitRequest, SubmitResponse } from '../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = await authenticateRequest(req, res)
  if (!userId) return

  const body = req.body as SubmitRequest

  if (!body.questionId || body.answer === undefined || !body.timeMs) {
    return res.status(400).json({ error: 'questionId, answer, and timeMs are required' })
  }

  const supabase = getSupabase()
  const today = getTodaySGT()

  // Fetch the question WITH correct_answer (server-side only)
  const { data: question, error: qErr } = await supabase
    .from('questions')
    .select('id, correct_answer, date')
    .eq('id', body.questionId)
    .single()

  if (qErr || !question) {
    return res.status(404).json({ error: 'Question not found' })
  }

  // Determine if this is a daily attempt (attempted on the assigned date)
  const isDaily = question.date === today

  // Compare answers: numeric comparison with small tolerance for floating point
  const correctAnswer = Number(question.correct_answer)
  const submittedAnswer = Number(body.answer)
  const isCorrect = Math.abs(correctAnswer - submittedAnswer) < 0.01

  // Insert attempt (UNIQUE constraint prevents duplicates)
  const { error: insertErr } = await supabase.from('attempts').insert({
    user_id: userId,
    question_id: body.questionId,
    submitted_answer: body.answer,
    is_correct: isCorrect,
    time_ms: body.timeMs,
    is_daily: isDaily,
  })

  if (insertErr) {
    if (insertErr.code === '23505') {
      return res.status(409).json({ error: 'You have already attempted this question' })
    }
    return res.status(500).json({ error: insertErr.message })
  }

  // Compute rank if correct and daily
  let rank: number | undefined
  if (isCorrect && isDaily) {
    const { count } = await supabase
      .from('attempts')
      .select('*', { count: 'exact', head: true })
      .eq('question_id', body.questionId)
      .eq('is_correct', true)
      .eq('is_daily', true)
      .lt('time_ms', body.timeMs)

    rank = (count ?? 0) + 1
  }

  // Compute streaks
  const { data: currentStreakData } = await supabase.rpc(
    'compute_current_streak',
    { p_user_id: userId }
  )
  const { data: bestStreakData } = await supabase.rpc('compute_best_streak', {
    p_user_id: userId,
  })

  const response: SubmitResponse = {
    isCorrect,
    correctAnswer,
    timeMs: body.timeMs,
    rank,
    currentStreak: currentStreakData ?? 0,
    bestStreak: bestStreakData ?? 0,
  }

  return res.json(response)
}
