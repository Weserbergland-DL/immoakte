'use client'

/**
 * Cookie-Consent-Banner für Google Analytics 4.
 *
 * GA4 setzt echte Cookies (`_ga`, `_ga_<id>`) und überträgt Daten an
 * Google in den USA — daher ist Consent nach TTDSG/DSGVO Pflicht.
 * Wir laden `gtag.js` ausschließlich nach aktiver Zustimmung.
 *
 * Die Wahl wird in `localStorage` unter `immoakte:consent` abgelegt:
 *   - `granted`  → GA-Skript aktiv, Cookies werden gesetzt
 *   - `denied`   → kein Skript, keine Cookies, keine Requests
 *   - kein Wert  → Banner sichtbar
 *
 * Wenn `NEXT_PUBLIC_GA_ID` nicht gesetzt ist (z.B. lokal), erscheint
 * das Banner trotzdem, lädt aber natürlich nichts.
 */

import { useEffect, useState } from 'react'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import { Button } from '@/components/ui/button'
import { Cookie } from 'lucide-react'
import Link from 'next/link'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || ''

const CONSENT_KEY = 'immoakte:consent'

type ConsentValue = 'granted' | 'denied' | null

function readConsent(): ConsentValue {
  if (typeof window === 'undefined') return null
  const v = window.localStorage.getItem(CONSENT_KEY)
  return v === 'granted' || v === 'denied' ? v : null
}

function writeConsent(v: 'granted' | 'denied') {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CONSENT_KEY, v)
}

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentValue>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setConsent(readConsent())
    setHydrated(true)
  }, [])

  const accept = () => {
    writeConsent('granted')
    setConsent('granted')
  }
  const decline = () => {
    writeConsent('denied')
    setConsent('denied')
  }

  // Nichts rendern, bevor wir wissen, ob localStorage einen Wert hat —
  // sonst Hydration-Mismatch.
  if (!hydrated) return null

  return (
    <>
      {/* GA4 nur laden, wenn der Nutzer aktiv zugestimmt hat. */}
      {consent === 'granted' && GA_ID && <GoogleAnalytics measurementId={GA_ID} />}

      {consent === null && (
        <div
          role="dialog"
          aria-labelledby="consent-title"
          aria-describedby="consent-desc"
          className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:max-w-md z-[60] rounded-2xl border border-border bg-card shadow-lg p-5 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-9 w-9 rounded-xl bg-brass-50 dark:bg-brass-900/30 flex items-center justify-center shrink-0">
              <Cookie className="h-4 w-4 text-brass-700 dark:text-brass-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p
                id="consent-title"
                className="font-heading text-base text-foreground"
              >
                Anonyme Nutzungsstatistik?
              </p>
              <p
                id="consent-desc"
                className="mt-1.5 text-sm text-muted-foreground leading-relaxed"
              >
                Wir würden gerne <strong>Google Analytics 4</strong> nutzen,
                um zu verstehen, welche Funktionen am häufigsten verwendet
                werden. Dabei werden Cookies gesetzt und IP-Adressen
                (anonymisiert) an Google in den USA übertragen. Du kannst
                jederzeit ablehnen — die App funktioniert genauso. Details in
                der{' '}
                <Link
                  href="/datenschutz"
                  className="underline hover:text-foreground transition-colors"
                >
                  Datenschutzerklärung
                </Link>
                .
              </p>
              <div className="mt-4 flex flex-col-reverse sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={decline}
                  className="flex-1 sm:flex-none"
                >
                  Ablehnen
                </Button>
                <Button
                  size="sm"
                  onClick={accept}
                  className="flex-1 sm:flex-none"
                >
                  Erlauben
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Kleines UI-Element für die Datenschutz-Seite, mit dem User ihre Wahl
 * jederzeit zurücknehmen oder ändern können.
 */
export function ConsentControls() {
  const [consent, setConsent] = useState<ConsentValue>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setConsent(readConsent())
    setHydrated(true)
  }, [])

  if (!hydrated) return null

  const reset = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(CONSENT_KEY)
    }
    setConsent(null)
  }
  const setGranted = () => {
    writeConsent('granted')
    setConsent('granted')
  }
  const setDenied = () => {
    writeConsent('denied')
    setConsent('denied')
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-medium text-foreground">
        Aktueller Status:{' '}
        {consent === 'granted' && (
          <span className="text-emerald-700 dark:text-emerald-400">
            Statistik erlaubt
          </span>
        )}
        {consent === 'denied' && (
          <span className="text-muted-foreground">
            Statistik abgelehnt
          </span>
        )}
        {consent === null && (
          <span className="text-muted-foreground">Noch keine Wahl getroffen</span>
        )}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={setGranted} disabled={consent === 'granted'}>
          Erlauben
        </Button>
        <Button size="sm" variant="outline" onClick={setDenied} disabled={consent === 'denied'}>
          Ablehnen
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          Zurücksetzen
        </Button>
      </div>
    </div>
  )
}
