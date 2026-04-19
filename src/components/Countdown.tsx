import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface CountdownProps {
  quote: string
  onComplete: () => void
}

export function Countdown({ quote, onComplete }: CountdownProps) {
  const [count, setCount] = useState(3)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (count === 0) {
      onCompleteRef.current()
      return
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count])

  return (
    <div className="flex flex-col items-center justify-center gap-10 py-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ opacity: 0, scale: 1.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-9xl text-accent-amber leading-none"
        >
          {count}
        </motion.div>
      </AnimatePresence>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-text-secondary text-base text-center max-w-xs italic leading-relaxed px-4"
      >
        {quote}
      </motion.p>
    </div>
  )
}
