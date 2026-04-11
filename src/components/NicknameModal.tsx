import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'

export function NicknameModal() {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/95 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-text-primary mb-2">
            SG Math Whiz
          </h1>
          <p className="text-text-secondary text-sm">
            Are you smarter than a 12-year-old Singaporean?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="display-name"
              className="block text-text-secondary text-sm mb-2"
            >
              What should we call you?
            </label>
            <input
              id="display-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              autoFocus
              maxLength={30}
              className="w-full rounded-lg bg-bg-card border border-text-secondary/20 px-4 py-3 font-mono text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-accent-amber transition-colors"
            />
            <p className="text-text-secondary/60 text-xs mt-2">
              Use your real name or a unique handle — you'll want to brag on the leaderboard!
            </p>
          </div>

          {error && (
            <p className="text-error text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-accent-red py-3 px-4 font-body font-semibold text-text-primary transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Setting up...' : 'Start Playing'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
