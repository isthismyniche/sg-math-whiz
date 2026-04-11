import { getSupabase } from './_lib/supabase'
import { authenticateRequest } from './_lib/auth'
import { getTodaySGT } from './_lib/dates'
import type { TodayResponse } from '../src/types'

export default async function handler(request: Request) {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const auth = await authenticateRequest(request)
  if ('error' in auth) return auth.error

  const supabase = getSupabase()
  const today = getTodaySGT()

  // Fetch today's question — NEVER include correct_answer
  const { data: question, error: qErr } = await supabase
    .from('questions')
    .select('id, question_text, date')
    .eq('date', today)
    .single()

  if (qErr || !question) {
    return Response.json(
      { error: 'No challenge available for today' },
      { status: 404 }
    )
  }

  // Check if user already attempted
  const { data: attempt } = await supabase
    .from('attempts')
    .select('submitted_answer, is_correct, time_ms')
    .eq('user_id', auth.userId)
    .eq('question_id', question.id)
    .single()

  const response: TodayResponse = {
    questionId: question.id,
    questionText: question.question_text,
    date: question.date,
    alreadyAttempted: !!attempt,
    ...(attempt && {
      attempt: {
        submittedAnswer: attempt.submitted_answer,
        isCorrect: attempt.is_correct,
        timeMs: attempt.time_ms,
      },
    }),
  }

  return Response.json(response)
}
