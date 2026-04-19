import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabase } from './_lib/supabase.js'
import { authenticateRequest } from './_lib/auth.js'
import { getTodaySGT } from './_lib/dates.js'
import type { TodayResponse } from '../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = await authenticateRequest(req, res)
  if (!userId) return

  const supabase = getSupabase()
  const today = getTodaySGT()

  // Fetch today's question — NEVER include correct_answer
  const { data: question, error: qErr } = await supabase
    .from('questions')
    .select('id, question_text, date, diagram_url')
    .eq('date', today)
    .single()

  if (qErr || !question) {
    return res.status(404).json({ error: 'No challenge available for today' })
  }

  // Check if user already attempted
  const { data: attempt } = await supabase
    .from('attempts')
    .select('submitted_answer, is_correct, time_ms')
    .eq('user_id', userId)
    .eq('question_id', question.id)
    .single()

  // If already attempted, fetch additional data for result display
  let attemptData: TodayResponse['attempt'] | undefined
  if (attempt) {
    // Fetch correct answer
    const { data: fullQ } = await supabase
      .from('questions')
      .select('correct_answer')
      .eq('id', question.id)
      .single()

    // Compute streaks
    const { data: currentStreak } = await supabase.rpc('compute_current_streak', { p_user_id: userId })
    const { data: bestStreak } = await supabase.rpc('compute_best_streak', { p_user_id: userId })

    // Compute rank if correct
    let rank: number | undefined
    if (attempt.is_correct) {
      const { count } = await supabase
        .from('attempts')
        .select('*', { count: 'exact', head: true })
        .eq('question_id', question.id)
        .eq('is_correct', true)
        .eq('is_daily', true)
        .lt('time_ms', attempt.time_ms)
      rank = (count ?? 0) + 1
    }

    attemptData = {
      submittedAnswer: attempt.submitted_answer,
      isCorrect: attempt.is_correct,
      timeMs: attempt.time_ms,
      correctAnswer: fullQ ? Number(fullQ.correct_answer) : undefined,
      rank,
      currentStreak: currentStreak ?? 0,
      bestStreak: bestStreak ?? 0,
    }
  }

  const response: TodayResponse = {
    questionId: question.id,
    questionText: question.question_text,
    diagramUrl: question.diagram_url ?? null,
    date: question.date,
    alreadyAttempted: !!attempt,
    ...(attemptData && { attempt: attemptData }),
  }

  return res.json(response)
}
