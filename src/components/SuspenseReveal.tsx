import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { suspensePhrases } from '../lib/quotes'

interface SuspenseRevealProps {
  onComplete: () => void
  durationMs?: number
  apiReady?: boolean
}

export function SuspenseReveal({ onComplete, durationMs = 1800, apiReady = false }: SuspenseRevealProps) {
  const phrase = useRef(suspensePhrases[Math.floor(Math.random() * suspensePhrases.length)])
  const [timerDone, setTimerDone] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Main suspense timer
  useEffect(() => {
    timerRef.current = setTimeout(() => setTimerDone(true), durationMs)
    return () => clearTimeout(timerRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // When both timer and API are done, fire completion
  useEffect(() => {
    if (timerDone && apiReady) {
      onComplete()
    }
  }, [timerDone, apiReady, onComplete])

  const waiting = timerDone && !apiReady

  return (
    <div className="flex flex-col items-center gap-6 py-16">
      {/* Pulsing dots */}
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
        {waiting ? (
          // Indeterminate shimmer when waiting for API
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            className="h-full w-1/3 bg-accent-amber rounded-full"
            style={{ boxShadow: '0 0 8px var(--color-accent-amber)' }}
          />
        ) : (
          // Theatrical fill to 85%
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '85%' }}
            transition={{ duration: durationMs / 1000, ease: [0.4, 0, 0.2, 1] }}
            className="h-full bg-accent-amber rounded-full"
            style={{ boxShadow: '0 0 8px var(--color-accent-amber)' }}
          />
        )}
      </div>

      {/* Phrase */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-text-secondary text-base font-body"
      >
        {waiting ? 'Almost there...' : phrase.current}
      </motion.p>
    </div>
  )
}
