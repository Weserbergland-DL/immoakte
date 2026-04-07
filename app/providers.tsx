'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { FeedbackProvider } from '@/contexts/FeedbackContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { FeedbackButton } from '@/components/FeedbackButton'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <FeedbackProvider>
        <ErrorBoundary>
          {children}
          <FeedbackButton />
          <Toaster position="top-center" />
        </ErrorBoundary>
      </FeedbackProvider>
    </AuthProvider>
  )
}
