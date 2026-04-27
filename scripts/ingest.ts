/**
 * Ingest: extract questions + difficulty scores from PSLE exam PDFs using Gemini Flash (free).
 *
 * Usage: npx tsx scripts/ingest.ts
 *
 * Replaces the old extract-questions.ts + curate-questions.ts pair.
 * Reads PDFs from data/papers/, processes pages sequentially,
 * and outputs one JSON per paper to data/extracted/.
 *
 * Free tier: 1,500 requests/day, 15 RPM — safe to rerun as many times as needed.
 * Get a free API key at https://aistudio.google.com/app/apikey
 * Add to .env: GOOGLE_AI_API_KEY=your_key_here
 *
 * Resumable: re-running picks up from the last successfully processed page.
 */

import 'dotenv/config'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { pdf } from 'pdf-to-img'
import { readdir, readFile, writeFile, mkdir } from 'fs/promises'
import { join, basename, extname } from 'path'

const PAPERS_DIR = join(process.cwd(), 'data/papers')
const OUTPUT_DIR = join(process.cwd(), 'data/extracted')

// Sequential with 5s between requests → 12 RPM (well under 15 RPM free limit)
const REQUEST_DELAY_MS = 5_000
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
  model: ReturnType<InstanceType<typeof GoogleGenerativeAI>['getGenerativeModel']>,
  base64: string,
): Promise<ExtractedQuestion[]> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent([
        { inlineData: { data: base64, mimeType: 'image/png' } },
        PROMPT,
      ])
      const text = result.response.text()
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      // Gemini sometimes returns an object wrapper; handle both [] and { questions: [] }
      const parsed = JSON.parse(cleaned)
      return Array.isArray(parsed) ? parsed : (parsed.questions ?? [])
    } catch (err: any) {
      const isRateLimit = err?.status === 429 || err?.message?.includes('429')
      if (isRateLimit && attempt < MAX_RETRIES) {
        const delay = attempt * 30_000
        process.stdout.write(` [rate limit, retry in ${delay / 1000}s]`)
        await new Promise((r) => setTimeout(r, delay))
      } else {
        throw err
      }
    }
  }
  return []
}

async function ingestPdf(
  model: ReturnType<InstanceType<typeof GoogleGenerativeAI>['getGenerativeModel']>,
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
      const questions = await extractPage(model, base64)
      allQuestions.push(...questions)
      console.log(` ${questions.length} questions`)
    } catch (err: any) {
      // Log and skip — do not crash the whole PDF over one bad page
      console.log(` SKIP (${err?.message?.split('\n')[0] ?? err})`)
    }

    // Always advance the resume pointer, even on error — a permanently broken page
    // should not block all subsequent pages on every re-run
    await writeFile(outPath, JSON.stringify({
      source, filename, questions: allQuestions,
      lastPageProcessed: pageNum,
      complete: false,
    }, null, 2))

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
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    console.error('Error: GOOGLE_AI_API_KEY is required.')
    console.error('Get a free key at https://aistudio.google.com/app/apikey')
    console.error('Then add to .env:  GOOGLE_AI_API_KEY=your_key_here')
    process.exit(1)
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  // No responseSchema — parse JSON from text to avoid silent empty arrays
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { temperature: 0 },
  })

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
    const result = await ingestPdf(model, join(PAPERS_DIR, file), outPath)

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
