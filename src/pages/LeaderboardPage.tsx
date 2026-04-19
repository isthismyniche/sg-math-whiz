import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppShell } from '../components/layout/AppShell'
import { LeaderboardTable } from '../components/LeaderboardTable'
import { StreakLeaderboardTable } from '../components/StreakLeaderboardTable'
import { AnswerDistribution } from '../components/AnswerDistribution'
import { useAuth } from '../hooks/useAuth'
import { apiGet } from '../lib/api'
import type { LeaderboardEntry, StreakLeaderboardEntry } from '../types'

type Tab = 'daily' | 'streaks'

interface DailyLeaderboardResponse {
  entries: LeaderboardEntry[]
  userRank: number | null
  correctCount: number
  wrongCount: number
}

interface StreakLeaderboardResponse {
  entries: StreakLeaderboardEntry[]
  userRank: number | null
}

export function LeaderboardPage() {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [tab, setTab] = useState<Tab>('daily')
  const [dailyData, setDailyData] = useState<DailyLeaderboardResponse | null>(null)
  const [streakData, setStreakData] = useState<StreakLeaderboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (tab === 'daily' && !dailyData) {
      setIsLoading(true)
      apiGet<DailyLeaderboardResponse>('/api/leaderboard/daily')
        .then(setDailyData)
        .catch(() => setDailyData({ entries: [], userRank: null }))
        .finally(() => setIsLoading(false))
    } else if (tab === 'streaks' && !streakData) {
      setIsLoading(true)
      apiGet<StreakLeaderboardResponse>('/api/leaderboard/streaks')
        .then(setStreakData)
        .catch(() => setStreakData({ entries: [], userRank: null }))
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [tab, dailyData, streakData])

  const data = tab === 'daily' ? dailyData : streakData

  return (
    <AppShell>
      <button
        onClick={() => navigate('/')}
        className="text-text-secondary text-base mb-4 hover:text-text-primary transition-colors self-start py-2 px-3 -ml-3 min-h-[44px] flex items-center"
      >
        ← Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display text-4xl text-text-primary mb-1">
          Leaderboard
        </h1>
        <p className="text-text-secondary text-base">
          {tab === 'daily' ? "Today's fastest correct solvers" : 'Longest active streaks'}
        </p>
      </motion.div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-bg-card rounded-xl p-1 mb-6">
        <button
          onClick={() => setTab('daily')}
          className={`flex-1 rounded-lg py-2.5 text-base font-medium transition-all ${
            tab === 'daily'
              ? 'bg-accent-amber/20 text-accent-amber'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Daily
        </button>
        <button
          onClick={() => setTab('streaks')}
          className={`flex-1 rounded-lg py-2.5 text-base font-medium transition-all ${
            tab === 'streaks'
              ? 'bg-accent-amber/20 text-accent-amber'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Streaks
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent-amber border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {tab === 'daily' ? (
            <>
              <LeaderboardTable
                entries={dailyData?.entries ?? []}
                currentUserId={userId}
              />
              <AnswerDistribution
                correctCount={dailyData?.correctCount ?? 0}
                wrongCount={dailyData?.wrongCount ?? 0}
              />
            </>
          ) : (
            <StreakLeaderboardTable
              entries={streakData?.entries ?? []}
              currentUserId={userId}
            />
          )}

          {/* User's rank callout if not in top 50 */}
          {data?.userRank && data.userRank > 50 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 bg-bg-card rounded-xl p-4 text-center"
            >
              <p className="text-text-secondary text-base">
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
