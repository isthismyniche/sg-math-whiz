// === API Request/Response types ===

export interface RegisterRequest {
  userId: string
  displayName: string
}

export interface TodayResponse {
  questionId: string
  questionText: string
  diagramUrl?: string | null
  date: string // YYYY-MM-DD
  alreadyAttempted: boolean
  attempt?: AttemptResult // included if already attempted
}

export interface SubmitRequest {
  questionId: string
  answer: number
  timeMs: number
}

export interface SubmitResponse {
  isCorrect: boolean
  correctAnswer: number
  timeMs: number
  rank?: number // position on daily leaderboard (if correct)
  currentStreak: number
  bestStreak: number
}

export interface SolutionResponse {
  questionId: string
  questionText: string
  diagramUrl?: string | null
  date: string
  correctAnswer: number
  solutionExplanation: string | null
  source: string | null
  topic: string | null
  attempt?: AttemptResult
}

export interface AttemptResult {
  submittedAnswer: number | null
  isCorrect: boolean
  timeMs: number
  correctAnswer?: number
  rank?: number
  currentStreak?: number
  bestStreak?: number
}

export interface LeaderboardEntry {
  rank: number
  displayName: string
  timeMs: number
  userId: string
}

export interface StreakLeaderboardEntry {
  rank: number
  displayName: string
  currentStreak: number
  avgTimeMs: number
  userId: string
}

export interface UserStats {
  displayName: string
  currentStreak: number
  bestStreak: number
  totalAttempts: number
  totalCorrect: number
  attemptedToday: boolean
}

export interface PastQuestion {
  date: string
  topic: string | null
  attempted: boolean
}
