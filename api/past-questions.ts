import { getSupabase } from './_lib/supabase.js'
import { authenticateRequest } from './_lib/auth.js'
import { getTodaySGT } from './_lib/dates.js'
import { json } from './_lib/response.js'
import type { PastQuestion } from '../src/types'

export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)

  const auth = await authenticateRequest(req)
  if (auth instanceof Response) return auth
  const userId = auth

  const supabase = getSupabase()
  const today = getTodaySGT()

  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, date, topic')
    .lt('date', today)
    .order('date', { ascending: false })
    .limit(100)

  if (error) return json({ error: error.message }, 500)
  if (!questions || questions.length === 0) return json([])

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

  return json(result)
}
