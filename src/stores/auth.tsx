import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useSupabase } from '@/hooks/useSupabase'
import type { Organization } from '@/types/supabase'

interface Profile {
  id: string; email: string; full_name?: string | null; avatar_url?: string | null
}

interface AuthState {
  profile: Profile | null; organization: Organization | null
  userRole: string | null
  isLoading: boolean; isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, orgData: { name: string; slug: string }) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
}

const IS_MOCK = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder') || import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

const MOCK_ADMIN: AuthState = {
  profile: { id: 'mock-admin-id', email: 'admin@qlfgym.com', full_name: 'Admin User' },
  organization: { id: 'mock-org-id', name: 'QLF GYM', slug: 'qlf-gym', logo_url: null, address: null, phone: null, email: 'admin@qlfgym.com', created_at: new Date().toISOString() },
  userRole: 'super_admin',
  isLoading: false, isAuthenticated: true,
}

const initialState: AuthState = {
  profile: null, organization: null, userRole: null,
  isLoading: true, isAuthenticated: false,
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabase()
  const [state, setState] = useState<AuthState>(initialState)

  const fetchSession = useCallback(async () => {
    if (IS_MOCK) { setState(MOCK_ADMIN); return }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) { setState(s => ({ ...s, isLoading: false })); return }
    const user = session.user
    const profile: Profile = { id: user.id, email: user.email ?? '', full_name: user.user_metadata?.full_name, avatar_url: user.user_metadata?.avatar_url }
    const { data: roles } = await supabase.from('user_roles').select('*').eq('user_id', user.id)
    const userRoles = roles ?? []
    const orgId = userRoles[0]?.organization_id
    let org: Organization | null = null
    if (orgId) {
      const { data: orgData } = await supabase.from('organizations').select('*').eq('id', orgId).single()
      org = orgData
    }
    const userRole = userRoles.length > 0 ? userRoles[0].role : null
    setState({ profile, organization: org, userRole, isLoading: false, isAuthenticated: true })
  }, [supabase])

  useEffect(() => {
    if (IS_MOCK) { setState(MOCK_ADMIN); return }
    fetchSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => fetchSession())
    return () => subscription?.unsubscribe()
  }, [supabase, fetchSession])

  const signIn = useCallback(async (email: string, password: string) => {
    if (IS_MOCK) { setState(MOCK_ADMIN); return { error: null } }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [supabase])

  const signInWithUsername = useCallback(async (username: string, password: string) => {
    if (IS_MOCK) { setState(MOCK_ADMIN); return { error: null } }
    const { data: profiles } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .maybeSingle()
    if (!profiles?.email) return { error: new Error("Identifiant introuvable") }
    const { error } = await supabase.auth.signInWithPassword({ email: profiles.email, password })
    return { error }
  }, [supabase])

  const signUp = useCallback(async (email: string, password: string, orgData: { name: string; slug: string }) => {
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError || !data.user) return { error: signUpError }
    const { error: orgError } = await supabase.from('organizations').insert({ name: orgData.name, slug: orgData.slug })
    if (orgError) return { error: orgError }
    const { data: org } = await supabase.from('organizations').select('*').eq('slug', orgData.slug).single()
    if (org) await supabase.from('user_roles').insert({ user_id: data.user.id, organization_id: org.id, role: 'super_admin' })
    return { error: null }
  }, [supabase])

  const signOut = useCallback(async () => {
    setState(initialState)
    if (!IS_MOCK) {
      supabase.auth.signOut().catch(() => {})
    }
  }, [supabase])

  const resetPassword = useCallback(async (email: string) => {
    if (IS_MOCK) return { error: new Error("Mode démo indisponible") }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })
    return { error }
  }, [supabase])

  return (
    <AuthContext.Provider value={{
      ...state, signIn, signInWithUsername, signUp, signOut, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
