'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/brand/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { toast } from 'sonner'
import { ArrowLeft, MailCheck } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Senden der E-Mail')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/40">
        <Link href="/" aria-label="ImmoAkte Startseite">
          <Logo size={22} />
        </Link>
        <ThemeToggle compact />
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm motion-page-in">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass-600 mb-2">ImmoAkte</p>
            <h1 className="font-heading text-3xl text-foreground">Passwort zurücksetzen</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {sent
                ? 'Prüfen Sie Ihr Postfach.'
                : 'Geben Sie Ihre E-Mail-Adresse ein.'}
            </p>
          </div>

          <div className="bg-card rounded-3xl border border-border shadow-ink p-7">
            {sent ? (
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <MailCheck className="h-6 w-6" />
                </div>
                <p className="text-sm text-center text-muted-foreground leading-relaxed">
                  Falls ein Konto mit <strong className="text-foreground">{email}</strong> existiert, erhalten Sie in Kürze einen Link zum Zurücksetzen Ihres Passworts.
                </p>
                <Button asChild className="w-full mt-2">
                  <Link href="/login">Zurück zum Login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="max@beispiel.de"
                    required
                    autoFocus
                  />
                </div>
                <Button className="w-full h-11 text-base" type="submit" disabled={loading}>
                  {loading ? 'Lädt…' : 'Link zusenden'}
                </Button>
              </form>
            )}
          </div>

          {!sent && (
            <p className="mt-5 text-center text-sm text-muted-foreground">
              <Link href="/login" className="inline-flex items-center gap-1 text-brass-700 font-medium hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" />
                Zurück zum Login
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
