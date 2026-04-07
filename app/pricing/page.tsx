'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Zap } from 'lucide-react'
import { toast } from 'sonner'
import Header from '@/components/layout/Header'

export default function Pricing() {
  const { user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (priceId: string, mode: 'payment' | 'subscription') => {
    if (!user) {
      toast.error('Bitte melden Sie sich an, um ein Paket zu buchen.')
      return
    }

    try {
      setLoading(priceId)
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, mode }),
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)
      if (data.url) window.location.href = data.url
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Fehler beim Weiterleiten zu Stripe.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-4">
            Einfache Preise für jedes Bedürfnis
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Egal ob Sie nur einmalig eine Wohnung übergeben oder als Profi täglich Protokolle erstellen – wir haben das passende Paket.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Free / Test</CardTitle>
              <CardDescription>Für Neugierige zum Ausprobieren</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">0 €</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                <li className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /><span>1 Protokoll einmalig</span></li>
                <li className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /><span>Basis-PDF Export</span></li>
                <li className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /><span>Standard-Vorlagen</span></li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>Aktueller Tarif</Button>
            </CardFooter>
          </Card>

          <Card className="flex flex-col border-primary shadow-lg relative">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Zap className="h-3 w-3" /> Beliebt
              </span>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">On-Demand</CardTitle>
              <CardDescription>Für Privatvermieter &amp; Gelegenheitsnutzer</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">9,90 €</span>
                <span className="text-slate-500 ml-2">/ Protokoll</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                <li className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /><span>Einmalzahlung, kein Abo</span></li>
                <li className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /><span>Voller Funktionsumfang</span></li>
                <li className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /><span>Digitale Signatur</span></li>
                <li className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /><span>Fotos &amp; Mängeldokumentation</span></li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_ONDEMAND!, 'payment')}
                disabled={loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_ONDEMAND}
              >
                {loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_ONDEMAND ? 'Lädt...' : 'Jetzt kaufen'}
              </Button>
            </CardFooter>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Pro (Solo)</CardTitle>
              <CardDescription>Für Makler &amp; kleine Hausverwaltungen</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">14,99 €</span>
                <span className="text-slate-500 ml-2">/ Monat</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                <li className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /><span>Bis zu 50 Protokolle / Monat</span></li>
                <li className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /><span>Eigenes Firmenlogo auf PDFs</span></li>
                <li className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /><span>Cloud-Speicher &amp; Archivierung</span></li>
                <li className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /><span>Premium Support</span></li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSubscribe(process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!, 'subscription')}
                disabled={loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO}
              >
                {loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ? 'Lädt...' : 'Abo abschließen'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-16 text-center text-slate-500">
          <p>Alle Preise verstehen sich zzgl. der gesetzlichen Mehrwertsteuer.</p>
          <p className="mt-2">Benötigen Sie eine Lösung für Ihr ganzes Team? <a href="#" className="text-primary hover:underline">Kontaktieren Sie uns für den Business-Tarif.</a></p>
        </div>
      </main>
    </div>
  )
}
