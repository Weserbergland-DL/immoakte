'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Check, Mail, ArrowRight, Zap, Building2, Star } from 'lucide-react'
import { toast } from 'sonner'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const FEATURES_ALL = [
  'Mietverhältnisse verwalten',
  'Einzugs- & Auszugsprotokolle',
  'Vollständiger PDF-Export',
  'Digitale Unterschriften beider Parteien',
  'Fotos & Zählerstände erfassen',
]

const PLANS = [
  {
    id: 'free',
    name: 'Gratis',
    description: 'Zum Kennenlernen',
    price: '0 €',
    period: null,
    badge: null,
    highlight: null,
    features: [
      ...FEATURES_ALL,
      '1 Protokoll kostenlos abschließen',
      'Mietvertrag, Wohnungsgeberbestätigung & mehr',
    ],
    cta: 'Kostenlos starten',
    ctaVariant: 'outline' as const,
    href: '/login?mode=signup',
    priceKey: null,
    mode: null,
    popular: false,
  },
  {
    id: 'single',
    name: 'Flex',
    description: 'Ohne Abo, ohne Bindung',
    price: '9,99 €',
    period: 'pro Abschluss',
    badge: null,
    highlight: 'Einmalzahlung',
    features: [
      ...FEATURES_ALL,
      '1 Protokoll nach Bedarf abschließen',
      'Alle Dokumentvorlagen inklusive',
      'Einmalzahlung – kein Abo',
    ],
    cta: 'Protokoll kaufen',
    ctaVariant: 'outline' as const,
    href: null,
    priceKey: 'NEXT_PUBLIC_STRIPE_PRICE_ONDEMAND',
    mode: 'payment' as const,
    popular: false,
  },
  {
    id: '10pack',
    name: 'Standard',
    description: 'Für Privatvermieter',
    price: '19,99 €',
    period: 'pro Monat',
    badge: 'Meistgewählt',
    highlight: '= 2,00 € / Protokoll',
    features: [
      ...FEATURES_ALL,
      '10 Protokolle pro Monat',
      'Alle Dokumentvorlagen inklusive',
      'Mietvertrag mit automatischen Platzhaltern',
      'Monatlich kündbar',
    ],
    cta: 'Standard wählen',
    ctaVariant: 'default' as const,
    href: null,
    priceKey: 'NEXT_PUBLIC_STRIPE_PRICE_10PACK',
    mode: 'subscription' as const,
    popular: true,
  },
  {
    id: '50pack',
    name: 'Pro',
    description: 'Für Makler & Hausverwaltungen',
    price: '39,99 €',
    period: 'pro Monat',
    badge: null,
    highlight: '= 0,80 € / Protokoll',
    features: [
      ...FEATURES_ALL,
      '50 Protokolle pro Monat',
      'Alle Dokumentvorlagen inklusive',
      'Mietvertrag mit automatischen Platzhaltern',
      'Monatlich kündbar',
      'Prioritäts-Support',
    ],
    cta: 'Pro wählen',
    ctaVariant: 'outline' as const,
    href: null,
    priceKey: 'NEXT_PUBLIC_STRIPE_PRICE_50PACK',
    mode: 'subscription' as const,
    popular: false,
  },
]

const PRODUCT_HIGHLIGHTS = [
  { icon: Building2, title: 'Mietverhältnisse', desc: 'Alle Mieter, Immobilien und Verträge an einem Ort verwalten' },
  { icon: Zap, title: 'Übergabeprotokolle', desc: 'Einzug und Auszug digital erfassen — mit Fotos, Zählerständen & Unterschriften' },
  { icon: Star, title: 'Rechtliche Dokumente', desc: 'Mietvertrag, Wohnungsgeberbestätigung, Kautionsbescheinigung — automatisch befüllt' },
]

export default function Pricing() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (priceKey: string, mode: 'payment' | 'subscription') => {
    if (!user) {
      toast.error('Bitte melden Sie sich an, um ein Paket zu buchen.')
      router.push('/login')
      return
    }
    const priceId = process.env[priceKey as keyof typeof process.env] as string
    try {
      setLoading(priceKey)
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, mode }),
      })
      const data = await response.json()
      if (data.beta) { router.push('/beta'); return }
      if (data.error) throw new Error(data.error)
      if (data.url) window.location.href = data.url
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Weiterleiten zu Stripe.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-6xl">

        {/* Hero */}
        <div className="text-center mb-14">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-3">
            Tarife & Preise
          </h1>
          <p className="text-base text-slate-500 max-w-2xl mx-auto">
            Übergabeprotokolle, Mietverträge und alle wichtigen Unterlagen — komplett digital, rechtssicher und in Minuten erledigt.
          </p>
        </div>

        {/* Product highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-14">
          {PRODUCT_HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 bg-white rounded-xl border border-slate-200 px-5 py-4 shadow-sm">
              <div className="mt-0.5 rounded-lg bg-primary/10 p-2 shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border bg-white shadow-sm ${
                plan.popular
                  ? 'border-primary border-2 shadow-md shadow-primary/10'
                  : 'border-slate-200'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full shadow whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className={`p-6 flex flex-col flex-1 ${plan.badge ? 'pt-8' : ''}`}>

                {/* Name & description */}
                <div className="mb-4">
                  <h2 className="text-base font-bold text-slate-900">{plan.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-1">
                  <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                  {plan.period && (
                    <span className="text-slate-400 text-sm ml-1.5">{plan.period}</span>
                  )}
                </div>

                {/* Sub-price / highlight */}
                <div className="mb-5 h-6">
                  {plan.highlight && (
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                      {plan.highlight}
                    </span>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {plan.href ? (
                  <Link href={plan.href}>
                    <Button variant={plan.ctaVariant} className="w-full">{plan.cta}</Button>
                  </Link>
                ) : (
                  <Button
                    variant={plan.ctaVariant}
                    className="w-full"
                    onClick={() => plan.priceKey && plan.mode && handleSubscribe(plan.priceKey, plan.mode)}
                    disabled={loading === plan.priceKey}
                  >
                    {loading === plan.priceKey ? 'Lädt...' : plan.cta}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Enterprise */}
        <div className="mt-6 max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-slate-900 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Mehr als 50 Protokolle pro Monat?</p>
            <h3 className="text-lg font-semibold text-white">Individuell auf Anfrage</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-sm">
              Für größere Hausverwaltungen, Immobilienbüros oder Teams schnüren wir ein passendes Paket — inklusive individueller Dokumentvorlagen und Onboarding.
            </p>
          </div>
          <a href="mailto:hallo@protokoll-pro.de" className="shrink-0">
            <Button className="bg-white text-slate-900 hover:bg-slate-100 font-medium gap-2 shadow-sm">
              <Mail className="h-4 w-4" />
              Angebot anfragen
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
        </div>

        {/* Legal note */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Alle Preise zzgl. gesetzl. MwSt. · Abonnements monatlich kündbar · Keine automatische Verlängerung ohne Kündigung
        </p>
      </main>
      <Footer />
    </div>
  )
}
