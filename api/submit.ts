import { getSupabase } from './_lib/supabase'
import { authenticateRequest } from './_lib/auth'
import { getTodaySGT } from './_lib/dates'
import type { SubmitRequest, SubmitResponse } from '../src/types'

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const auth = await authenticateRequest(request)
  if ('error' in auth) return auth.error

  const body = (await request.json()) as SubmitRequest

  if (!body.questionId || body.answer === undefined || !body.timeMs) {
    return Response.json(
      { error: 'questionId, answer, and timeMs are required' },
      { status: 400 }
    )
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
    return Response.json({ error: 'Question not found' }, { status: 404 })
  }

  // Determine if this is a daily attempt (attempted on the assigned date)
  const isDaily = question.date === today

  // Compare answers: numeric comparison with small tolerance for floating point
  const correctAnswer = Number(question.correct_answer)
  const submittedAnswer = Number(body.answer)
  const isCorrect = Math.abs(correctAnswer - submittedAnswer) < 0.01

  // Insert attempt (UNIQUE constraint prevents duplicates)
  const { error: insertErr } = await supabase.from('attempts').insert({
    user_id: auth.userId,
    question_id: body.questionId,
    submitted_answer: body.answer,
    is_correct: isCorrect,
    time_ms: body.timeMs,
    is_daily: isDaily,
  })

  if (insertErr) {
    if (insertErr.code === '23505') {
      // Unique constraint violation — already attempted
      return Response.json(
        { error: 'You have already attempted this question' },
        { status: 409 }
      )
    }
    return Response.json({ error: insertErr.message }, { status: 500 })
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
    { p_user_id: auth.userId }
  )
  const { data: bestStreakData } = await supabase.rpc('compute_best_streak', {
    p_user_id: auth.userId,
  })

  const response: SubmitResponse = {
    isCorrect,
    correctAnswer,
    timeMs: body.timeMs,
    rank,
    currentStreak: currentStreakData ?? 0,
    bestStreak: bestStreakData ?? 0,
  }

  return Response.json(response)
}
