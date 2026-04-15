'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/brand/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { toast } from 'sonner'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Passwörter stimmen nicht überein')
      return
    }
    if (password.length < 6) {
      toast.error('Passwort muss mindestens 6 Zeichen lang sein')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Passwort erfolgreich geändert')
      router.replace('/login')
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Ändern des Passworts')
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
            <h1 className="font-heading text-3xl text-foreground">Neues Passwort</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Geben Sie Ihr neues Passwort ein.</p>
          </div>

          <div className="bg-card rounded-3xl border border-border shadow-ink p-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">Neues Passwort</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                    autoFocus
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
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Passwort wiederholen</Label>
                <Input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
              <Button className="w-full h-11 text-base" type="submit" disabled={loading}>
                {loading ? 'Speichert…' : 'Passwort speichern'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
