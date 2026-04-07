'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ClipboardCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  const { user } = useAuth()

  return (
    <header className="flex items-center justify-between p-6">
      <Link href="/" className="flex items-center gap-2">
        <ClipboardCheck className="h-8 w-8 text-primary" />
        <span className="text-xl font-bold">Protokoll-Pro</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 mr-4">
          Preise
        </Link>
        {user ? (
          <Link href="/dashboard">
            <Button>Zum Dashboard</Button>
          </Link>
        ) : (
          <>
            <Link href="/login">
              <Button variant="ghost">Anmelden</Button>
            </Link>
            <Link href="/login?mode=signup">
              <Button>Registrieren</Button>
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
