import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabase } from '../_lib/supabase'
import { authenticateRequest } from '../_lib/auth'
import type { SolutionResponse } from '../../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = await authenticateRequest(req, res)
  if (!userId) return

  const questionId = req.query.id as string

  if (!questionId) {
    return res.status(400).json({ error: 'Question ID is required' })
  }

  const supabase = getSupabase()

  // Check that the user has attempted this question (prevent peeking)
  const { data: attempt } = await supabase
    .from('attempts')
    .select('submitted_answer, is_correct, time_ms')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .single()

  if (!attempt) {
    return res.status(403).json({
      error: 'You must attempt the question before viewing the solution',
    })
  }

  // Fetch the question with solution
  const { data: question, error: qErr } = await supabase
    .from('questions')
    .select(
      'id, question_text, date, correct_answer, solution_explanation, source, topic, diagram_url'
    )
    .eq('id', questionId)
    .single()

  if (qErr || !question) {
    return res.status(404).json({ error: 'Question not found' })
  }

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

  return res.json(response)
}
