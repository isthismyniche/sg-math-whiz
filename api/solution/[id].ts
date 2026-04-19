import { getSupabase } from '../_lib/supabase.js'
import { authenticateRequest } from '../_lib/auth.js'
import { json } from '../_lib/response.js'
import type { SolutionResponse } from '../../src/types'

export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)

  const auth = await authenticateRequest(req)
  if (auth instanceof Response) return auth
  const userId = auth

  const questionId = new URL(req.url).pathname.split('/').pop()
  if (!questionId) return json({ error: 'Question ID is required' }, 400)

  const supabase = getSupabase()

  const { data: attempt } = await supabase
    .from('attempts')
    .select('submitted_answer, is_correct, time_ms')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .single()

  if (!attempt) {
    return json({ error: 'You must attempt the question before viewing the solution' }, 403)
  }

  const { data: question, error: qErr } = await supabase
    .from('questions')
    .select('id, question_text, date, correct_answer, solution_explanation, source, topic, diagram_url')
    .eq('id', questionId)
    .single()

  if (qErr || !question) return json({ error: 'Question not found' }, 404)

  const response: SolutionResponse = {
    questionId: question.id,
    questionText: question.question_text,
    diagramUrl: question.diagram_url ?? null,
    date: question.date,
    correctAnswer: Number(question.correct_answer),
    solutionExplanation: question.solution_explanation,
    source: question.source,
    topic: question.topic,
    attempt: {
      submittedAnswer: attempt.submitted_answer,
      isCorrect: attempt.is_correct,
      timeMs: attempt.time_ms,
    },
  }

  return json(response)
}
