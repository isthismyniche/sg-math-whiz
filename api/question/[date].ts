import { getSupabase } from '../_lib/supabase.js'
import { authenticateRequest } from '../_lib/auth.js'
import { json } from '../_lib/response.js'
import type { TodayResponse } from '../../src/types'

export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)

  const auth = await authenticateRequest(req)
  if (auth instanceof Response) return auth
  const userId = auth

  const date = new URL(req.url).pathname.split('/').pop()
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, 400)
  }

  const supabase = getSupabase()

  const { data: question, error: qErr } = await supabase
    .from('questions')
    .select('id, question_text, date, source, diagram_url')
    .eq('date', date)
    .single()

  if (qErr || !question) return json({ error: 'No challenge found for this date' }, 404)

  const { data: attempt } = await supabase
    .from('attempts')
    .select('submitted_answer, is_correct, time_ms')
    .eq('user_id', userId)
    .eq('question_id', question.id)
    .single()

  let attemptData: TodayResponse['attempt'] | undefined
  if (attempt) {
    const { data: fullQ } = await supabase
      .from('questions')
      .select('correct_answer')
      .eq('id', question.id)
      .single()

    const { data: currentStreak } = await supabase.rpc('compute_current_streak', { p_user_id: userId })
    const { data: bestStreak } = await supabase.rpc('compute_best_streak', { p_user_id: userId })

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

  return json(response)
}
