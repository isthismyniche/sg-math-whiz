import { motion } from 'framer-motion'
import { Flame, Star } from 'lucide-react'

interface StreakBadgeProps {
  current: number
  best: number
}

export function StreakBadge({ current, best }: StreakBadgeProps) {
  return (
    <div className="flex items-center gap-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 160, damping: 14 }}
        className="flex items-center gap-2 bg-bg-card rounded-xl px-4 py-2"
      >
        <Flame className="w-7 h-7 text-streak" />
        <div>
          <div className="font-mono text-2xl font-bold text-streak leading-tight">
            {current}
          </div>
          <div className="text-text-secondary text-xs uppercase tracking-wider">
            Streak
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 160, damping: 14 }}
        className="flex items-center gap-2 bg-bg-card rounded-xl px-4 py-2"
      >
        <Star className="w-7 h-7 text-text-primary" />
        <div>
          <div className="font-mono text-2xl font-bold text-text-primary leading-tight">
            {best}
          </div>
          <div className="text-text-secondary text-xs uppercase tracking-wider">
            Best
          </div>
        </div>
      </motion.div>
    </div>
  )
}
