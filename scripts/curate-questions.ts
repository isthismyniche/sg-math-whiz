/**
 * Step 2: Curate extracted questions for difficulty.
 *
 * Usage: npx tsx scripts/curate-questions.ts
 *
 * Reads all extracted JSON from data/extracted/, filters to text-only questions,
 * sends them to Claude in batches to rank difficulty (1-10), then keeps only
 * the top 5% most challenging questions.
 *
 * Outputs curated JSON to data/curated/.
 */

import Anthropic from '@anthropic-ai/sdk'
import { readdir, readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const EXTRACTED_DIR = join(process.cwd(), 'data/extracted')
const CURATED_DIR = join(process.cwd(), 'data/curated')

// How many questions to send per Claude batch (keep under context limits)
const BATCH_SIZE = 20
// Top percentage to keep (adjusted for small batches — reset to 5 when volume is higher)
const TOP_PERCENT = 25

interface ExtractedQuestion {
  number: number
  text: string
  topic: string
  has_diagram: boolean
  notes: string
}

interface ExtractedPaper {
  source: string
  filename: string
  questions: ExtractedQuestion[]
}

interface ScoredQuestion extends ExtractedQuestion {
  source: string
  difficulty_score: number
  difficulty_reason: string
}

const RANKING_PROMPT = `You are a question difficulty ranker for a math challenge app targeting adults aged 25-55. The questions come from Singapore PSLE (Primary 6) exams.

Rate each question's difficulty on a scale of 1-10, where:
- 1-3: Routine arithmetic, most adults solve instantly
- 4-5: Requires some thought but straightforward method
- 6-7: Multi-step, easy to make mistakes, requires careful reasoning
- 8-9: Genuinely tricky — involves insight, unusual framing, or multiple concepts combined
- 10: Would stump most adults despite being "primary school" level

We want questions that would make an adult pause and think — the kind where you know it's a primary school question but you're not immediately sure of the answer.

For each question, respond with:
- difficulty_score (integer 1-10)
- difficulty_reason (one sentence explaining why)

Respond with ONLY a JSON array matching the input order:
[{"index": 0, "difficulty_score": 7, "difficulty_reason": "Multi-step percentage problem with a common trap"}, ...]`

async function rankBatch(
  client: Anthropic,
  questions: { index: number; text: string; topic: string }[]
): Promise<{ index: number; difficulty_score: number; difficulty_reason: string }[]> {
  const questionsText = questions
    .map((q, i) => `[${i}] (${q.topic}) ${q.text}`)
    .join('\n\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `${RANKING_PROMPT}\n\nQuestions to rank:\n\n${questionsText}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned)
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required')
    process.exit(1)
  }

  const client = new Anthropic({ apiKey })
  await mkdir(CURATED_DIR, { recursive: true })

  // Load all extracted questions
  const files = (await readdir(EXTRACTED_DIR)).filter((f) => f.endsWith('.json'))
  if (files.length === 0) {
    console.log('No extracted JSON files found. Run extract-questions.ts first.')
    process.exit(0)
  }

  // Collect all text-only questions with source tracking
  const allQuestions: { source: string; question: ExtractedQuestion }[] = []

  for (const file of files.sort()) {
    const content = await readFile(join(EXTRACTED_DIR, file), 'utf-8')
    const paper: ExtractedPaper = JSON.parse(content)

    for (const q of paper.questions) {
      if (!q.has_diagram) {
        allQuestions.push({ source: paper.source, question: q })
      }
    }
  }

  console.log(`Found ${allQuestions.length} text-only questions across ${files.length} papers`)
  console.log(`Ranking difficulty in batches of ${BATCH_SIZE}...\n`)

  // Rank in batches
  const scored: ScoredQuestion[] = []

  for (let i = 0; i < allQuestions.length; i += BATCH_SIZE) {
    const batch = allQuestions.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(allQuestions.length / BATCH_SIZE)
    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} questions)...`)

    try {
      const rankings = await rankBatch(
        client,
        batch.map((b, idx) => ({ index: idx, text: b.question.text, topic: b.question.topic }))
      )

      for (const r of rankings) {
        const original = batch[r.index]
        if (original) {
          scored.push({
            ...original.question,
            source: original.source,
            difficulty_score: r.difficulty_score,
            difficulty_reason: r.difficulty_reason,
          })
        }
      }
      console.log(` done`)
    } catch (err) {
      console.log(` ERROR: ${err instanceof Error ? err.message : 'Unknown'}`)
      // Still include unranked questions with score 0 so they're not lost
      for (const b of batch) {
        scored.push({
          ...b.question,
          source: b.source,
          difficulty_score: 0,
          difficulty_reason: 'Ranking failed',
        })
      }
    }
  }

  // Sort by difficulty descending
  scored.sort((a, b) => b.difficulty_score - a.difficulty_score)

  // Keep top 5%
  const cutoff = Math.max(1, Math.ceil(scored.length * (TOP_PERCENT / 100)))
  const selected = scored.slice(0, cutoff)
  const minScore = selected[selected.length - 1]?.difficulty_score ?? 0

  // Show distribution
  console.log(`\n=== Difficulty Distribution ===`)
  for (let s = 10; s >= 1; s--) {
    const count = scored.filter((q) => q.difficulty_score === s).length
    const bar = '█'.repeat(Math.ceil(count / 2))
    const marker = s >= minScore ? ' ← cutoff' : ''
    console.log(`  ${s.toString().padStart(2)}: ${count.toString().padStart(3)} ${bar}${marker}`)
  }
  if (scored.some((q) => q.difficulty_score === 0)) {
    console.log(`   0: ${scored.filter((q) => q.difficulty_score === 0).length} (ranking failed)`)
  }

  console.log(`\n=== Selection ===`)
  console.log(`Total text-only questions: ${scored.length}`)
  console.log(`Top ${TOP_PERCENT}% cutoff: ${cutoff} questions (score ≥ ${minScore})`)
  console.log(`Selected: ${selected.length}`)

  // Save curated output
  const output = {
    total_extracted: allQuestions.length,
    cutoff_percent: TOP_PERCENT,
    cutoff_score: minScore,
    selected_count: selected.length,
    questions: selected,
  }

  const outPath = join(CURATED_DIR, 'curated-questions.json')
  await writeFile(outPath, JSON.stringify(output, null, 2))
  console.log(`\nSaved to: ${outPath}`)

  // Preview top picks
  console.log(`\n=== Top 5 Picks ===`)
  for (const q of selected.slice(0, 5)) {
    console.log(`  [${q.difficulty_score}/10] (${q.topic}) ${q.text.substring(0, 80)}...`)
    console.log(`    Why: ${q.difficulty_reason}`)
    console.log()
  }
}

main().catch(console.error)
