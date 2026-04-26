'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Toaster } from '@/components/ui/sonner'
import { CookieConsent } from '@/components/CookieConsent'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          {children}
          <CookieConsent />
          <Toaster position="top-center" />
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  )
}
