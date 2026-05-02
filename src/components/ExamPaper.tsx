import { useState } from 'react'
import { motion } from 'framer-motion'

interface ExamPaperProps {
  questionNumber?: number
  questionText: string
  diagramUrl?: string | null
  source?: string | null
  onSubmit: (answer: number) => void
  disabled?: boolean
}

export function ExamPaper({
  questionNumber = 1,
  questionText,
  diagramUrl,
  source,
  onSubmit,
  disabled,
}: ExamPaperProps) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(value)
    if (isNaN(num)) return
    onSubmit(num)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      {/* Paper card */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2)',
        }}
      >
        {/* Paper surface */}
        <div className="bg-[#FFFEF9] px-6 pt-7 pb-6 sm:px-8">
          {/* Faint ruled lines background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.08]"
            style={{
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #4A90A4 31px, #4A90A4 32px)',
              backgroundPosition: '0 7px',
            }}
          />

          {/* Red margin line */}
          <div
            className="absolute top-0 bottom-0 left-10 sm:left-12 w-[1px] opacity-20 pointer-events-none"
            style={{ backgroundColor: '#E63946' }}
          />

          {/* Question content */}
          <div className="relative">
            {/* Question number + text */}
            <div className="flex gap-3 sm:gap-4">
              <span className="font-serif text-[#1a1a1a] font-bold text-lg leading-relaxed shrink-0 mt-[1px]">
                {questionNumber}.
              </span>
              <div className="font-serif text-[#1a1a1a] text-lg leading-relaxed text-justify">
                {questionText}
              </div>
            </div>

            {/* Diagram (if present) */}
            {diagramUrl && (
              <div className="mt-4 -mx-6 sm:-mx-8">
                <img
                  src={diagramUrl}
                  alt="Question diagram"
                  className="w-full"
                  style={{ maxHeight: '840px', objectFit: 'contain' }}
                />
              </div>
            )}

            {/* Answer line */}
            <form onSubmit={handleSubmit} className="mt-8 flex items-end gap-3">
              <span className="font-serif text-[#1a1a1a] font-bold text-lg shrink-0 pb-1">
                Ans:
              </span>
              <div className="flex-1 relative">
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  autoFocus
                  disabled={disabled}
                  placeholder="&nbsp;"
                  className="w-full bg-transparent border-b-2 border-[#1a1a1a]/30 px-1 pb-1 pt-0 font-serif text-[#1a1a1a] text-xl focus:outline-none focus:border-[#1a1a1a]/60 transition-colors disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </form>

            {/* Source footer */}
            {source && (
              <div className="mt-6 pt-3 border-t border-[#1a1a1a]/5">
                <p className="font-serif italic text-[#1a1a1a]/40 text-xs">
                  {source}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit button — outside the paper */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4"
      >
        <button
          onClick={handleSubmit as unknown as () => void}
          disabled={disabled || !value.trim()}
          className="w-full rounded-xl bg-accent-red py-4 px-4 font-body font-semibold text-lg text-text-primary transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit Answer
        </button>
      </motion.div>
    </motion.div>
  )
}
