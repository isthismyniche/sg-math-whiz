import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabase } from './_lib/supabase.js'
import { authenticateRequest } from './_lib/auth.js'
import { getTodaySGT } from './_lib/dates.js'
import type { PastQuestion } from '../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const userId = await authenticateRequest(req, res)
  if (!userId) return

  const supabase = getSupabase()
  const today = getTodaySGT()

  // Fetch all questions before today, newest first
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, date, topic')
    .lt('date', today)
    .order('date', { ascending: false })
    .limit(100)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  if (!questions || questions.length === 0) {
    return res.json([])
  }

  // Check which questions the user has attempted
  const questionIds = questions.map((q) => q.id)
  const { data: attempts } = await supabase
    .from('attempts')
    .select('question_id')
    .eq('user_id', userId)
    .in('question_id', questionIds)

  const attemptedSet = new Set(attempts?.map((a) => a.question_id) ?? [])

  const result: PastQuestion[] = questions.map((q) => ({
    date: q.date,
    topic: q.topic,
    attempted: attemptedSet.has(q.id),
  }))

  return res.json(result)
}
