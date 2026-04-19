import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell } from '../components/layout/AppShell'
import { ExamPaper } from '../components/ExamPaper'
import { Timer } from '../components/Timer'
import { SuspenseReveal } from '../components/SuspenseReveal'
import { ResultDisplay } from '../components/ResultDisplay'
import { Countdown } from '../components/Countdown'
import { useTimer } from '../hooks/useTimer'
import { apiGet, apiPost } from '../lib/api'
import { markTodayAttempted, clearCachedStats } from '../lib/storage'
import { countdownQuotes } from '../lib/quotes'
import type { TodayResponse, SubmitRequest, SubmitResponse } from '../types'

type Phase = 'loading' | 'countdown' | 'question' | 'suspense' | 'result'

export function ChallengePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const dateParam = searchParams.get('date')

  const [phase, setPhase] = useState<Phase>('loading')
  const [question, setQuestion] = useState<TodayResponse | null>(null)
  const [result, setResult] = useState<SubmitResponse | null>(null)
  const [submittedAnswer, setSubmittedAnswer] = useState<number | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [apiReady, setApiReady] = useState(false)
  const timer = useTimer()
  const pendingResult = useRef<SubmitResponse | null>(null)
  const countdownQuote = useRef(countdownQuotes[Math.floor(Math.random() * countdownQuotes.length)])

  // Fetch today's question (or a specific date's question)
  useEffect(() => {
    const endpoint = dateParam ? `/api/question/${dateParam}` : '/api/today'

    apiGet<TodayResponse>(endpoint)
      .then((data) => {
        setQuestion(data)
        if (data.alreadyAttempted && data.attempt) {
          setSubmittedAnswer(data.attempt.submittedAnswer ?? undefined)
          setResult({
            isCorrect: data.attempt.isCorrect,
            correctAnswer: data.attempt.correctAnswer ?? 0,
            timeMs: data.attempt.timeMs,
            rank: data.attempt.rank,
            currentStreak: data.attempt.currentStreak ?? 0,
            bestStreak: data.attempt.bestStreak ?? 0,
          })
          setPhase('result')
        } else {
          setPhase('countdown')
        }
      })
      .catch(() => {
        setError('No challenge available. Check back tomorrow!')
      })
  }, [dateParam]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCountdownComplete = useCallback(() => {
    setPhase('question')
    timer.start()
  }, [timer])

  const handleSubmit = useCallback(
    async (answer: number) => {
      if (!question) return

      timer.stop()
      setSubmittedAnswer(answer)
      pendingResult.current = null
      setApiReady(false)
      setPhase('suspense')

      try {
        const body: SubmitRequest = {
          questionId: question.questionId,
          answer,
          timeMs: Math.round(timer.elapsedMs),
        }
        const res = await apiPost<SubmitResponse>('/api/submit', body)
        pendingResult.current = res
        if (!dateParam) { markTodayAttempted(); clearCachedStats() }
        setApiReady(true)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Submission failed'
        setError(message)
        setPhase('question')
        timer.start()
      }
    },
    [question, timer, dateParam]
  )

  // SuspenseReveal calls this when both its timer AND apiReady are true
  const handleSuspenseComplete = useCallback(() => {
    if (pendingResult.current) {
      setResult(pendingResult.current)
    }
    setPhase('result')
  }, [])

  // Error state
  if (error && phase === 'loading') {
    return (
      <AppShell>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <div className="text-5xl">📚</div>
          <p className="text-text-secondary">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="text-accent-amber text-base underline underline-offset-2 hover:brightness-110 py-2 px-3"
          >
            Back to Home
          </button>
        </div>
      </AppShell>
    )
  }

  // Loading state
  if (phase === 'loading') {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent-amber border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      {/* Back button (only during question phase) */}
      {phase === 'question' && (
        <button
          onClick={() => navigate('/')}
          className="text-text-secondary text-base mb-4 hover:text-text-primary transition-colors self-start py-2 px-3 -ml-3 min-h-[44px] flex items-center"
        >
          ← Back
        </button>
      )}

      <AnimatePresence mode="wait">
        {/* Countdown Phase */}
        {phase === 'countdown' && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Countdown quote={countdownQuote.current} onComplete={handleCountdownComplete} />
          </motion.div>
        )}

        {/* Question Phase — exam paper + timer */}
        {phase === 'question' && question && (
          <motion.div
            key="question"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Date header */}
            <div className="text-center">
              <p className="text-text-secondary text-base">
                {dateParam ?? "Today's Challenge"}
              </p>
              {question.date && (
                <p className="text-text-secondary/50 text-sm mt-1">
                  {new Date(question.date + 'T00:00:00').toLocaleDateString('en-SG', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>

            {/* Timer */}
            <div className="flex justify-center">
              <Timer elapsedMs={timer.elapsedMs} />
            </div>

            {/* Exam paper with question + answer input */}
            <ExamPaper
              questionText={question.questionText}
              diagramUrl={question.diagramUrl}
              onSubmit={handleSubmit}
            />

            {error && (
              <p className="text-error text-base text-center">{error}</p>
            )}
          </motion.div>
        )}

        {/* Suspense Phase */}
        {phase === 'suspense' && (
          <motion.div
            key="suspense"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
          >
            <SuspenseReveal
              onComplete={handleSuspenseComplete}
              apiReady={apiReady}
            />
          </motion.div>
        )}

        {/* Result Phase */}
        {phase === 'result' && result && question && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <ResultDisplay result={result} questionId={question.questionId} submittedAnswer={submittedAnswer} />
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  )
}
