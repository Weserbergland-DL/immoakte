'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Shield } from 'lucide-react'

interface Props {
  /** Pricing-Plan-Info zur Anzeige im Dialog. */
  plan: {
    name: string
    price: string
    period: string | null
    mode: 'payment' | 'subscription'
  } | null
  /** Dialog sichtbar? Wird vom Parent gesteuert. */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Wird ausgeführt, sobald beide Checkboxen angekreuzt sind und der Nutzer bestätigt. */
  onConfirm: () => void
  /** True während /api/stripe/checkout läuft. */
  loading?: boolean
}

/**
 * Confirm-Dialog vor der Weiterleitung zum Stripe-Checkout.
 *
 * Erfüllt zwei Pflichten im deutschen Verbraucher-/Fernabsatzrecht:
 *
 *  1. **§ 312j Abs. 3 BGB (Button-Lösung):** Die Schaltfläche, mit der der
 *     Verbraucher den Vertrag bestätigt, muss unmissverständlich auf die
 *     Zahlungspflicht hinweisen. Wortlaut: „Zahlungspflichtig bestellen" oder
 *     eine gleich eindeutige Formulierung.
 *
 *  2. **§ 356 Abs. 5 BGB:** Damit das Widerrufsrecht bei digitalen
 *     Dienstleistungen vor Ablauf der 14-Tage-Frist erlischt, muss der
 *     Verbraucher ausdrücklich zustimmen, dass die Ausführung vor dem
 *     Widerrufsende beginnt, UND seine Kenntnis bestätigen, dass das
 *     Widerrufsrecht damit erlischt.
 *
 * Beide Zustimmungen sind getrennte, NICHT voreingestellte Checkboxen.
 * Erst wenn beide gesetzt sind, wird der Zahlen-Button aktiv.
 */
export function CheckoutConfirmDialog({
  plan,
  open,
  onOpenChange,
  onConfirm,
  loading,
}: Props) {
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [agreedWaiver, setAgreedWaiver] = useState(false)

  // Beim Schließen alle Checkboxen zurücksetzen — bei erneutem Öffnen
  // muss der Nutzer bewusst wieder zustimmen.
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setAgreedTerms(false)
      setAgreedWaiver(false)
    }
    onOpenChange(next)
  }

  const canProceed = agreedTerms && agreedWaiver && !loading

  if (!plan) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-brass-50 text-brass-700 flex items-center justify-center">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center font-heading text-xl">
            Bestellung bestätigen
          </DialogTitle>
          <DialogDescription className="text-center">
            Sie buchen den Tarif{' '}
            <strong className="text-foreground">{plan.name}</strong> zum Preis
            von{' '}
            <strong className="text-foreground">
              {plan.price}
              {plan.period ? ` ${plan.period}` : ''}
            </strong>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* 1) AGB / Datenschutz / Widerruf zur Kenntnis genommen */}
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-brass-600 focus:ring-2 focus:ring-brass-400 cursor-pointer shrink-0"
              aria-label="AGB, Datenschutzerklärung und Widerrufsbelehrung akzeptieren"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              Ich akzeptiere die{' '}
              <Link href="/agb" target="_blank" className="text-brass-700 hover:underline">AGB</Link>
              {' '}und habe die{' '}
              <Link href="/datenschutz" target="_blank" className="text-brass-700 hover:underline">Datenschutzerklärung</Link>
              {' '}sowie die{' '}
              <Link href="/widerruf" target="_blank" className="text-brass-700 hover:underline">Widerrufsbelehrung</Link>
              {' '}zur Kenntnis genommen.
            </span>
          </label>

          {/* 2) Widerrufsrecht-Verzicht gem. § 356 Abs. 5 BGB */}
          <label className="flex items-start gap-2.5 cursor-pointer select-none rounded-lg border border-border bg-muted/30 p-3">
            <input
              type="checkbox"
              checked={agreedWaiver}
              onChange={(e) => setAgreedWaiver(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-brass-600 focus:ring-2 focus:ring-brass-400 cursor-pointer shrink-0"
              aria-label="Widerrufsrecht-Verzicht bestätigen"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              Ich stimme ausdrücklich zu, dass mit der Ausführung der Leistung
              vor Ablauf der 14-tägigen Widerrufsfrist begonnen wird. Mir ist
              bekannt, dass mein{' '}
              <strong className="text-foreground">Widerrufsrecht mit Beginn der Leistungserbringung erlischt</strong>
              {' '}(§&nbsp;356&nbsp;Abs.&nbsp;5 BGB).
            </span>
          </label>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Abbrechen
          </Button>
          {/*
            § 312j Abs. 3 BGB — Button muss eindeutig auf Zahlungspflicht hinweisen.
            "Zahlungspflichtig bestellen" ist der gesetzlich empfohlene Wortlaut.
          */}
          <Button
            className="flex-1 gap-2"
            onClick={onConfirm}
            disabled={!canProceed}
          >
            <Shield className="h-4 w-4" />
            {loading ? 'Weiterleitung…' : 'Zahlungspflichtig bestellen'}
          </Button>
        </div>

        <p className="text-[10px] text-center text-muted-foreground mt-3 leading-relaxed">
          Sie werden im nächsten Schritt sicher zu unserem Zahlungsanbieter
          Stripe weitergeleitet.
        </p>
      </DialogContent>
    </Dialog>
  )
}
