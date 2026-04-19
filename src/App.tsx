import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import { NicknameModal } from './components/NicknameModal'

const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })))
const ChallengePage = lazy(() => import('./pages/ChallengePage').then(m => ({ default: m.ChallengePage })))
const SolutionPage = lazy(() => import('./pages/SolutionPage').then(m => ({ default: m.SolutionPage })))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })))
const PastChallengesPage = lazy(() => import('./pages/PastChallengesPage').then(m => ({ default: m.PastChallengesPage })))

const PageSpinner = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-accent-amber border-t-transparent rounded-full animate-spin" />
  </div>
)

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <PageSpinner />
  if (!isAuthenticated) return <NicknameModal />

  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/challenge" element={<ChallengePage />} />
        <Route path="/solution/:id" element={<SolutionPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/past" element={<PastChallengesPage />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-dvh flex flex-col bg-bg-primary text-text-primary font-body">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
