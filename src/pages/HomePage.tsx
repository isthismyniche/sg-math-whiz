import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppShell } from '../components/layout/AppShell'
import { StreakBadge } from '../components/StreakBadge'
import { useAuth } from '../hooks/useAuth'
import { useUserStats } from '../hooks/useUserStats'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function HomePage() {
  const navigate = useNavigate()
  const { displayName } = useAuth()
  const { stats, isLoading } = useUserStats()

  return (
    <AppShell>
      {/* Header — no data dependency, renders immediately */}
      <div className="text-center mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-6xl text-text-primary mb-4"
        >
          <span className="text-accent-amber tracking-wide">SG</span>{' '}
          Math Whiz
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-text-primary text-xl font-semibold"
        >
          {getGreeting()}, {displayName}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-accent-amber text-sm italic mt-1"
        >
          Math is the grindstone. Sharpen your mind.
        </motion.p>
      </div>

      {/* Skeleton while stats load */}
      {isLoading ? (
        <div className="flex flex-col items-center gap-10 animate-pulse">
          <div className="flex gap-4">
            <div className="w-28 h-14 bg-bg-card rounded-xl" />
            <div className="w-28 h-14 bg-bg-card rounded-xl" />
          </div>
          <div className="w-full space-y-4">
            <div className="w-full h-24 bg-bg-card rounded-2xl" />
            <div className="w-full h-16 bg-bg-card rounded-2xl" />
            <div className="w-full h-16 bg-bg-card rounded-2xl" />
          </div>
        </div>
      ) : (
        /* Streak + cards fade in together once data is ready */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          <div className="flex justify-center mb-10">
            <StreakBadge
              current={stats?.currentStreak ?? 0}
              best={stats?.bestStreak ?? 0}
            />
          </div>

          <div className="space-y-4">
            {/* Today's Challenge — hero action */}
            <button
              onClick={() => navigate('/challenge')}
              className={`w-full text-left rounded-2xl p-6 transition-all active:scale-[0.98] group ${
                stats?.attemptedToday
                  ? 'bg-bg-card border border-success/30 border-l-4 border-l-success'
                  : 'bg-gradient-to-br from-accent-red/5 to-transparent bg-bg-card border-2 border-l-4 border-accent-red/40 border-l-accent-red hover:border-accent-red hover:shadow-lg hover:shadow-accent-red/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-display text-3xl text-text-primary">
                      Today's Challenge
                    </h2>
                    {!stats?.attemptedToday && (
                      <span className="text-[11px] uppercase tracking-widest font-semibold bg-accent-red/20 text-accent-red px-2.5 py-1 rounded-full">
                        New
                      </span>
                    )}
                    {stats?.attemptedToday && (
                      <span className="text-[11px] uppercase tracking-widest font-semibold bg-success/20 text-success px-2.5 py-1 rounded-full">
                        Done
                      </span>
                    )}
                  </div>
                  <p className="text-text-secondary text-base">
                    {stats?.attemptedToday
                      ? 'View your result'
                      : "Can you crack today's problem?"}
                  </p>
                </div>
                <div className="text-3xl opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  →
                </div>
              </div>
            </button>

            {/* Leaderboard */}
            <button
              onClick={() => navigate('/leaderboard')}
              className="w-full text-left rounded-2xl bg-bg-card border border-text-secondary/10 p-5 transition-all hover:border-text-secondary/30 active:scale-[0.98] group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl text-text-primary mb-0.5">
                    Leaderboard
                  </h2>
                  <p className="text-text-secondary text-base">
                    See who's the fastest today
                  </p>
                </div>
                <div className="text-2xl opacity-40 group-hover:opacity-70 transition-opacity">
                  →
                </div>
              </div>
            </button>

            {/* Past Challenges */}
            <button
              onClick={() => navigate('/past')}
              className="w-full text-left rounded-2xl bg-bg-card border border-text-secondary/10 p-5 transition-all hover:border-text-secondary/30 active:scale-[0.98] group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl text-text-primary mb-0.5">
                    Past Challenges
                  </h2>
                  <p className="text-text-secondary text-base">
                    Practice with previous problems
                  </p>
                </div>
                <div className="text-2xl opacity-40 group-hover:opacity-70 transition-opacity">
                  →
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      )}
    </AppShell>
  )
}
