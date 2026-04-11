import { getSupabase } from '../_lib/supabase'
import { authenticateRequest } from '../_lib/auth'
import type { SolutionResponse } from '../../src/types'

export default async function handler(request: Request) {
  if (request.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const auth = await authenticateRequest(request)
  if ('error' in auth) return auth.error

  // Extract question ID from URL path
  const url = new URL(request.url)
  const segments = url.pathname.split('/')
  const questionId = segments[segments.length - 1]

  if (!questionId) {
    return Response.json({ error: 'Question ID is required' }, { status: 400 })
  }

  const supabase = getSupabase()

  // Check that the user has attempted this question (prevent peeking)
  const { data: attempt } = await supabase
    .from('attempts')
    .select('submitted_answer, is_correct, time_ms')
    .eq('user_id', auth.userId)
    .eq('question_id', questionId)
    .single()

  if (!attempt) {
    return Response.json(
      { error: 'You must attempt the question before viewing the solution' },
      { status: 403 }
    )
  }

  // Fetch the question with solution
  const { data: question, error: qErr } = await supabase
    .from('questions')
    .select(
      'id, question_text, date, correct_answer, solution_explanation, source, topic'
    )
    .eq('id', questionId)
    .single()

  if (qErr || !question) {
    return Response.json({ error: 'Question not found' }, { status: 404 })
  }

  const response: SolutionResponse = {
    questionId: question.id,
    questionText: question.question_text,
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

  return Response.json(response)
}
