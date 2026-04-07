'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface FeedbackContextType {
  openFeedback: (errorDetails?: string) => void
  closeFeedback: () => void
  isOpen: boolean
  errorDetails: string | null
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined)

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

  const openFeedback = (details?: string) => {
    if (details) setErrorDetails(details)
    setIsOpen(true)
  }

  const closeFeedback = () => {
    setIsOpen(false)
    setErrorDetails(null)
  }

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      if (event.reason instanceof Error) {
        openFeedback(`Unhandled Rejection: ${event.reason.message}\n\nStack: ${event.reason.stack}`)
      } else {
        openFeedback(`Unhandled Rejection: ${JSON.stringify(event.reason)}`)
      }
    }

    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error)
      openFeedback(`Global Error: ${event.message}\n\nStack: ${event.error?.stack}`)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  return (
    <FeedbackContext.Provider value={{ openFeedback, closeFeedback, isOpen, errorDetails }}>
      {children}
    </FeedbackContext.Provider>
  )
}

export function useFeedback() {
  const context = useContext(FeedbackContext)
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider')
  }
  return context
}
