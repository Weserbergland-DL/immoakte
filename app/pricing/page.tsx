'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Check, Mail, ArrowRight, Zap, Building2, Star, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { CheckoutConfirmDialog } from '@/components/checkout/CheckoutConfirmDialog'

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
  { icon: Zap, title: 'Übergabeprotokolle', desc: 'Einzug und Auszug digital — mit Fotos, Zählerständen & Unterschriften' },
  { icon: Star, title: 'Rechtliche Dokumente', desc: 'Mietvertrag, Wohnungsgeberbestätigung, Kautionsbescheinigung — automatisch befüllt' },
]

export default function Pricing() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  // Confirm-Dialog-State: erst Checkbox-Zustimmung, dann Stripe-Redirect.
  // Ohne diesen Zwischenschritt wäre weder die Button-Lösung (§ 312j BGB)
  // noch der Widerrufsverzicht (§ 356 Abs. 5 BGB) erfüllt.
  const [pendingPlan, setPendingPlan] = useState<(typeof PLANS)[number] | null>(null)

  // Schritt 1: Nutzer klickt auf einen Tarif → Dialog öffnen.
  const handlePlanClick = (plan: (typeof PLANS)[number]) => {
    if (!user) {
      toast.error('Bitte melden Sie sich an, um ein Paket zu buchen.')
      router.push('/login')
      return
    }
    setPendingPlan(plan)
  }

  // Schritt 2: Dialog bestätigt → Stripe-Checkout-Session anlegen und weiterleiten.
  const handleConfirmedSubscribe = async () => {
    if (!pendingPlan?.priceKey || !pendingPlan.mode) return
    const priceId = process.env[pendingPlan.priceKey as keyof typeof process.env] as string
    try {
      setLoading(pendingPlan.priceKey)
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, mode: pendingPlan.mode }),
      })
      const data = await response.json()
      if (data.beta) { router.push('/beta'); return }
      if (data.error) throw new Error(data.error)
      if (data.url) window.location.href = data.url
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Weiterleiten zu Stripe.')
      setLoading(null)
    }
    // loading wird absichtlich nicht zurückgesetzt, wenn redirect erfolgt —
    // die Seite wird ohnehin verlassen.
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 sm:py-28 border-b border-border">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brass-600 dark:text-brass-400 mb-3">
              Tarife & Preise
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight text-foreground leading-[1.05] mb-5">
              Einfach. Transparent.<br className="hidden sm:block" /> Ohne Überraschungen.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Übergabeprotokolle, Mietverträge und alle wichtigen Unterlagen — komplett digital, rechtssicher und in Minuten erledigt.
            </p>
          </div>
        </section>

        {/* Product highlights */}
        <section className="py-12 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PRODUCT_HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 bg-card rounded-2xl border border-border px-5 py-4">
                  <div className="mt-0.5 rounded-xl bg-brass-50 p-2 shrink-0">
                    <Icon className="h-4 w-4 text-brass-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing cards */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    'relative flex flex-col rounded-3xl border bg-card overflow-hidden',
                    plan.popular
                      ? 'border-ink-700 shadow-ink ring-1 ring-ink-700/20'
                      : 'border-border shadow-xs'
                  )}
                >
                  {/* Popular accent strip */}
                  {plan.popular && (
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brass-400 via-brass-500 to-brass-400" />
                  )}

                  {plan.badge && (
                    <div className="absolute -top-0 left-0 right-0 flex justify-center pt-3">
                      <span className="bg-brass-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className={cn('p-6 flex flex-col flex-1', plan.badge ? 'pt-10' : '')}>
                    {/* Name */}
                    <div className="mb-4">
                      <h2 className="font-heading text-xl text-foreground">{plan.name}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-1">
                      <span className="text-4xl font-bold text-foreground tracking-tight">{plan.price}</span>
                      {plan.period && (
                        <span className="text-muted-foreground text-sm ml-2">{plan.period}</span>
                      )}
                    </div>

                    <div className="mb-6 h-6">
                      {plan.highlight && (
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                          {plan.highlight}
                        </span>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 flex-1 mb-6">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{f}</span>
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
                        onClick={() => handlePlanClick(plan)}
                        disabled={loading === plan.priceKey}
                      >
                        {loading === plan.priceKey ? 'Lädt…' : plan.cta}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Enterprise */}
            <div className="mt-6 rounded-3xl bg-ink-900 border border-ink-700 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-[11px] text-brass-400 uppercase tracking-wider font-semibold mb-1">Mehr als 50 Protokolle pro Monat?</p>
                <h3 className="font-heading text-2xl text-background leading-tight">Individuell auf Anfrage</h3>
                <p className="text-background/60 text-sm mt-1.5 max-w-md leading-relaxed">
                  Für größere Hausverwaltungen, Immobilienbüros oder Teams schnüren wir ein passendes Paket — inklusive individueller Dokumentvorlagen und Onboarding.
                </p>
              </div>
              <a href="mailto:hallo@immoakte.app" className="shrink-0">
                <Button className="bg-brass-400 text-ink-900 hover:bg-brass-300 shadow-brass font-semibold gap-2">
                  <Mail className="h-4 w-4" />
                  Angebot anfragen
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Alle Preise zzgl. gesetzl. MwSt. · Abonnements monatlich kündbar · Keine automatische Verlängerung ohne Kündigung
            </p>
          </div>
        </section>
      </main>
      <Footer />

      {/* Confirm-Dialog vor Stripe-Weiterleitung.
          Erfüllt § 312j BGB (Button-Lösung) und § 356 Abs. 5 BGB (Widerrufsverzicht). */}
      <CheckoutConfirmDialog
        plan={pendingPlan ? {
          name: pendingPlan.name,
          price: pendingPlan.price,
          period: pendingPlan.period,
          mode: pendingPlan.mode ?? 'subscription',
        } : null}
        open={pendingPlan !== null}
        onOpenChange={(open) => { if (!open) setPendingPlan(null) }}
        onConfirm={handleConfirmedSubscribe}
        loading={loading !== null}
      />
    </div>
  )
}
