'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/brand/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { toast } from 'sonner'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

function LoginForm() {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  // AGB/Datenschutz-Zustimmung — nur für Sign-Up, nicht für Login.
  // Pflicht nach §305 BGB (AGB-Einbeziehung) + Art. 6 DSGVO
  // (informierte Einwilligung, nicht voreingestellt).
  const [termsAccepted, setTermsAccepted] = useState(false)

  useEffect(() => {
    if (user) router.replace('/dashboard')
  }, [user, router])

  if (user) return null

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch {
      toast.error('Google-Anmeldung fehlgeschlagen')
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSignUp && !termsAccepted) {
      toast.error('Bitte stimmen Sie den AGB und der Datenschutzerklärung zu.')
      return
    }
    setLoading(true)
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name)
        toast.success('Registrierung erfolgreich! Bitte prüfen Sie Ihr E-Mail-Postfach zur Verifizierung.', { duration: 10000 })
        setLoading(false)
      } else {
        await signInWithEmail(email, password)
        // Navigation handled by the useEffect above (user → /dashboard).
        // Reset loading so the button doesn't stay stuck if the redirect is slow.
        setLoading(false)
      }
    } catch (err: any) {
      toast.error(err.message || 'Fehler bei der Anmeldung')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/40">
        <Link href="/" aria-label="ImmoAkte Startseite">
          <Logo size={22} />
        </Link>
        <ThemeToggle compact />
      </header>

      {/* Card */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm motion-page-in">
          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass-600 mb-2">ImmoAkte</p>
            <h1 className="font-heading text-3xl text-foreground">
              {isSignUp ? 'Konto erstellen' : 'Anmelden'}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {isSignUp ? 'Starten Sie kostenlos — kein Kreditkarte nötig.' : 'Willkommen zurück.'}
            </p>
          </div>

          {/* Form card */}
          <div className="bg-card rounded-3xl border border-border shadow-ink p-7 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Max Mustermann" required />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">E-Mail</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="max@beispiel.de" required />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Passwort</Label>
                  {!isSignUp && (
                    <Link
                      href="/forgot-password"
                      className="text-xs text-brass-700 hover:text-brass-800 hover:underline"
                    >
                      Vergessen?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {isSignUp && (
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-brass-600 focus:ring-2 focus:ring-brass-400 cursor-pointer"
                    aria-label="AGB und Datenschutzerklärung akzeptieren"
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    Ich akzeptiere die{' '}
                    <Link href="/agb" target="_blank" className="text-brass-700 hover:underline">AGB</Link>
                    {' '}und habe die{' '}
                    <Link href="/datenschutz" target="_blank" className="text-brass-700 hover:underline">Datenschutzerklärung</Link>
                    {' '}zur Kenntnis genommen.
                  </span>
                </label>
              )}
              <Button className="w-full h-11 text-base" type="submit" disabled={loading || (isSignUp && !termsAccepted)}>
                {loading ? 'Lädt…' : (isSignUp ? 'Registrieren' : 'Anmelden')}
              </Button>
            </form>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground font-medium">oder</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button variant="outline" className="w-full h-10 gap-2" onClick={handleGoogleSignIn} disabled={loading}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Mit Google anmelden
            </Button>
          </div>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {isSignUp ? 'Bereits ein Konto?' : 'Noch kein Konto?'}
            <button
              className="ml-1.5 text-brass-700 font-medium hover:underline"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Anmelden' : 'Kostenlos registrieren'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
