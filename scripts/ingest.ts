/**
 * Ingest: extract questions + difficulty scores from PSLE exam PDFs using Claude Haiku.
 *
 * Usage: npx tsx scripts/ingest.ts
 *
 * Replaces the old extract-questions.ts + curate-questions.ts pair.
 * Reads PDFs from data/papers/, processes pages sequentially,
 * and outputs one JSON per paper to data/extracted/.
 *
 * Resumable: re-running picks up from the last successfully processed page.
 * Requires: ANTHROPIC_API_KEY in .env
 */

import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { pdf } from 'pdf-to-img'
import { readdir, readFile, writeFile, mkdir } from 'fs/promises'
import { join, basename, extname } from 'path'

const PAPERS_DIR = join(process.cwd(), 'data/papers')
const OUTPUT_DIR = join(process.cwd(), 'data/extracted')

// 3s between requests → ~20 RPM, well within Claude Haiku tier-1 limits
const REQUEST_DELAY_MS = 3_000
const MAX_RETRIES = 3

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
  filename: string
  questions: ExtractedQuestion[]
  lastPageProcessed?: number
  complete?: boolean
}

const PROMPT = `You are extracting math questions from a Singapore Primary 6 (PSLE) exam paper page. This may be a compiled PDF with multiple schools' papers — question numbers often reset to 1 for each new school's paper.

Carefully examine this page and extract EVERY numbered math question visible. Do not skip any.

For each question:
1. Record the question number exactly as shown (integer only)
2. Transcribe the COMPLETE question text — every word, number, fraction, unit, and sub-part (a, b, c)
3. Classify the topic from: Fractions & Ratios | Percentages | Speed Distance & Time | Geometry & Measurement | Number Patterns | Algebra | Whole Numbers | Data Analysis | Area & Volume | Money
4. Set has_diagram to true ONLY if the question requires a drawn geometric figure, chart, or diagram that appears on the page as an image — NOT for questions that are fully self-contained as text (even if they mention shapes)
5. Score difficulty 1–10 for a typical adult attempting PSLE math:
   - 1–3: direct one-step calculation
   - 4–5: two steps, familiar structure
   - 6–7: multi-step, requires planning ahead
   - 8–9: genuinely tricky, common adult trap (e.g. "fraction of remaining", multi-stage ratio)
   - 10: would stump most adults
6. Give a one-sentence difficulty reason

If the page has no questions (cover page, instructions, blank, answer sheet), return an empty array.

Respond with ONLY a JSON array, no markdown fencing:
[{"number": 1, "text": "...", "topic": "...", "has_diagram": false, "difficulty_score": 7, "difficulty_reason": "..."}, ...]`

async function extractPage(
  client: Anthropic,
  base64: string,
): Promise<ExtractedQuestion[]> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64 } },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
      })
      const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return JSON.parse(cleaned) as ExtractedQuestion[]
    } catch (err: any) {
      const isOverload = err?.status === 529 || err?.message?.includes('overloaded')
      const isRateLimit = err?.status === 429 || err?.message?.includes('429')
      if ((isOverload || isRateLimit) && attempt < MAX_RETRIES) {
        const delay = attempt * 30_000
        process.stdout.write(` [retry in ${delay / 1000}s]`)
        await new Promise((r) => setTimeout(r, delay))
      } else {
        throw err
      }
    }
  }
  return []
}

async function ingestPdf(
  client: Anthropic,
  pdfPath: string,
  outPath: string,
): Promise<ExtractedPaper> {
  const filename = basename(pdfPath, extname(pdfPath))
  const source = filename.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

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
    console.log(`  Resuming from page ${resumeFromPage} (${allQuestions.length} questions so far)`)
  } catch { /* fresh start */ }

  let pageNum = 0
  const document = await pdf(pdfPath, { scale: 2 })

  for await (const pageImage of document) {
    pageNum++
    if (pageNum < resumeFromPage) continue

    process.stdout.write(`  Page ${pageNum}...`)
    const base64 = Buffer.from(pageImage).toString('base64')

    try {
      const questions = await extractPage(client, base64)
      allQuestions.push(...questions)
      console.log(` ${questions.length} questions`)

      // Only advance the resume pointer on success
      await writeFile(outPath, JSON.stringify({
        source, filename, questions: allQuestions,
        lastPageProcessed: pageNum,
        complete: false,
      }, null, 2))
    } catch (err: any) {
      console.log(` ERROR: ${err?.message?.split('\n')[0] ?? err}`)
      // Do not advance lastPageProcessed — this page will be retried on next run
    }

    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS))
  }

  // Deduplicate by text prefix — multi-school compilations reuse question numbers
  // (each school resets to Q1), so number alone is a bad key. Text-based dedup
  // keeps unique questions from different schools while still collapsing a question
  // that spans two pages (we keep the longer/more-complete captured version).
  const seen = new Map<string, ExtractedQuestion>()
  for (const q of allQuestions) {
    const key = q.text.trim().slice(0, 60)
    const existing = seen.get(key)
    if (!existing || q.text.length > existing.text.length) seen.set(key, q)
  }
  const deduped = Array.from(seen.values()).sort((a, b) => a.number - b.number)

  return { source, filename, questions: deduped, lastPageProcessed: pageNum, complete: true }
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY is required in .env')
    process.exit(1)
  }

  const client = new Anthropic({ apiKey })
  await mkdir(OUTPUT_DIR, { recursive: true })

  const files = (await readdir(PAPERS_DIR)).filter((f) => f.toLowerCase().endsWith('.pdf'))
  if (files.length === 0) {
    console.log('No PDFs found in data/papers/. Add exam papers there and re-run.')
    process.exit(0)
  }

  console.log(`Found ${files.length} PDF(s) in data/papers/`)
  console.log(`Processing 1 page at a time with ${REQUEST_DELAY_MS / 1000}s gap\n`)

  let totalQ = 0, textOnly = 0, withDiagram = 0

  for (const file of files) {
    console.log(`Processing: ${basename(file, extname(file))}`)
    const outPath = join(OUTPUT_DIR, `${basename(file, extname(file))}.json`)
    const result = await ingestPdf(client, join(PAPERS_DIR, file), outPath)

    await writeFile(outPath, JSON.stringify({ ...result, complete: true }, null, 2))

    const text = result.questions.filter((q) => !q.has_diagram).length
    const diag = result.questions.filter((q) => q.has_diagram).length
    totalQ += result.questions.length
    textOnly += text
    withDiagram += diag

    console.log(`  → ${result.questions.length} total | ${text} text-only | ${diag} with diagram\n`)
  }

  console.log('=== Summary ===')
  console.log(`Total extracted: ${totalQ} | Text-only: ${textOnly} | With diagram: ${withDiagram}`)
  console.log('\nNext step: npx tsx scripts/generate-review.ts')
}

main().catch(console.error)
