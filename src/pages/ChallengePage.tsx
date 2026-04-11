import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell } from '../components/layout/AppShell'
import { QuestionReveal } from '../components/QuestionReveal'
import { Timer } from '../components/Timer'
import { AnswerInput } from '../components/AnswerInput'
import { SuspenseReveal } from '../components/SuspenseReveal'
import { ResultDisplay } from '../components/ResultDisplay'
import { useTimer } from '../hooks/useTimer'
import { apiGet, apiPost } from '../lib/api'
import type { TodayResponse, SubmitRequest, SubmitResponse } from '../types'

type Phase = 'loading' | 'reveal' | 'answering' | 'submitting' | 'suspense' | 'result'

export function ChallengePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const dateParam = searchParams.get('date')

  const [phase, setPhase] = useState<Phase>('loading')
  const [question, setQuestion] = useState<TodayResponse | null>(null)
  const [result, setResult] = useState<SubmitResponse | null>(null)
  const [submittedAnswer, setSubmittedAnswer] = useState<number | undefined>()
  const [error, setError] = useState<string | null>(null)
  const timer = useTimer()
  const pendingResult = useRef<SubmitResponse | null>(null)

  // Fetch today's question (or a specific date's question)
  useEffect(() => {
    const endpoint = dateParam ? `/api/question/${dateParam}` : '/api/today'

    apiGet<TodayResponse>(endpoint)
      .then((data) => {
        setQuestion(data)
        if (data.alreadyAttempted && data.attempt) {
          // Already attempted — skip straight to result
          setResult({
            isCorrect: data.attempt.isCorrect,
            correctAnswer: 0, // Not available from today endpoint
            timeMs: data.attempt.timeMs,
            currentStreak: 0,
            bestStreak: 0,
          })
          setPhase('result')
        } else {
          setPhase('reveal')
        }
      })
      .catch(() => {
        setError('No challenge available. Check back tomorrow!')
      })
  }, [dateParam])

  const handleRevealComplete = useCallback(() => {
    setPhase('answering')
    timer.start()
  }, [timer])

  const handleSubmit = useCallback(
    async (answer: number) => {
      if (!question) return

      timer.stop()
      setSubmittedAnswer(answer)
      setPhase('submitting')

      try {
        const body: SubmitRequest = {
          questionId: question.questionId,
          answer,
          timeMs: Math.round(timer.elapsedMs),
        }
        const res = await apiPost<SubmitResponse>('/api/submit', body)
        // Store result but don't show yet — wait for suspense
        pendingResult.current = res
        setPhase('suspense')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Submission failed'
        setError(message)
        setPhase('answering')
        timer.start() // Resume timer on error
      }
    },
    [question, timer]
  )

  const handleSuspenseComplete = useCallback(() => {
    if (pendingResult.current) {
      setResult(pendingResult.current)
    }
    setPhase('result')
  }, [])

  // Loading state
  if (error && phase === 'loading') {
    return (
      <AppShell>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <div className="text-5xl">📚</div>
          <p className="text-text-secondary">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="text-accent-amber text-sm underline underline-offset-2 hover:brightness-110 py-2 px-3"
          >
            Back to Home
          </button>
        </div>
      </AppShell>
    )
  }

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
      {/* Back button (only during reveal/answering) */}
      {(phase === 'reveal' || phase === 'answering') && (
        <button
          onClick={() => navigate('/')}
          className="text-text-secondary text-sm mb-4 hover:text-text-primary transition-colors self-start py-2 px-3 -ml-3 min-h-[44px] flex items-center"
        >
          ← Back
        </button>
      )}

      <AnimatePresence mode="wait">
        {/* Question Reveal Phase */}
        {phase === 'reveal' && question && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center mb-6">
              <p className="text-text-secondary text-sm">
                {dateParam ?? "Today's Challenge"}
              </p>
              {question.date && (
                <p className="text-text-secondary/50 text-xs mt-1">
                  {new Date(question.date + 'T00:00:00').toLocaleDateString('en-SG', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
            <QuestionReveal
              text={question.questionText}
              onRevealComplete={handleRevealComplete}
            />
            <div className="text-center mt-6">
              <p className="text-text-secondary/40 text-xs">
                Timer starts after the question is revealed...
              </p>
            </div>
          </motion.div>
        )}

        {/* Answering Phase */}
        {phase === 'answering' && question && (
          <motion.div
            key="answering"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Question text (static, already revealed) */}
            <div className="bg-bg-card rounded-2xl p-6 border border-text-secondary/10">
              <div className="font-display text-xl leading-relaxed text-text-primary">
                {question.questionText}
              </div>
            </div>

            {/* Timer */}
            <div className="flex justify-center">
              <Timer elapsedMs={timer.elapsedMs} />
            </div>

            {/* Answer input */}
            <AnswerInput onSubmit={handleSubmit} />

            {error && (
              <p className="text-error text-sm text-center">{error}</p>
            )}
          </motion.div>
        )}

        {/* Submitting / Suspense Phase */}
        {(phase === 'submitting' || phase === 'suspense') && (
          <motion.div
            key="suspense"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SuspenseReveal onComplete={handleSuspenseComplete} />
          </motion.div>
        )}

        {/* Result Phase */}
        {phase === 'result' && result && question && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ResultDisplay result={result} questionId={question.questionId} submittedAnswer={submittedAnswer} />
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  )
}
