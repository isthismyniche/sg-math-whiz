import { getSupabase } from './_lib/supabase.js'
import { authenticateRequest } from './_lib/auth.js'
import { getTodaySGT } from './_lib/dates.js'
import { json } from './_lib/response.js'
import type { SubmitRequest, SubmitResponse } from '../src/types'

export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const auth = await authenticateRequest(req)
  if (auth instanceof Response) return auth
  const userId = auth

  const body = await req.json() as SubmitRequest

  if (!body.questionId || body.answer === undefined || !body.timeMs) {
    return json({ error: 'questionId, answer, and timeMs are required' }, 400)
  }

  const supabase = getSupabase()
  const today = getTodaySGT()

  const { data: question, error: qErr } = await supabase
    .from('questions')
    .select('id, correct_answer, date')
    .eq('id', body.questionId)
    .single()

  if (qErr || !question) return json({ error: 'Question not found' }, 404)

  const isDaily = question.date === today
  const correctAnswer = Number(question.correct_answer)
  const submittedAnswer = Number(body.answer)
  const isCorrect = Math.abs(correctAnswer - submittedAnswer) < 0.01

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
      return json({ error: 'You have already attempted this question' }, 409)
    }
    return json({ error: insertErr.message }, 500)
  }

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

  const { data: currentStreakData } = await supabase.rpc('compute_current_streak', { p_user_id: userId })
  const { data: bestStreakData } = await supabase.rpc('compute_best_streak', { p_user_id: userId })

  const response: SubmitResponse = {
    isCorrect,
    correctAnswer,
    timeMs: body.timeMs,
    rank,
    currentStreak: currentStreakData ?? 0,
    bestStreak: bestStreakData ?? 0,
  }

  return json(response)
}
