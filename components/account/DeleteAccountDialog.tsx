'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { AlertTriangle, Trash2 } from 'lucide-react'

interface Props {
  /** E-Mail des aktuell angemeldeten Nutzers — zum Bestätigen. */
  userEmail: string
}

/**
 * Self-Service Konto-Löschung (Art. 17 DSGVO).
 *
 * Zweistufiger Flow:
 *   1. Danger-Zone-Button öffnet Dialog.
 *   2. Nutzer muss eigene E-Mail abtippen → Button wird aktiv.
 *   3. Zweite Bestätigung → API DELETE /api/account/delete.
 *
 * Danach wird komplett ausgeloggt und zur Landing-Page weitergeleitet.
 */
export function DeleteAccountDialog({ userEmail }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmInput, setConfirmInput] = useState('')
  const [loading, setLoading] = useState(false)

  const canDelete =
    confirmInput.trim().toLowerCase() === userEmail.toLowerCase() && !loading

  const handleDelete = async () => {
    if (!canDelete) return
    setLoading(true)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail: confirmInput }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Löschen fehlgeschlagen')
      toast.success('Ihr Konto wurde gelöscht. Auf Wiedersehen.', { duration: 6000 })
      // Hard-Redirect, damit der AuthContext neu initialisiert und kein
      // Stale-State zurückbleibt.
      window.location.href = '/'
    } catch (err: any) {
      toast.error(err.message || 'Unbekannter Fehler beim Löschen.')
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o)
      if (!o) setConfirmInput('') // Reset beim Schließen
    }}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className="w-full h-10 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          />
        }
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Konto dauerhaft löschen
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center font-heading text-xl">
            Konto endgültig löschen?
          </DialogTitle>
          <DialogDescription className="text-center leading-relaxed">
            Diese Aktion lässt sich <strong className="text-foreground">nicht rückgängig</strong> machen.
            Alle Mietverhältnisse, Dokumente, Protokolle und Ihre Stammdaten
            werden unwiederbringlich gelöscht.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <Label htmlFor="confirm-email" className="text-sm">
            Zur Bestätigung geben Sie bitte Ihre E-Mail-Adresse ein:
          </Label>
          <Input
            id="confirm-email"
            type="email"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={userEmail}
            autoComplete="off"
            autoFocus
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Abbrechen
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleDelete}
            disabled={!canDelete}
          >
            {loading ? 'Lösche…' : 'Jetzt löschen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
