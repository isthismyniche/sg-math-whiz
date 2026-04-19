import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { formatTime } from '../hooks/useTimer'
import type { StreakLeaderboardEntry } from '../types'

interface StreakLeaderboardTableProps {
  entries: StreakLeaderboardEntry[]
  currentUserId: string | null
}

export function StreakLeaderboardTable({ entries, currentUserId }: StreakLeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Flame className="w-10 h-10 text-text-secondary/30 mx-auto mb-3" />
        <p className="text-text-secondary text-base">
          No active streaks yet. Start yours today!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => {
        const isCurrentUser = entry.userId === currentUserId

        return (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
              isCurrentUser
                ? 'bg-accent-amber/10 border border-accent-amber/30'
                : 'bg-bg-card'
            }`}
          >
            {/* Rank */}
            <div className="font-mono text-xl font-bold w-8 text-center text-text-secondary">
              {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <span
                className={`text-base truncate block ${
                  isCurrentUser ? 'text-accent-amber font-semibold' : 'text-text-primary'
                }`}
              >
                {entry.displayName}
                {isCurrentUser && (
                  <span className="text-text-secondary text-sm ml-1">(you)</span>
                )}
              </span>
            </div>

            {/* Streak count */}
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-streak" />
              <span className="font-mono text-base font-bold text-streak tabular-nums">
                {entry.currentStreak}
              </span>
            </div>

            {/* Avg time */}
            <div className="font-mono text-sm text-text-secondary tabular-nums ml-2">
              {formatTime(entry.avgTimeMs)}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
