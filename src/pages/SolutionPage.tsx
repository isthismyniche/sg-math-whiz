import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppShell } from '../components/layout/AppShell'
import { formatTime } from '../hooks/useTimer'
import { apiGet } from '../lib/api'
import type { SolutionResponse } from '../types'

export function SolutionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [solution, setSolution] = useState<SolutionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    apiGet<SolutionResponse>(`/api/solution/${id}`)
      .then(setSolution)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load solution')
      })
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent-amber border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    )
  }

  if (error || !solution) {
    return (
      <AppShell>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <div className="text-5xl">🔒</div>
          <p className="text-text-secondary">{error ?? 'Solution not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="text-accent-amber text-sm hover:underline"
          >
            Back to Home
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="text-text-secondary text-sm mb-4 hover:text-text-primary transition-colors self-start"
      >
        ← Back
      </button>

      {/* Date + topic header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <p className="text-text-secondary text-base">
            {new Date(solution.date + 'T00:00:00').toLocaleDateString('en-SG', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          {solution.topic && (
            <span className="text-[10px] uppercase tracking-widest bg-bg-card text-text-secondary px-2 py-0.5 rounded-full">
              {solution.topic}
            </span>
          )}
        </div>
        {solution.source && (
          <p className="text-text-secondary/50 text-xs">{solution.source}</p>
        )}
      </motion.div>

      {/* Question — exam paper style */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative rounded-lg overflow-hidden mb-4"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2)' }}
      >
        <div className="bg-[#FFFEF9] px-6 py-6 sm:px-8 relative">
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.08]"
            style={{
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #4A90A4 31px, #4A90A4 32px)',
              backgroundPosition: '0 7px',
            }}
          />
          <div
            className="absolute top-0 bottom-0 left-10 sm:left-12 w-[1px] opacity-20 pointer-events-none"
            style={{ backgroundColor: '#E63946' }}
          />
          <div className="relative flex gap-3 sm:gap-4">
            <span className="font-serif text-[#1a1a1a] font-bold text-lg leading-relaxed shrink-0 mt-[1px]">
              1.
            </span>
            <div className="font-serif text-[#1a1a1a] text-lg leading-relaxed text-justify">
              {solution.questionText}
            </div>
          </div>
          {solution.diagramUrl && (
            <div className="mt-4 -mx-6 sm:-mx-8">
              <img
                src={solution.diagramUrl}
                alt="Question diagram"
                className="w-full"
                style={{ maxHeight: '840px', objectFit: 'contain' }}
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* User's attempt summary */}
      {solution.attempt && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <div className="bg-bg-card rounded-xl p-3 text-center">
            <div className="text-text-secondary text-xs uppercase tracking-wider mb-1">
              Your Answer
            </div>
            <div
              className={`font-mono text-base font-bold ${
                solution.attempt.isCorrect ? 'text-success' : 'text-error'
              }`}
            >
              {solution.attempt.submittedAnswer ?? '—'}
            </div>
          </div>
          <div className="bg-bg-card rounded-xl p-3 text-center">
            <div className="text-text-secondary text-xs uppercase tracking-wider mb-1">
              Correct
            </div>
            <div className="font-mono text-base font-bold text-accent-amber">
              {solution.correctAnswer}
            </div>
          </div>
          <div className="bg-bg-card rounded-xl p-3 text-center">
            <div className="text-text-secondary text-xs uppercase tracking-wider mb-1">
              Time
            </div>
            <div className="font-mono text-base font-bold text-text-primary">
              {formatTime(solution.attempt.timeMs)}
            </div>
          </div>
        </motion.div>
      )}

      {/* Solution explanation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-bg-secondary rounded-2xl p-6 border border-text-secondary/10"
      >
        <h3 className="font-display text-2xl text-text-primary mb-4">Solution</h3>
        {solution.solutionExplanation ? (
          <div className="text-text-secondary text-base leading-relaxed whitespace-pre-wrap font-body">
            {solution.solutionExplanation}
          </div>
        ) : (
          <p className="text-text-secondary/50 text-sm italic">
            Solution explanation coming soon.
          </p>
        )}
      </motion.div>

      {/* Bottom nav */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 space-y-3"
      >
        <button
          onClick={() => navigate('/leaderboard')}
          className="w-full rounded-xl bg-bg-card border border-text-secondary/20 py-3 px-4 font-body font-semibold text-text-primary transition-all hover:border-text-secondary/40 active:scale-[0.98]"
        >
          See Leaderboard
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full py-2 text-text-secondary text-sm hover:text-text-primary transition-colors"
        >
          Back to Home
        </button>
      </motion.div>
    </AppShell>
  )
}
