/**
 * Generate a TSV review file from extracted questions.
 *
 * Usage: npx tsx scripts/generate-review.ts
 *
 * Reads all data/extracted/*.json files (output of ingest.ts),
 * combines text-only questions sorted by difficulty, and outputs
 * data/review/questions-for-review.tsv for PO review.
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const EXTRACTED_DIR = join(process.cwd(), 'data/extracted')
const REVIEW_DIR = join(process.cwd(), 'data/review')
const OUTPUT_FILE = join(REVIEW_DIR, 'questions-for-review.tsv')

interface ExtractedQuestion {
  number: number
  text: string
  topic: string
  has_diagram: boolean
  difficulty_score: number
  difficulty_reason: string
}

interface ExtractedPaper {
  source: string
  questions: ExtractedQuestion[]
}

function escapeTsv(value: string): string {
  const cleaned = String(value).replace(/\t/g, ' ')
  if (cleaned.includes('\n') || cleaned.includes('"')) {
    return '"' + cleaned.replace(/"/g, '""') + '"'
  }
  return cleaned
}

async function main() {
  await mkdir(REVIEW_DIR, { recursive: true })

  let files: string[]
  try {
    files = (await readdir(EXTRACTED_DIR)).filter((f) => f.endsWith('.json'))
  } catch {
    console.error(`Extracted directory not found: ${EXTRACTED_DIR}`)
    console.error('Run ingest.ts first.')
    process.exit(1)
  }

  if (files.length === 0) {
    console.error('No extracted JSON files found. Run ingest.ts first.')
    process.exit(1)
  }

  // Combine all text-only questions from all papers
  const allQuestions: Array<ExtractedQuestion & { source: string }> = []

  for (const file of files) {
    const paper: ExtractedPaper = JSON.parse(
      await readFile(join(EXTRACTED_DIR, file), 'utf-8')
    )
    const textOnly = (paper.questions ?? []).filter((q) => !q.has_diagram)
    for (const q of textOnly) {
      allQuestions.push({ ...q, source: paper.source })
    }
  }

  // Sort by difficulty descending so hardest (most interesting) questions appear first
  allQuestions.sort((a, b) => (b.difficulty_score ?? 0) - (a.difficulty_score ?? 0))

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

  for (const q of allQuestions) {
    rows.push([
      escapeTsv(q.source),
      String(q.number),
      escapeTsv(q.text),
      escapeTsv(q.topic ?? ''),
      String(q.difficulty_score ?? ''),
      escapeTsv(q.difficulty_reason ?? ''),
      '',   // correct_answer — PO fills
      '',   // solution_explanation — PO fills
      'hard', // difficulty — default, PO can change
      '',   // diagram_filename — PO fills if needed
      '',   // approved — PO fills Y/N
    ].join('\t'))
  }

  await writeFile(OUTPUT_FILE, rows.join('\n'), 'utf-8')

  console.log(`Generated: ${OUTPUT_FILE}`)
  console.log(`Questions: ${allQuestions.length} text-only (from ${files.length} paper(s)), sorted hardest first`)
  console.log('\nOpen in Google Sheets or Excel.')
  console.log('Fill in: correct_answer, solution_explanation, approved (Y/N)')
  console.log('Next step: npx tsx scripts/import-questions.ts')
}

main().catch(console.error)
