import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SuspenseRevealProps {
  onComplete: () => void
  durationMs?: number
}

const phases = [
  'Marking your work...',
  'Comparing with today\'s solvers...',
  'And the verdict is...',
]

export function SuspenseReveal({ onComplete, durationMs = 2200 }: SuspenseRevealProps) {
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
    <div className="flex flex-col items-center gap-6 py-12">
      {/* Animated grading dots */}
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
            className="w-3 h-3 rounded-full bg-accent-amber"
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-48 h-1.5 bg-bg-card rounded-full overflow-hidden">
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: durationMs / 1000, ease: 'linear' }}
          className="h-full bg-accent-amber rounded-full"
          style={{
            boxShadow: '0 0 8px var(--color-accent-amber)',
          }}
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
