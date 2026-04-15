'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  isAdmin: boolean
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkAdmin = async (currentUser: User | null) => {
      if (!currentUser) return false
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single()
      return profile?.role === 'admin'
    }

    // Load initial session immediately
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      setIsAdmin(await checkAdmin(currentUser))
    }).catch(() => {}).finally(() => {
      setLoading(false)
    })

    // Listen for subsequent auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      checkAdmin(currentUser).then(setIsAdmin).catch(() => setIsAdmin(false))
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) throw error
  }

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    // terms_accepted_at: Zeitstempel der AGB/Datenschutz-Zustimmung (Art. 7 DSGVO
    // verlangt Nachweisbarkeit). Wird in auth.users.raw_user_meta_data persistiert
    // und kann bei Bedarf vom DB-Trigger `handle_new_user` in die users-Tabelle
    // kopiert werden.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          terms_accepted_at: new Date().toISOString(),
          terms_version: '2026-04-15',
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) throw error
    // Supabase sends confirmation email automatically.
    // The DB trigger `handle_new_user` creates the profile.
    // Sign out so user must confirm email first.
    await supabase.auth.signOut()
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
