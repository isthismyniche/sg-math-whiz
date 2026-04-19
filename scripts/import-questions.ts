/**
 * Step 3: Import reviewed questions into Supabase.
 *
 * Usage: npx tsx scripts/import-questions.ts
 *
 * Reads the reviewed TSV from data/review/questions-for-review.tsv,
 * filters to approved rows, validates, and inserts into the questions table.
 * Questions are inserted with date = NULL (unscheduled).
 */

import { createClient } from '@supabase/supabase-js'
import { readFile } from 'fs/promises'
import { join, extname } from 'path'

const REVIEW_FILE = join(process.cwd(), 'data/review/questions-for-review.tsv')
const DIAGRAMS_DIR = join(process.cwd(), 'data/diagrams')
const DIAGRAM_BUCKET = 'question-diagrams'

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
}

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env')
    process.exit(1)
  }
  return createClient(url, key)
}

// Split raw TSV content into rows, respecting quoted fields that may contain newlines
function splitTsvRows(content: string): string[] {
  const rows: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    if (inQuotes) {
      if (char === '"' && content[i + 1] === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
        current += char
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
        current += char
      } else if (char === '\n') {
        if (current.trim()) rows.push(current)
        current = ''
      } else {
        current += char
      }
    }
  }
  if (current.trim()) rows.push(current)
  return rows
}

function parseTsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"'
        i++ // skip escaped quote
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === '\t') {
        fields.push(current)
        current = ''
      } else {
        current += char
      }
    }
  }
  fields.push(current)
  return fields
}

async function uploadDiagram(
  supabase: ReturnType<typeof createClient>,
  filename: string
): Promise<string | null> {
  const filePath = join(DIAGRAMS_DIR, filename)
  const ext = extname(filename).toLowerCase()
  const mimeType = MIME_TYPES[ext]

  if (!mimeType) {
    console.warn(`    Diagram: unsupported file type "${ext}" — skipping upload`)
    return null
  }

  let fileBuffer: Buffer
  try {
    fileBuffer = await readFile(filePath)
  } catch {
    console.warn(`    Diagram: file not found at data/diagrams/${filename} — skipping upload`)
    return null
  }

  const { error } = await supabase.storage
    .from(DIAGRAM_BUCKET)
    .upload(filename, fileBuffer, { contentType: mimeType, upsert: true })

  if (error) {
    console.warn(`    Diagram: upload failed — ${error.message}`)
    return null
  }

  const { data } = supabase.storage.from(DIAGRAM_BUCKET).getPublicUrl(filename)
  return data.publicUrl
}

async function main() {
  // Load .env
  const dotenv = await import('dotenv')
  dotenv.config()

  const supabase = getSupabase()

  let content: string
  try {
    content = await readFile(REVIEW_FILE, 'utf-8')
  } catch {
    console.error(`Review file not found: ${REVIEW_FILE}`)
    console.error('Run generate-review.ts first, then fill in the TSV.')
    process.exit(1)
  }
  const lines = splitTsvRows(content)

  if (lines.length < 2) {
    console.log('No data rows found in TSV.')
    process.exit(0)
  }

  const headers = parseTsvLine(lines[0])
  const colIdx = Object.fromEntries(headers.map((h, i) => [h.trim(), i]))

  let imported = 0
  let skipped = 0
  let errors = 0

  for (let i = 1; i < lines.length; i++) {
    const fields = parseTsvLine(lines[i])
    const get = (col: string) => (fields[colIdx[col]] ?? '').trim()

    const approved = get('approved').toUpperCase()
    if (approved !== 'Y' && approved !== 'YES') {
      skipped++
      continue
    }

    const questionText = get('question_text')
    const correctAnswer = get('correct_answer')
    const source = get('source')
    const topic = get('topic')
    const difficulty = get('difficulty') || 'hard'
    const solutionExplanation = get('solution_explanation') || null
    const diagramFilename = get('diagram_filename') || null

    // Validate
    if (!questionText) {
      console.warn(`Row ${i + 1}: Empty question text — skipping`)
      errors++
      continue
    }

    const answerNum = parseFloat(correctAnswer)
    if (isNaN(answerNum)) {
      console.warn(`Row ${i + 1}: Invalid answer "${correctAnswer}" — skipping`)
      errors++
      continue
    }

    // Check for duplicate (same question text)
    const { data: existing } = await supabase
      .from('questions')
      .select('id')
      .eq('question_text', questionText)
      .limit(1)

    if (existing && existing.length > 0) {
      console.warn(`Row ${i + 1}: Duplicate question — skipping`)
      skipped++
      continue
    }

    // Upload diagram if provided
    let diagramUrl: string | null = null
    if (diagramFilename) {
      process.stdout.write(`    Diagram: uploading ${diagramFilename}...`)
      diagramUrl = await uploadDiagram(supabase, diagramFilename)
      console.log(diagramUrl ? ` done` : ` skipped`)
    }

    // Insert with date = NULL (unscheduled)
    const { error: insertErr } = await supabase.from('questions').insert({
      date: null,
      question_text: questionText,
      correct_answer: answerNum,
      solution_explanation: solutionExplanation,
      source: source || null,
      topic: topic || null,
      difficulty,
      diagram_url: diagramUrl,
    })

    if (insertErr) {
      console.warn(`Row ${i + 1}: Insert failed — ${insertErr.message}`)
      errors++
    } else {
      imported++
    }
  }

  console.log(`\n=== Import Summary ===`)
  console.log(`Imported: ${imported}`)
  console.log(`Skipped (not approved or duplicate): ${skipped}`)
  console.log(`Errors: ${errors}`)
}

main().catch(console.error)
