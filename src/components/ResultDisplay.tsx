import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Flame, ChevronRight } from 'lucide-react'
import { formatTime } from '../hooks/useTimer'
import type { SubmitResponse } from '../types'

interface ResultDisplayProps {
  result: SubmitResponse
  questionId: string
  submittedAnswer?: number
}

export function ResultDisplay({ result, questionId, submittedAnswer }: ResultDisplayProps) {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      {/* Result icon + message */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className="text-center"
      >
        <div className="flex justify-center mb-4">
          {result.isCorrect ? (
            <motion.div
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <CheckCircle className="w-20 h-20 text-success" strokeWidth={1.5} />
            </motion.div>
          ) : (
            <XCircle className="w-20 h-20 text-error" strokeWidth={1.5} />
          )}
        </div>
        <h2 className="font-display text-3xl text-text-primary mb-2">
          {result.isCorrect ? 'Correct!' : 'Not quite...'}
        </h2>
        {!result.isCorrect && (
          <p className="text-text-secondary">
            The answer was{' '}
            <span className="font-mono font-bold text-accent-amber">
              {result.correctAnswer}
            </span>
          </p>
        )}
      </motion.div>

      {/* Stats cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="grid grid-cols-2 gap-3"
      >
        {/* Time */}
        <div className="bg-bg-card rounded-xl p-4 text-center">
          <div className="text-text-secondary text-xs uppercase tracking-wider mb-1">
            Time
          </div>
          <div className="font-mono text-lg font-bold text-text-primary">
            {formatTime(result.timeMs)}
          </div>
        </div>

        {/* Rank (if correct) or Your Answer (if wrong) */}
        {result.isCorrect && result.rank !== undefined ? (
          <div className="bg-bg-card rounded-xl p-4 text-center">
            <div className="text-text-secondary text-xs uppercase tracking-wider mb-1">
              Today's Rank
            </div>
            <div className="font-mono text-lg font-bold text-accent-amber">
              #{result.rank}
            </div>
          </div>
        ) : (
          <div className="bg-bg-card rounded-xl p-4 text-center">
            <div className="text-text-secondary text-xs uppercase tracking-wider mb-1">
              Your Answer
            </div>
            <div className="font-mono text-lg font-bold text-error line-through">
              {submittedAnswer ?? '—'}
            </div>
          </div>
        )}
      </motion.div>

      {/* Streak */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="bg-bg-card rounded-xl p-4 flex items-center justify-center gap-3"
      >
        <Flame className="w-5 h-5 text-streak" />
        <span className="text-text-secondary text-sm">Streak:</span>
        <span className="font-mono text-xl font-bold text-streak">
          {result.currentStreak}
        </span>
        {result.currentStreak === 0 && !result.isCorrect && (
          <span className="text-text-secondary text-xs">(reset)</span>
        )}
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-3"
      >
        <button
          onClick={() => navigate(`/solution/${questionId}`)}
          className="w-full rounded-xl bg-accent-red py-3.5 px-4 font-body font-semibold text-text-primary transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          View Solution
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate('/leaderboard')}
          className="w-full rounded-xl bg-bg-card border border-text-secondary/20 py-3.5 px-4 font-body font-semibold text-text-primary transition-all hover:border-text-secondary/40 active:scale-[0.98]"
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
    </div>
  )
}
