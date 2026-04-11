import { getSupabase } from './_lib/supabase'
import type { RegisterRequest } from '../src/types'

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const body = (await request.json()) as RegisterRequest

  if (!body.userId || !body.displayName?.trim()) {
    return Response.json(
      { error: 'userId and displayName are required' },
      { status: 400 }
    )
  }

  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('users')
    .upsert(
      { id: body.userId, display_name: body.displayName.trim() },
      { onConflict: 'id' }
    )
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ id: data.id, displayName: data.display_name })
}
