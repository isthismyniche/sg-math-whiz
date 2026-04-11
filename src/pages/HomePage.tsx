import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppShell } from '../components/layout/AppShell'
import { StreakBadge } from '../components/StreakBadge'
import { useAuth } from '../hooks/useAuth'
import { useUserStats } from '../hooks/useUserStats'

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
}

export function HomePage() {
  const navigate = useNavigate()
  const { displayName } = useAuth()
  const { stats } = useUserStats()

  return (
    <AppShell>
      {/* Header */}
      <div className="text-center mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-4xl text-text-primary mb-1"
        >
          SG Math Whiz
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-text-secondary text-sm"
        >
          Hey, {displayName}
        </motion.p>
      </div>

      {/* Streak */}
      <div className="flex justify-center mb-10">
        <StreakBadge
          current={stats?.currentStreak ?? 0}
          best={stats?.bestStreak ?? 0}
        />
      </div>

      {/* Navigation Cards */}
      <div className="space-y-4">
        {/* Today's Challenge — hero action */}
        <motion.button
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          onClick={() => navigate('/challenge')}
          className="w-full text-left rounded-2xl bg-bg-card border-2 border-accent-red/40 p-6 transition-all hover:border-accent-red hover:shadow-lg hover:shadow-accent-red/10 active:scale-[0.98] group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-display text-2xl text-text-primary">
                  Today's Challenge
                </h2>
                <span className="text-[10px] uppercase tracking-widest font-semibold bg-accent-red/20 text-accent-red px-2 py-0.5 rounded-full">
                  New
                </span>
              </div>
              <p className="text-text-secondary text-sm">
                Can you crack today's problem?
              </p>
            </div>
            <div className="text-3xl opacity-60 group-hover:opacity-100 transition-opacity group-hover:translate-x-1 transition-transform">
              →
            </div>
          </div>
        </motion.button>

        {/* Leaderboard */}
        <motion.button
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          onClick={() => navigate('/leaderboard')}
          className="w-full text-left rounded-2xl bg-bg-card border border-text-secondary/10 p-5 transition-all hover:border-text-secondary/30 active:scale-[0.98] group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl text-text-primary mb-0.5">
                Leaderboard
              </h2>
              <p className="text-text-secondary text-sm">
                See who's the fastest today
              </p>
            </div>
            <div className="text-2xl opacity-40 group-hover:opacity-70 transition-opacity">
              →
            </div>
          </div>
        </motion.button>

        {/* Past Challenges */}
        <motion.button
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          onClick={() => navigate('/past')}
          className="w-full text-left rounded-2xl bg-bg-card border border-text-secondary/10 p-5 transition-all hover:border-text-secondary/30 active:scale-[0.98] group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl text-text-primary mb-0.5">
                Past Challenges
              </h2>
              <p className="text-text-secondary text-sm">
                Practice with previous problems
              </p>
            </div>
            <div className="text-2xl opacity-40 group-hover:opacity-70 transition-opacity">
              →
            </div>
          </div>
        </motion.button>
      </div>
    </AppShell>
  )
}
