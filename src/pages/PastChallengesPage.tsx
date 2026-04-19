import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Circle } from 'lucide-react'
import { AppShell } from '../components/layout/AppShell'
import { apiGet } from '../lib/api'
import type { PastQuestion } from '../types'

export function PastChallengesPage() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<PastQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiGet<PastQuestion[]>('/api/past-questions')
      .then(setQuestions)
      .catch(() => setQuestions([]))
      .finally(() => setIsLoading(false))
  }, [])

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
          Past Challenges
        </h1>
        <p className="text-text-secondary text-base">
          Practice with previous problems
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent-amber border-t-transparent rounded-full animate-spin" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary text-base">
            No past challenges yet. Check back tomorrow!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => {
            const dateObj = new Date(q.date + 'T00:00:00')
            const dateStr = dateObj.toLocaleDateString('en-SG', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })

            return (
              <motion.button
                key={q.date}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                onClick={() => navigate(`/challenge?date=${q.date}`)}
                className={`w-full flex items-center gap-4 rounded-xl px-4 py-4 text-left transition-all active:scale-[0.98] ${
                  q.attempted
                    ? 'bg-bg-card border border-success/20'
                    : 'bg-bg-card border border-text-secondary/10 hover:border-text-secondary/30'
                }`}
              >
                {/* Status icon */}
                {q.attempted ? (
                  <CheckCircle className="w-5 h-5 text-success shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-text-secondary/40 shrink-0" />
                )}

                {/* Date + topic */}
                <div className="flex-1 min-w-0">
                  <div className="text-text-primary text-base font-medium">
                    {dateStr}
                  </div>
                  {q.topic && (
                    <div className="text-text-secondary text-sm mt-0.5">
                      {q.topic}
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="text-xl text-text-secondary/40">→</div>
              </motion.button>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
