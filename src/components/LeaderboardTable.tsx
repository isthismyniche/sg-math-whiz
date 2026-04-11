import { motion } from 'framer-motion'
import { formatTime } from '../hooks/useTimer'
import type { LeaderboardEntry } from '../types'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserId: string | null
}

const rankColors: Record<number, string> = {
  1: 'text-yellow-400',
  2: 'text-gray-300',
  3: 'text-amber-600',
}

export function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">🏆</div>
        <p className="text-text-secondary text-sm">
          No one has solved today's challenge yet. Be the first!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => {
        const isCurrentUser = entry.userId === currentUserId
        const rankColor = rankColors[entry.rank] ?? 'text-text-secondary'

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
            <div className={`font-mono text-lg font-bold w-8 text-center ${rankColor}`}>
              {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <span
                className={`text-sm truncate block ${
                  isCurrentUser ? 'text-accent-amber font-semibold' : 'text-text-primary'
                }`}
              >
                {entry.displayName}
                {isCurrentUser && (
                  <span className="text-text-secondary text-xs ml-1">(you)</span>
                )}
              </span>
            </div>

            {/* Time */}
            <div className="font-mono text-sm text-text-secondary tabular-nums">
              {formatTime(entry.timeMs)}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
