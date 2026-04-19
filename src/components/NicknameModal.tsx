import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}

export function NicknameModal() {
  const { register, signInWithGoogle } = useAuth()
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()

    if (!trimmed) {
      setError('Please enter a display name')
      return
    }
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters')
      return
    }
    if (trimmed.length > 30) {
      setError('Name must be 30 characters or fewer')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await register(trimmed)
    } catch {
      setError('Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch {
      setError('Google sign-in failed. Please try again.')
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/95 px-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm py-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl text-text-primary">
            <span className="text-accent-amber tracking-wide">SG</span>{' '}
            Math Whiz
          </h1>
        </div>

        {/* Hero statement */}
        <div className="text-center mb-6">
          <p className="font-display text-3xl text-text-primary leading-tight">
            Math is the grindstone.
          </p>
          <p className="font-display text-2xl text-accent-amber leading-tight mt-1">
            Sharpen your mind.
          </p>
        </div>

        {/* Compact fact pills */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {['1 question daily', 'Real exam papers', 'PSLE standard'].map((fact) => (
            <span
              key={fact}
              className="text-[10px] uppercase tracking-widest bg-bg-card text-text-secondary/70 px-3 py-1 rounded-full"
            >
              {fact}
            </span>
          ))}
        </div>

        {/* Google sign-in — primary CTA */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isSubmitting}
          className="w-full flex items-center justify-center gap-3 rounded-lg bg-bg-card border border-text-secondary/20 py-3 px-4 font-body font-semibold text-text-primary transition-all hover:border-text-secondary/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          {isGoogleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>
        <p className="text-text-secondary/50 text-xs text-center mt-2 mb-5">
          Save your progress and secure bragging rights on the leaderboard!
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-text-secondary/20" />
          <span className="text-text-secondary/50 text-xs">or</span>
          <div className="flex-1 h-px bg-text-secondary/20" />
        </div>

        {/* Nickname form — fallback */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              id="display-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={30}
              className="w-full rounded-lg bg-bg-card border border-text-secondary/20 px-4 py-3 font-body text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-accent-amber transition-colors"
            />
            <p className="text-text-secondary/50 text-xs mt-2">
              Your progress will be lost if your browser's local storage is cleared.
            </p>
          </div>

          {error && (
            <p className="text-error text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isGoogleLoading}
            className="w-full rounded-lg bg-accent-red py-3 px-4 font-body font-semibold text-text-primary transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Setting up...' : 'Start Playing'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
