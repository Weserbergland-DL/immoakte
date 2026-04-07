'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Header from '@/components/layout/Header'
import { useEffect, Suspense } from 'react'

function LoginForm() {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) router.replace('/dashboard')
  }, [user, router])

  if (user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name)
        toast.success('Registrierung erfolgreich! Bitte prüfen Sie Ihr E-Mail-Postfach zur Verifizierung.', {
          duration: 10000,
        })
        setIsSignUp(false)
      } else {
        await signInWithEmail(email, password)
        toast.success('Anmeldung erfolgreich!')
      }
    } catch (error: any) {
      toast.error(error.message || 'Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error: any) {
      toast.error(error.message || 'Ein Fehler ist bei der Google-Anmeldung aufgetreten.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{isSignUp ? 'Registrieren' : 'Anmelden'}</CardTitle>
            <CardDescription>
              {isSignUp ? 'Erstellen Sie Ihr Konto' : 'Willkommen zurück bei Protokoll-Pro'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? 'Lädt...' : (isSignUp ? 'Registrieren' : 'Anmelden')}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-500">oder</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
              Mit Google anmelden
            </Button>

            <p className="mt-4 text-center text-sm">
              {isSignUp ? 'Bereits ein Konto?' : 'Noch kein Konto?'}
              <button
                className="ml-1 text-primary hover:underline"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Anmelden' : 'Registrieren'}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Lade...</div>}>
      <LoginForm />
    </Suspense>
  )
}
