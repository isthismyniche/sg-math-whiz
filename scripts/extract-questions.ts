/**
 * Step 1: Extract questions from scanned PDF exam papers using Claude Vision.
 *
 * Usage: npx tsx scripts/extract-questions.ts
 *
 * Reads PDFs from data/papers/, sends each page to Claude as an image,
 * extracts questions and classifies them as text-only or diagram-dependent.
 * Outputs one JSON per paper in data/extracted/.
 */

import Anthropic from '@anthropic-ai/sdk'
import { pdf } from 'pdf-to-img'
import { readdir, readFile, writeFile, mkdir, access } from 'fs/promises'
import { join, basename, extname } from 'path'

const PAPERS_DIR = join(process.cwd(), 'data/papers')
const OUTPUT_DIR = join(process.cwd(), 'data/extracted')

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
  lastPageProcessed?: number
  complete?: boolean
}

const EXTRACTION_PROMPT = `You are extracting math questions from a scanned Singapore primary school (PSLE level) exam paper page.

For each question visible on this page, extract:
1. **number**: The question number as printed
2. **text**: The full question text, transcribed exactly. Include all parts (a, b, c) if present.
3. **topic**: Classify into one of: Fractions & Ratios, Percentages, Speed/Distance/Time, Geometry & Area, Number Patterns, Algebra, Whole Numbers, Data Analysis, Measurement, Money
4. **has_diagram**: true if the question requires a diagram/figure/table/graph to answer, false if it is fully self-contained as text
5. **notes**: If has_diagram is true, briefly describe what the diagram shows. Otherwise empty string.

Rules:
- If a question says "refer to the figure/diagram/table/graph" or cannot be understood without a visual, mark has_diagram: true
- For questions with tables of data embedded in text, try to reproduce the table data in the text field if possible, and mark has_diagram: false
- Multiple-choice questions: include all options in the text (A, B, C, D) but note these will likely be converted to open-ended format later
- If a page has no questions (e.g., it's a cover page or blank), return an empty array
- Transcribe numbers, units, and mathematical notation carefully

Respond with ONLY a JSON array of question objects, no markdown fencing:
[{"number": 1, "text": "...", "topic": "...", "has_diagram": false, "notes": ""}, ...]`

async function extractFromPdf(client: Anthropic, pdfPath: string, outPath: string): Promise<ExtractedPaper> {
  const filename = basename(pdfPath, extname(pdfPath))

  // Derive source name from filename
  const source = filename
    .replace(/-/g, ' ')
    .replace(/\bp(\d)/gi, 'Paper $1')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  // Resume: load existing partial results if present
  let allQuestions: ExtractedQuestion[] = []
  let resumeFromPage = 1

  try {
    const existing = JSON.parse(await readFile(outPath, 'utf-8')) as ExtractedPaper
    if (existing.complete) {
      console.log(`  Already complete — skipping`)
      return existing
    }
    allQuestions = existing.questions ?? []
    resumeFromPage = (existing.lastPageProcessed ?? 0) + 1
    console.log(`  Resuming from page ${resumeFromPage} (${allQuestions.length} questions already extracted)`)
  } catch {
    // No existing file — start fresh
  }

  let pageNum = 0
  const document = await pdf(pdfPath, { scale: 2 })

  for await (const pageImage of document) {
    pageNum++

    if (pageNum < resumeFromPage) continue

    process.stdout.write(`  Page ${pageNum}...`)

    const base64 = Buffer.from(pageImage).toString('base64')

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/png', data: base64 },
              },
              { type: 'text', text: EXTRACTION_PROMPT },
            ],
          },
        ],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const questions: ExtractedQuestion[] = JSON.parse(cleaned)

      console.log(` ${questions.length} questions found`)
      allQuestions.push(...questions)
    } catch (err) {
      console.log(` ERROR: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    // Save progress after every page
    const partial: ExtractedPaper = { source, filename, questions: allQuestions, lastPageProcessed: pageNum, complete: false }
    await writeFile(outPath, JSON.stringify(partial, null, 2))
  }

  // Deduplicate by question number
  const seen = new Set<number>()
  const deduped = allQuestions.filter((q) => {
    if (seen.has(q.number)) return false
    seen.add(q.number)
    return true
  })

  return { source, filename, questions: deduped, lastPageProcessed: pageNum, complete: true }
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required')
    console.error('Set it with: export ANTHROPIC_API_KEY=your-key-here')
    process.exit(1)
  }

  const client = new Anthropic({ apiKey })

  await mkdir(OUTPUT_DIR, { recursive: true })

  // Find all PDFs
  const files = (await readdir(PAPERS_DIR)).filter((f) => f.toLowerCase().endsWith('.pdf'))

  if (files.length === 0) {
    console.log('No PDFs found in data/papers/. Add your exam papers there and re-run.')
    process.exit(0)
  }

  console.log(`Found ${files.length} PDF(s) in data/papers/`)

  let totalQuestions = 0
  let textOnly = 0
  let diagramSkipped = 0

  for (const file of files) {
    console.log(`\nProcessing: ${basename(file, extname(file))}`)
    const outPath = join(OUTPUT_DIR, `${basename(file, extname(file))}.json`)
    const result = await extractFromPdf(client, join(PAPERS_DIR, file), outPath)

    await writeFile(outPath, JSON.stringify({ ...result, complete: true }, null, 2))

    const text = result.questions.filter((q) => !q.has_diagram).length
    const diagram = result.questions.filter((q) => q.has_diagram).length

    totalQuestions += result.questions.length
    textOnly += text
    diagramSkipped += diagram

    console.log(`  → ${result.questions.length} total, ${text} text-only, ${diagram} diagram-dependent`)
    console.log(`  → Saved to ${outPath}`)
  }

  console.log(`\n=== Summary ===`)
  console.log(`Total questions extracted: ${totalQuestions}`)
  console.log(`Text-only (usable): ${textOnly}`)
  console.log(`Diagram-dependent (skipped): ${diagramSkipped}`)
}

main().catch(console.error)
