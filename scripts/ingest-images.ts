/**
 * Image-based question ingestion.
 *
 * Usage: npx tsx scripts/ingest-images.ts
 *
 * Walks every image in data/pending-questions/, opens it in Preview, prompts for
 * topic / source / added context / correct answer / solution explanation, and on
 * approval uploads the image (with a UUID filename) to the question-diagrams
 * bucket and inserts a row into the questions table with date = NULL. The local
 * file is then moved to data/imported-questions/.
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { readFile, readdir, rename, mkdir } from 'fs/promises'
import { join, extname, basename } from 'path'
import { exec } from 'child_process'
import { randomUUID } from 'crypto'
import { createInterface } from 'readline/promises'
import { stdin, stdout } from 'process'

const PENDING_DIR = join(process.cwd(), 'data/pending-questions')
const IMPORTED_DIR = join(process.cwd(), 'data/imported-questions')
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

function openInPreview(filePath: string) {
  exec(`open ${JSON.stringify(filePath)}`, (err) => {
    if (err) console.warn(`  (Could not open Preview: ${err.message})`)
  })
}

async function main() {
  const supabase = getSupabase()
  await mkdir(IMPORTED_DIR, { recursive: true })

  let pending: string[]
  try {
    pending = (await readdir(PENDING_DIR))
      .filter((f) => MIME_TYPES[extname(f).toLowerCase()])
      .sort()
  } catch {
    console.error(`No pending folder at ${PENDING_DIR}. Create it and drop question images inside.`)
    process.exit(1)
  }

  if (pending.length === 0) {
    console.log('No pending images. Drop screenshots into data/pending-questions/ and re-run.')
    process.exit(0)
  }

  console.log(`Found ${pending.length} pending image(s):\n  ${pending.join('\n  ')}\n`)

  const rl = createInterface({ input: stdin, output: stdout })
  const ask = async (prompt: string) => (await rl.question(prompt)).trim()

  let imported = 0
  let skipped = 0

  for (let i = 0; i < pending.length; i++) {
    const filename = pending[i]
    const localPath = join(PENDING_DIR, filename)

    console.log(`\n[${i + 1}/${pending.length}] ${filename}`)
    openInPreview(localPath)

    const topic = await ask('  Topic (e.g. "Money", "Fractions & Ratios"): ')
    if (!topic) {
      console.log('  → Skipped (no topic).')
      skipped++
      continue
    }
    const source = await ask('  Source (optional): ')
    const addedContext = await ask('  Added context (optional, e.g. "Answer part b"): ')

    let correctAnswer: number | null = null
    while (correctAnswer === null) {
      const raw = await ask('  Correct answer (number, required): ')
      const parsed = parseFloat(raw)
      if (!Number.isFinite(parsed)) {
        console.log('    Not a valid number — try again.')
      } else {
        correctAnswer = parsed
      }
    }

    const solutionExplanation = await ask('  Solution explanation (optional): ')
    const approve = (await ask('  Approve & import? [Y/n]: ')).toLowerCase()
    if (approve === 'n' || approve === 'no') {
      console.log('  → Skipped.')
      skipped++
      continue
    }

    const ext = extname(filename).toLowerCase()
    const mimeType = MIME_TYPES[ext]
    const bucketName = `${randomUUID()}${ext}`

    process.stdout.write('  Uploading to bucket...')
    const buffer = await readFile(localPath)
    const { error: uploadErr } = await supabase.storage
      .from(DIAGRAM_BUCKET)
      .upload(bucketName, buffer, { contentType: mimeType, upsert: false })

    if (uploadErr) {
      console.log(` FAILED: ${uploadErr.message}`)
      skipped++
      continue
    }
    const { data: urlData } = supabase.storage.from(DIAGRAM_BUCKET).getPublicUrl(bucketName)
    const diagramUrl = urlData.publicUrl
    console.log(' ✓')

    process.stdout.write('  Inserting into questions table...')
    const { error: insertErr } = await supabase.from('questions').insert({
      date: null,
      question_text: addedContext || '',
      correct_answer: correctAnswer,
      solution_explanation: solutionExplanation || null,
      source: source || null,
      topic,
      difficulty: 'hard',
      diagram_url: diagramUrl,
    })

    if (insertErr) {
      console.log(` FAILED: ${insertErr.message}`)
      console.log('  Rolling back upload...')
      await supabase.storage.from(DIAGRAM_BUCKET).remove([bucketName])
      skipped++
      continue
    }
    console.log(' ✓')

    await rename(localPath, join(IMPORTED_DIR, filename))
    console.log(`  → Moved to data/imported-questions/${filename}`)
    imported++
  }

  rl.close()
  console.log(`\n=== Summary ===`)
  console.log(`Imported: ${imported}`)
  console.log(`Skipped:  ${skipped}`)
  if (imported > 0) {
    console.log('\nNext step: npx tsx scripts/schedule-questions.ts')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
