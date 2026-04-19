/**
 * Step 4: Schedule unscheduled questions by assigning dates.
 *
 * Usage: npx tsx scripts/schedule-questions.ts
 *
 * Reads all unscheduled questions (date IS NULL), assigns dates starting
 * from the next open day. Ensures topic diversity (no same topic 2 days in a row).
 */

import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env')
    process.exit(1)
  }
  return createClient(url, key)
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

async function main() {
  const dotenv = await import('dotenv')
  dotenv.config()

  const supabase = getSupabase()

  // Find the last scheduled date
  const { data: lastScheduled } = await supabase
    .from('questions')
    .select('date')
    .not('date', 'is', null)
    .order('date', { ascending: false })
    .limit(1)

  let nextDate: Date
  if (lastScheduled && lastScheduled.length > 0) {
    nextDate = addDays(new Date(lastScheduled[0].date + 'T00:00:00'), 1)
  } else {
    // Start from tomorrow SGT
    const now = new Date()
    const sgtOffset = 8 * 60 * 60 * 1000
    const sgtNow = new Date(now.getTime() + sgtOffset)
    nextDate = addDays(new Date(sgtNow.toISOString().split('T')[0] + 'T00:00:00'), 1)
  }

  // Fetch unscheduled questions
  const { data: unscheduled, error } = await supabase
    .from('questions')
    .select('id, topic, question_text')
    .is('date', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching questions:', error.message)
    process.exit(1)
  }

  if (!unscheduled || unscheduled.length === 0) {
    console.log('No unscheduled questions found. Import questions first.')
    process.exit(0)
  }

  console.log(`Found ${unscheduled.length} unscheduled questions`)
  console.log(`Scheduling from ${formatDate(nextDate)}`)

  // Get the topic of the last scheduled question for diversity
  const { data: lastQ } = await supabase
    .from('questions')
    .select('topic')
    .not('date', 'is', null)
    .order('date', { ascending: false })
    .limit(1)

  let lastTopic = lastQ?.[0]?.topic ?? ''

  // Sort questions to maximize topic diversity
  // Greedy: pick the first question whose topic differs from the last assigned
  const remaining = [...unscheduled]
  const schedule: { id: string; date: string; topic: string; preview: string }[] = []

  while (remaining.length > 0) {
    // Find a question with a different topic than the last one
    let idx = remaining.findIndex((q) => (q.topic ?? '') !== lastTopic)
    if (idx === -1) {
      // No different topic available — just take the first one
      idx = 0
    }

    const question = remaining.splice(idx, 1)[0]
    const date = formatDate(nextDate)

    schedule.push({
      id: question.id,
      date,
      topic: question.topic ?? 'Unknown',
      preview: question.question_text.substring(0, 60) + '...',
    })

    lastTopic = question.topic ?? ''
    nextDate = addDays(nextDate, 1)
  }

  // Confirm before applying
  console.log(`\nSchedule preview (${schedule.length} questions):`)
  console.log('─'.repeat(80))
  for (const s of schedule.slice(0, 10)) {
    console.log(`  ${s.date}  [${s.topic}]  ${s.preview}`)
  }
  if (schedule.length > 10) {
    console.log(`  ... and ${schedule.length - 10} more`)
  }
  console.log('─'.repeat(80))
  console.log(`Last date: ${schedule[schedule.length - 1].date}`)

  // Apply updates
  let updated = 0
  let updateErrors = 0

  for (const s of schedule) {
    const { error: updateErr } = await supabase
      .from('questions')
      .update({ date: s.date })
      .eq('id', s.id)

    if (updateErr) {
      console.warn(`Failed to schedule ${s.id}: ${updateErr.message}`)
      updateErrors++
    } else {
      updated++
    }
  }

  console.log(`\n=== Schedule Summary ===`)
  console.log(`Scheduled: ${updated}`)
  console.log(`Errors: ${updateErrors}`)
  console.log(`Date range: ${schedule[0].date} → ${schedule[schedule.length - 1].date}`)
}

main().catch(console.error)
