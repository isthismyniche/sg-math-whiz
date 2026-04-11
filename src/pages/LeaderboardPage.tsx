import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppShell } from '../components/layout/AppShell'
import { LeaderboardTable } from '../components/LeaderboardTable'
import { useAuth } from '../hooks/useAuth'
import { apiGet } from '../lib/api'
import type { LeaderboardEntry } from '../types'

interface DailyLeaderboardResponse {
  entries: LeaderboardEntry[]
  userRank: number | null
}

export function LeaderboardPage() {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [data, setData] = useState<DailyLeaderboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiGet<DailyLeaderboardResponse>('/api/leaderboard/daily')
      .then(setData)
      .catch(() => {
        setData({ entries: [], userRank: null })
      })
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <AppShell>
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="text-text-secondary text-sm mb-4 hover:text-text-primary transition-colors self-start"
      >
        ← Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display text-3xl text-text-primary mb-1">
          Daily Leaderboard
        </h1>
        <p className="text-text-secondary text-sm">
          Today's fastest correct solvers
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent-amber border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <LeaderboardTable
            entries={data?.entries ?? []}
            currentUserId={userId}
          />

          {/* User's rank callout if not in top 50 */}
          {data?.userRank && data.userRank > 50 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 bg-bg-card rounded-xl p-4 text-center"
            >
              <p className="text-text-secondary text-sm">
                Your rank:{' '}
                <span className="font-mono font-bold text-accent-amber">
                  #{data.userRank}
                </span>
              </p>
            </motion.div>
          )}
        </>
      )}
    </AppShell>
  )
}
