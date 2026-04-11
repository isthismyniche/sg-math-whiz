import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SuspenseRevealProps {
  onComplete: () => void
  durationMs?: number
}

const phases = [
  'Checking your answer...',
  'Hmm, let me see...',
  'Almost there...',
]

export function SuspenseReveal({ onComplete, durationMs = 3500 }: SuspenseRevealProps) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const phaseInterval = durationMs / phases.length
    const timers: ReturnType<typeof setTimeout>[] = []

    for (let i = 1; i < phases.length; i++) {
      timers.push(setTimeout(() => setPhase(i), phaseInterval * i))
    }

    timers.push(setTimeout(onComplete, durationMs))

    return () => timers.forEach(clearTimeout)
  }, [onComplete, durationMs])

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Animated pencil/grading indicator */}
      <motion.div
        animate={{ rotate: [0, 10, -10, 5, -5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="text-5xl"
      >
        ✏️
      </motion.div>

      {/* Progress bar */}
      <div className="w-48 h-1.5 bg-bg-card rounded-full overflow-hidden">
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: durationMs / 1000, ease: 'linear' }}
          className="h-full bg-accent-amber rounded-full"
        />
      </div>

      {/* Phase text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className="text-text-secondary text-sm font-body"
        >
          {phases[phase]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
