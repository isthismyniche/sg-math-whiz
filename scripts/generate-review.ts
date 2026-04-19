/**
 * Step 3: Generate a TSV review file from curated questions.
 *
 * Usage: npx tsx scripts/generate-review.ts
 *
 * Reads curated questions from data/curated/curated-questions.json,
 * outputs a TSV file for PO review in data/review/.
 */

import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const CURATED_FILE = join(process.cwd(), 'data/curated/curated-questions.json')
const REVIEW_DIR = join(process.cwd(), 'data/review')
const OUTPUT_FILE = join(REVIEW_DIR, 'questions-for-review.tsv')

interface CuratedQuestion {
  number: number
  text: string
  topic: string
  source: string
  difficulty_score: number
  difficulty_reason: string
}

interface CuratedOutput {
  total_extracted: number
  cutoff_percent: number
  cutoff_score: number
  selected_count: number
  questions: CuratedQuestion[]
}

function escapeTsv(value: string): string {
  const cleaned = value.replace(/\t/g, ' ')
  if (cleaned.includes('\n') || cleaned.includes('"')) {
    return '"' + cleaned.replace(/"/g, '""') + '"'
  }
  return cleaned
}

async function main() {
  await mkdir(REVIEW_DIR, { recursive: true })

  let content: string
  try {
    content = await readFile(CURATED_FILE, 'utf-8')
  } catch {
    console.error(`Curated file not found: ${CURATED_FILE}`)
    console.error('Run curate-questions.ts first.')
    process.exit(1)
  }

  const curated: CuratedOutput = JSON.parse(content)

  const headers = [
    'source',
    'number',
    'question_text',
    'topic',
    'difficulty_score',
    'difficulty_reason',
    'correct_answer',
    'solution_explanation',
    'difficulty',
    'diagram_filename',
    'approved',
  ]

  const rows: string[] = [headers.join('\t')]

  for (const q of curated.questions) {
    const row = [
      escapeTsv(q.source),
      String(q.number),
      escapeTsv(q.text),
      escapeTsv(q.topic || ''),
      String(q.difficulty_score),
      escapeTsv(q.difficulty_reason || ''),
      '', // correct_answer — PO fills
      '', // solution_explanation — PO fills
      'hard', // difficulty — default, PO can change
      '', // diagram_filename — PO fills if question has a diagram (e.g. q21.png)
      '', // approved — PO fills Y/N
    ]
    rows.push(row.join('\t'))
  }

  await writeFile(OUTPUT_FILE, rows.join('\n'), 'utf-8')

  console.log(`Generated: ${OUTPUT_FILE}`)
  console.log(`Questions included: ${curated.questions.length} (top ${curated.cutoff_percent}%, score ≥ ${curated.cutoff_score})`)
  console.log(`\nOpen the TSV in Google Sheets or Excel to fill in answers and solutions.`)
  console.log(`Columns to fill: correct_answer, solution_explanation, approved (Y/N)`)
}

main().catch(console.error)
