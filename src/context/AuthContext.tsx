import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { getUserId, getDisplayName, setUser as storeUser } from '../lib/storage'
import { apiPost } from '../lib/api'
import { supabase } from '../lib/supabase'

interface AuthState {
  userId: string | null
  displayName: string | null
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  register: (displayName: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    userId: null,
    displayName: null,
    isLoading: true,
  })

  useEffect(() => {
    const userId = getUserId()
    const displayName = getDisplayName()

    if (userId) {
      setState({ userId, displayName, isLoading: false })
      return
    }

    // No local user — check if we're returning from a Google OAuth redirect.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.access_token) {
        try {
          const result = await apiPost<{ userId: string; displayName: string }>(
            '/api/auth/google-signin',
            { accessToken: session.access_token }
          )
          storeUser(result.userId, result.displayName)
          setState({ userId: result.userId, displayName: result.displayName, isLoading: false })
        } catch {
          setState({ userId: null, displayName: null, isLoading: false })
        }
      } else {
        setState({ userId: null, displayName: null, isLoading: false })
      }
    })
  }, [])

  const register = useCallback(async (displayName: string) => {
    const userId = crypto.randomUUID()

    await apiPost('/api/register', { userId, displayName })

    storeUser(userId, displayName)
    setState({ userId, displayName, isLoading: false })
  }, [])

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: { prompt: 'select_account' },
      },
    })
    // Page redirects to Google — execution does not continue here.
  }, [])

  return (
    <AuthContext.Provider
      value={{
        ...state,
        register,
        signInWithGoogle,
        isAuthenticated: !!state.userId,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
