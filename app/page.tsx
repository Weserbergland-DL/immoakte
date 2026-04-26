'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  ClipboardCheck, ShieldCheck, Camera, FileSignature, ArrowRight,
  Sparkles, Home as HomeIcon, Key, Zap, FileText, CheckCircle2,
  Smartphone, Lock, Download,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useEffect, useRef, useState } from 'react'
import { HeroPhoneCarousel } from '@/components/brand/HeroPhoneCarousel'
import { Reveal, RevealStagger, RevealItem } from '@/components/brand/Reveal'
import { motion, useInView } from 'motion/react'
import { Badge } from '@/components/ui/badge'

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main>
        <Hero />
        <TrustRow />
        <VorherNachher />
        <HowItWorks />
        <FeatureDeepDive />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}

/* ========================= HERO ========================= */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 -z-10 bg-hero-glow" />
      <div className="absolute inset-0 -z-10 bg-ledger opacity-40" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-brass-400/40 to-transparent" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
          {/* Left: Copy — individual entrance animations for reliable playback */}
          <div className="max-w-xl">
            <motion.span
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
              className="inline-flex items-center gap-2 rounded-full border border-brass-300/60 bg-brass-50 px-3.5 py-1 text-xs font-semibold text-brass-800 dark:bg-brass-900/30 dark:border-brass-700/40 dark:text-brass-200"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Kostenlos starten · kein Abo nötig
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.13 }}
              className="mt-6 font-heading text-5xl sm:text-6xl lg:text-[72px] leading-[0.98] tracking-[-0.02em] text-foreground"
            >
              Die digitale Akte{' '}
              <span className="italic text-brass-700 dark:text-brass-300">für jedes</span>{' '}
              Mietverhältnis.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
              className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-lg"
            >
              Mietvertrag, Einzugsprotokoll, Wohnungsgeberbestätigung, Kautionsbescheinigung, Auszugsprotokoll — alles in einer App. Rechtssicher, strukturiert, fertig als PDF.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.32 }}
              className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <Link href="/dashboard">
                <Button size="lg" className="h-12 px-6 text-[15px] shadow-ink hover:shadow-lg transition-shadow">
                  Jetzt loslegen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
            <motion.ul
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.42 }}
              className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground"
            >
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Keine Kreditkarte nötig
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> DSGVO-konform
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Sofort einsatzbereit
              </li>
            </motion.ul>
          </div>

          {/* Right: Phone mockup cycling through real app screens.
               Annotation pills live INSIDE the carousel — they swap with the
               current screen and stay pinned to the phone.
               Note: we center (not flush-right) on desktop so the right-side
               pill has room to breathe without overflowing the viewport. */}
          <div className="relative flex justify-center lg:justify-center lg:pr-8 xl:pr-16">
            {/* Soft brass glow behind phone */}
            <div className="absolute inset-x-10 top-12 bottom-16 bg-brass-200/40 dark:bg-brass-500/10 rounded-full blur-3xl -z-10" />
            <HeroPhoneCarousel />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ========================= TRUST ROW ========================= */
function TrustRow() {
  const segments = ['Privatvermieter', 'Hausverwaltungen', 'Maklerbüros', 'WEGs', 'Genossenschaften']
  return (
    <section className="border-y border-border/60 bg-card/50 py-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground shrink-0">
            Gebaut für
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            {segments.map((s) => (
              <span key={s} className="font-heading text-lg text-foreground/70 tracking-tight">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ========================= VORHER / NACHHER ========================= */
function VorherNachher() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brass-600 dark:text-brass-400 mb-3">
            Vom Zettel zur Akte
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl tracking-tight text-foreground leading-[1.05]">
            Schluss mit Papierchaos und Ordner-Wirrwarr.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            Mietverträge in drei Ordnern, Protokolle auf dem Klemmbrett, Belege im Stapel. Das kostet Zeit — und Nerven. Es geht besser.
          </p>
        </Reveal>

        <RevealStagger className="grid md:grid-cols-2 gap-6 lg:gap-10 items-stretch" staggerChildren={0.15}>
          {/* VORHER */}
          <RevealItem className="relative">
            <div className="absolute -top-3 left-6 z-10">
              <Badge variant="outline" className="bg-background">Vorher</Badge>
            </div>
            <div className="relative rounded-3xl border border-border bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-800 dark:to-stone-900 p-8 overflow-hidden h-full min-h-[360px]">
              <PaperIllustration />
              <div className="relative mt-6">
                <h3 className="font-heading text-2xl text-foreground">Der alte Papierstapel</h3>
                <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex gap-2.5"><span className="text-red-600">✕</span> Mietvertrag auf dem Klemmbrett, unleserlich</li>
                  <li className="flex gap-2.5"><span className="text-red-600">✕</span> Protokoll und Fotos getrennt aufbewahrt</li>
                  <li className="flex gap-2.5"><span className="text-red-600">✕</span> Belege verteilt auf Ordner und E-Mails</li>
                  <li className="flex gap-2.5"><span className="text-red-600">✕</span> Im Streitfall kaum rechtssicher nachweisbar</li>
                </ul>
              </div>
            </div>
          </RevealItem>

          {/* NACHHER */}
          <RevealItem className="relative">
            <div className="absolute -top-3 left-6 z-10">
              <Badge variant="brass">Mit ImmoAkte</Badge>
            </div>
            <div className="relative rounded-3xl border border-border bg-gradient-to-br from-brass-50 via-background to-background dark:from-brass-900/20 p-8 overflow-hidden h-full min-h-[360px] shadow-sm">
              <DigitalIllustration />
              <div className="relative mt-6">
                <h3 className="font-heading text-2xl text-foreground">Die vollständige ImmoAkte</h3>
                <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex gap-2.5"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> Alle Dokumente je Mietverhältnis gebündelt</li>
                  <li className="flex gap-2.5"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> Protokoll mit Fotos, Zählern & Signaturen</li>
                  <li className="flex gap-2.5"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> Mietvertrag & Pflichtdokumente immer parat</li>
                  <li className="flex gap-2.5"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> Rechtssichere PDFs auf Knopfdruck</li>
                </ul>
              </div>
            </div>
          </RevealItem>
        </RevealStagger>
      </div>
    </section>
  )
}

/* Inline paper chaos illustration */
function PaperIllustration() {
  return (
    <svg viewBox="0 0 320 180" className="w-full h-40" aria-hidden="true">
      {/* crumpled paper 1 - back */}
      <g transform="translate(40 30) rotate(-8)">
        <rect x="0" y="0" width="120" height="150" fill="#f5f4f0" stroke="#d4cec2" strokeWidth="1" rx="2" />
        <line x1="12" y1="18" x2="95" y2="18" stroke="#a8a294" strokeWidth="1" />
        <line x1="12" y1="30" x2="108" y2="30" stroke="#a8a294" strokeWidth="0.8" />
        <line x1="12" y1="42" x2="85" y2="42" stroke="#a8a294" strokeWidth="0.8" />
        <line x1="12" y1="54" x2="100" y2="54" stroke="#a8a294" strokeWidth="0.8" />
        <line x1="12" y1="66" x2="90" y2="66" stroke="#a8a294" strokeWidth="0.8" />
        {/* scribble */}
        <path d="M 20 90 Q 35 80 50 95 T 85 92" stroke="#1e2a47" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M 20 108 Q 40 102 58 112" stroke="#1e2a47" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Coffee stain */}
        <ellipse cx="95" cy="125" rx="14" ry="11" fill="#c9974b" opacity="0.28" />
        <ellipse cx="95" cy="125" rx="10" ry="8" fill="#a87d34" opacity="0.22" />
      </g>
      {/* paper 2 - front */}
      <g transform="translate(170 20) rotate(6)">
        <rect x="0" y="0" width="110" height="140" fill="#faf8f3" stroke="#d4cec2" strokeWidth="1" rx="2" />
        <line x1="10" y1="16" x2="90" y2="16" stroke="#a8a294" strokeWidth="0.8" />
        <line x1="10" y1="26" x2="95" y2="26" stroke="#a8a294" strokeWidth="0.8" />
        <line x1="10" y1="36" x2="80" y2="36" stroke="#a8a294" strokeWidth="0.8" />
        {/* crossed out */}
        <line x1="20" y1="60" x2="88" y2="78" stroke="#c94a38" strokeWidth="1.8" />
        <line x1="20" y1="78" x2="88" y2="60" stroke="#c94a38" strokeWidth="1.8" />
        {/* signature scribble */}
        <path d="M 15 110 Q 25 100 32 108 Q 40 118 48 106 Q 56 94 66 104 Q 75 114 88 108" stroke="#1e2a47" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <line x1="15" y1="122" x2="92" y2="122" stroke="#a8a294" strokeWidth="0.6" />
      </g>
      {/* tear */}
      <g transform="translate(290 80) rotate(18)">
        <path d="M 0 0 L 20 5 L 22 18 L 5 20 Z" fill="#f5f4f0" stroke="#d4cec2" strokeWidth="0.8" />
      </g>
    </svg>
  )
}

/* Inline digital counterpart illustration */
function DigitalIllustration() {
  return (
    <svg viewBox="0 0 320 180" className="w-full h-40" aria-hidden="true">
      {/* Phone silhouette */}
      <g transform="translate(110 12)">
        <rect x="0" y="0" width="100" height="160" rx="14" fill="#1e2a47" />
        <rect x="4" y="4" width="92" height="152" rx="11" fill="#faf8f3" />
        {/* island */}
        <rect x="38" y="10" width="24" height="6" rx="3" fill="#1e2a47" />
        {/* content lines */}
        <rect x="12" y="26" width="40" height="6" rx="1" fill="#c9974b" opacity="0.5" />
        <rect x="12" y="38" width="64" height="5" rx="1" fill="#292524" opacity="0.7" />
        <rect x="12" y="47" width="50" height="4" rx="1" fill="#78716c" />
        {/* cards */}
        <rect x="12" y="60" width="76" height="20" rx="3" fill="#ffffff" stroke="#e9e5dd" strokeWidth="0.8" />
        <circle cx="22" cy="70" r="3" fill="#2f8a47" />
        <rect x="30" y="67" width="30" height="3" fill="#292524" opacity="0.6" />
        <rect x="66" y="66" width="18" height="8" rx="4" fill="#d8f2de" />
        <rect x="12" y="84" width="76" height="20" rx="3" fill="#ffffff" stroke="#e9e5dd" strokeWidth="0.8" />
        <circle cx="22" cy="94" r="3" fill="#c94a38" />
        <rect x="30" y="91" width="34" height="3" fill="#292524" opacity="0.6" />
        <rect x="66" y="90" width="20" height="8" rx="4" fill="#fbe7e4" />
        <rect x="12" y="108" width="76" height="20" rx="3" fill="#ffffff" stroke="#e9e5dd" strokeWidth="0.8" />
        <circle cx="22" cy="118" r="3" fill="#2f8a47" />
        <rect x="30" y="115" width="28" height="3" fill="#292524" opacity="0.6" />
        {/* CTA */}
        <rect x="12" y="136" width="76" height="14" rx="3" fill="#1e2a47" />
        <rect x="36" y="141" width="28" height="4" rx="0.5" fill="#faf8f3" />
      </g>
      {/* sparkle */}
      <g transform="translate(70 40)">
        <path d="M 0 -8 L 2 -2 L 8 0 L 2 2 L 0 8 L -2 2 L -8 0 L -2 -2 Z" fill="#c9974b" opacity="0.6"/>
      </g>
      <g transform="translate(250 120)">
        <path d="M 0 -5 L 1 -1 L 5 0 L 1 1 L 0 5 L -1 1 L -5 0 L -1 -1 Z" fill="#c9974b" opacity="0.5"/>
      </g>
    </svg>
  )
}

/* ========================= HOW IT WORKS ========================= */
function HowItWorks() {
  const steps = [
    {
      n: '01',
      icon: ClipboardCheck,
      title: 'Mietverhältnis anlegen',
      desc: 'Mieter, Adresse und Mietbeginn eintragen — die Akte ist sofort bereit für alle Dokumente und Protokolle.',
    },
    {
      n: '02',
      icon: Camera,
      title: 'Dokumente erstellen',
      desc: 'Mietvertrag ausfüllen, Einzugsprotokoll vor Ort aufnehmen, Pflichtdokumente in Minuten abschließen.',
    },
    {
      n: '03',
      icon: FileSignature,
      title: 'Unterschreiben & archivieren',
      desc: 'Digital signieren, PDF exportieren, per E-Mail versenden — alles bleibt sicher in der Akte gespeichert.',
    },
  ]
  return (
    <section className="py-24 sm:py-28 bg-muted/40 border-y border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brass-600 dark:text-brass-400 mb-3">
            So einfach geht's
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl tracking-tight text-foreground leading-[1.05]">
            Drei Schritte. Kein Schreibtisch nötig.
          </h2>
        </Reveal>
        <div className="relative">
          {/* Animated progress line connecting the 3 step cards on desktop.
              Draws from left to right when the steps enter the viewport. */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'left' }}
            className="hidden md:block absolute top-[88px] left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-brass-400/70 to-transparent pointer-events-none"
          />
          <RevealStagger className="grid gap-6 md:grid-cols-3" staggerChildren={0.18}>
            {steps.map((s) => (
              <RevealItem key={s.n} className="relative group">
                <div className="h-full rounded-2xl border border-border bg-card p-7 shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                  {/* Nummer + Icon auf derselben Zeile — vorher gestapelt, auf
                      Mobile sah das nach unnötigem Leerraum aus. */}
                  <div className="flex items-center gap-4">
                    <span className="font-heading text-[40px] text-brass-400/80 dark:text-brass-500/70 leading-none">{s.n}</span>
                    <div className="h-11 w-11 rounded-xl bg-ink-50 dark:bg-ink-800/40 flex items-center justify-center shrink-0">
                      <s.icon className="h-5 w-5 text-ink-700 dark:text-brass-300" />
                    </div>
                  </div>
                  <h3 className="mt-5 font-heading text-xl text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </div>
    </section>
  )
}

/* ========================= FEATURE DEEP DIVE ========================= */
function FeatureDeepDive() {
  const features = [
    {
      kicker: 'Verträge & Pflichtdokumente',
      title: 'Alles, was vor dem Einzug nötig ist.',
      desc: 'Mietvertrag ausfüllen, Wohnungsgeberbestätigung erstellen, Kautionsbescheinigung ausstellen — Platzhalter werden automatisch mit Mieterdaten befüllt.',
      bullets: ['Mietvertrag mit Auto-Befüllung', 'Wohnungsgeberbestätigung auf Knopfdruck', 'Kautionsbescheinigung & eigene Dokumente'],
      icon: FileText,
      accent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
    },
    {
      kicker: 'Übergabeprotokolle',
      title: 'Ein- und Auszug. Lückenlos dokumentiert.',
      desc: 'Räume, Mängel, Fotos, Zählerstände und Schlüssel — alles strukturiert erfasst. Beim Auszug werden Einzugsdaten automatisch übernommen.',
      bullets: ['Räume mit Foto-Mängelliste', 'Zählerstände mit Display-Foto', 'Schlüsselübergabe als nummerierte Liste'],
      icon: HomeIcon,
      accent: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    },
    {
      kicker: 'Unterschrift & PDF',
      title: 'Rechtssicher in einer Minute.',
      desc: 'Beide Parteien unterschreiben mit dem Finger auf dem Display. Das PDF enthält Signaturen, Fotos, Zeitstempel und lässt sich nicht manipulieren.',
      bullets: ['Digitale Signatur mit Zeitstempel', 'PDF-Export nach deutschem Standard', 'Versand per E-Mail direkt aus der App'],
      icon: FileSignature,
      accent: 'bg-brass-100 text-brass-800 dark:bg-brass-900/30 dark:text-brass-300',
    },
  ]
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="text-center max-w-2xl mx-auto mb-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brass-600 dark:text-brass-400 mb-3">
            Was drin ist
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl tracking-tight text-foreground leading-[1.05]">
            Alles, was eine vollständige Mieterakte braucht.
          </h2>
        </Reveal>
        <div className="space-y-20 sm:space-y-28">
          {features.map((f, i) => (
            <Reveal key={i} y={32} duration={0.7} className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brass-600 dark:text-brass-400 mb-3">{f.kicker}</p>
                <h3 className="font-heading text-3xl sm:text-4xl tracking-tight text-foreground leading-[1.1]">{f.title}</h3>
                <p className="mt-5 text-lg text-muted-foreground leading-relaxed">{f.desc}</p>
                <ul className="mt-8 space-y-3">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <span className={`mt-0.5 h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${f.accent}`}>
                        <f.icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[15px] text-foreground/90">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <FeatureVisual kind={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureVisual({ kind }: { kind: number }) {
  if (kind === 0) return <RoomsVisual />
  if (kind === 1) return <MetersVisual />
  return <SignatureVisual />
}

function RoomsVisual() {
  const rooms = [
    { name: 'Wohnzimmer', status: 'final' as const, label: 'OK' },
    { name: 'Küche', status: 'alert' as const, label: '2 Mängel' },
    { name: 'Schlafzimmer', status: 'final' as const, label: 'OK' },
    { name: 'Badezimmer', status: 'alert' as const, label: '1 Mangel' },
    { name: 'Flur', status: 'final' as const, label: 'OK' },
  ]
  return (
    <div className="relative rounded-3xl border border-border bg-gradient-to-br from-muted/60 to-background p-6 sm:p-8 shadow-md overflow-hidden">
      <div className="absolute inset-0 bg-ledger opacity-30 pointer-events-none" />
      <motion.div
        className="relative space-y-3"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.3 }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.18, delayChildren: 0.15 } } }}
      >
        {rooms.map((r) => (
          <motion.div
            key={r.name}
            variants={{ hidden: { opacity: 0, x: -24 }, visible: { opacity: 1, x: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } } }}
            className="flex items-center justify-between bg-card rounded-xl border border-border px-4 py-3 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <HomeIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{r.name}</span>
            </div>
            <Badge variant={r.status} size="sm">{r.label}</Badge>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

/** Digital-display counter — counts from 0 up to `target` over `duration` seconds
 *  whenever it enters the viewport (fires once). */
function CountUp({ target, duration = 2.4, className }: { target: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  // once: false — counter resets and counts up again each time the section
  // re-enters the viewport. Duration is long enough (~2.4s) to actually be
  // perceivable even on a fast scroll.
  const inView = useInView(ref, { once: false, amount: 0.5 })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) { setValue(0); return }
    let raf: number
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000))
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, target, duration])

  // Format as "00.000" with a dot-thousand separator
  const padded = value.toString().padStart(5, '0')
  const formatted = `${padded.slice(0, -3)}.${padded.slice(-3)}`
  return <span ref={ref} className={className}>{formatted}</span>
}

function MetersVisual() {
  const meters = [
    { type: 'Strom',       num: '1A3B-2024', target: 8214, icon: Zap, color: 'text-amber-600' },
    { type: 'Wasser kalt', num: 'WK-992',    target: 432,  icon: Zap, color: 'text-blue-600' },
    { type: 'Wasser warm', num: 'WW-992',    target: 118,  icon: Zap, color: 'text-red-600' },
    { type: 'Gas',         num: 'G-7741',    target: 4081, icon: Zap, color: 'text-orange-600' },
  ]
  return (
    <div className="relative rounded-3xl border border-border bg-gradient-to-br from-amber-50/50 via-background to-background p-6 sm:p-8 shadow-md overflow-hidden">
      <div className="relative grid grid-cols-2 gap-3">
        {meters.map((m) => (
          <div key={m.type} className="bg-card rounded-xl border border-border p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
              </span>
              <span className="text-xs font-medium text-foreground">{m.type}</span>
            </div>
            <CountUp target={m.target} className="font-heading text-2xl tracking-tight text-foreground tabular-nums block" />
            <p className="text-[10px] text-muted-foreground mt-1">Nr. {m.num}</p>
          </div>
        ))}
      </div>
      {/* Keys summary — staggered pills on scroll */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.4 }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.18, delayChildren: 0.9 } } }}
        className="relative mt-4 bg-card rounded-xl border border-border p-4 shadow-xs"
      >
        <div className="flex items-center gap-2 mb-2">
          <Key className="h-4 w-4 text-brass-600" />
          <span className="text-xs font-medium text-foreground">Schlüsselübergabe</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['3× Haustür', '2× Wohnung', '1× Keller', '1× Briefkasten'].map((k) => (
            <motion.span
              key={k}
              variants={{ hidden: { opacity: 0, scale: 0.85 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } }}
              className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-foreground/80"
            >
              {k}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function SignatureVisual() {
  const ref = useRef<HTMLDivElement>(null)
  // Continuous loop while section is in view: draw → hold → erase → redraw.
  // Total cycle ≈ 8s — the signatures are visible long enough to read, then
  // gently erase and play again.
  const inView = useInView(ref, { once: false, amount: 0.4 })

  // pathLength keyframes: [empty, fully drawn, held fully drawn, erased].
  // `times` distributes those frames across the duration: 25% draw, 60% hold,
  // 15% erase.
  const loopKeyframes = {
    pathLength: [0, 1, 1, 0],
    transition: {
      duration: 8,
      times: [0, 0.25, 0.85, 1],
      ease: 'easeInOut' as const,
      repeat: Infinity,
    },
  }
  return (
    <div ref={ref} className="relative rounded-3xl border border-border bg-gradient-to-br from-brass-50/60 via-background to-background p-6 sm:p-8 shadow-md overflow-hidden">
      <div className="absolute inset-0 bg-paper-grain pointer-events-none" />
      <div className="relative grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2">Vermieter</p>
          <svg viewBox="0 0 160 60" className="w-full h-14 border-b-2 border-foreground/70">
            <motion.path
              d="M 10 45 Q 20 20 30 35 T 60 30 Q 75 15 85 35 T 120 32 L 145 40"
              stroke="currentColor"
              className="text-ink-900 dark:text-foreground"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={inView ? loopKeyframes : { pathLength: 0 }}
            />
          </svg>
          <p className="mt-2 text-xs text-foreground font-medium">Max Mustermann</p>
          <p className="text-[10px] text-muted-foreground">14.04.2026, 14:32 Uhr</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2">Mieter</p>
          <svg viewBox="0 0 160 60" className="w-full h-14 border-b-2 border-foreground/70">
            <motion.path
              d="M 15 40 Q 25 10 40 30 Q 55 50 70 25 T 105 35 Q 120 15 135 38"
              stroke="currentColor"
              className="text-ink-900 dark:text-foreground"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={inView ? {
                ...loopKeyframes,
                transition: { ...loopKeyframes.transition, delay: 1.2 },
              } : { pathLength: 0 }}
            />
          </svg>
          <p className="mt-2 text-xs text-foreground font-medium">Sarah Meier</p>
          <p className="text-[10px] text-muted-foreground">14.04.2026, 14:33 Uhr</p>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 14 }}
        transition={{ delay: 2.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-6 bg-card rounded-xl border border-border p-4 flex items-center gap-3 shadow-xs"
      >
        <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <FileText className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Protokoll_Einzug_Mustermann.pdf</p>
          <p className="text-[11px] text-muted-foreground">4 Seiten · 1,2 MB · mit Signaturen</p>
        </div>
        <Download className="h-4 w-4 text-muted-foreground" />
      </motion.div>
    </div>
  )
}

/* ========================= FAQ ========================= */
function FAQ() {
  const items = [
    {
      q: 'Sind die Dokumente rechtssicher?',
      a: 'Ja. Mietverträge, Übergabeprotokolle, Wohnungsgeberbestätigungen und Kautionsbescheinigungen werden nach den Anforderungen des deutschen Mietrechts erstellt. Digitale Unterschriften mit Zeitstempel und ein exportiertes PDF dienen als Nachweis im Streitfall.',
    },
    {
      q: 'Was passiert ohne Internet vor Ort?',
      a: 'Die App funktioniert offline. Übergabeprotokolle werden lokal gespeichert und synchronisieren sich automatisch, sobald wieder Internet verfügbar ist. Kein Wartebildschirm, kein Datenverlust.',
    },
    {
      q: 'Wer hat Zugriff auf meine Daten?',
      a: 'Ausschließlich Sie und Ihr Konto. Die Daten liegen verschlüsselt auf europäischen Servern (Supabase, DSGVO-konform). Mieterdaten werden nicht weitergegeben und nicht für Werbung genutzt.',
    },
    {
      q: 'Brauche ich eine App aus dem Store?',
      a: 'Nein. ImmoAkte läuft im Browser auf jedem Gerät – iPhone, Android, iPad, Laptop. Keine Installation, kein Update-Zwang. Einfach einloggen und loslegen.',
    },
    {
      q: 'Was kostet das?',
      a: 'Der Einstieg ist kostenlos – ohne Kreditkarte. Im kostenpflichtigen Tarif erhalten Sie unbegrenzte Mietverhältnisse, alle Dokumenttypen und Prioritäts-Support. Details auf der Preise-Seite.',
    },
    {
      q: 'Welche Dokumente kann ich erstellen?',
      a: 'Aktuell unterstützt ImmoAkte: Mietvertrag, Wohnungsgeberbestätigung, Kautionsbescheinigung sowie Einzugs- und Auszugsprotokoll. Alle Dokumente lassen sich als PDF exportieren und digital unterschreiben.',
    },
  ]
  return (
    <section className="py-24 sm:py-32 bg-muted/40 border-y border-border">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal className="text-center mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brass-600 dark:text-brass-400 mb-3">
            Häufige Fragen
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl tracking-tight text-foreground leading-[1.05]">
            Was Sie wissen sollten.
          </h2>
        </Reveal>
        <RevealStagger className="space-y-3" staggerChildren={0.06}>
          {items.map((item, i) => (
            <RevealItem key={i}>
              <FAQItem q={item.q} a={item.a} />
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 text-left px-6 py-5 group"
      >
        <dt className="font-heading text-lg text-foreground">{q}</dt>
        <span className={`shrink-0 h-8 w-8 rounded-full border border-border flex items-center justify-center transition-transform duration-300 ${open ? 'rotate-45 bg-brass-50 border-brass-300 dark:bg-brass-900/30' : 'bg-background'}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <dd className="px-6 pb-5 -mt-1 text-[15px] text-muted-foreground leading-relaxed">{a}</dd>
        </div>
      </div>
    </div>
  )
}

/* ========================= FINAL CTA ========================= */
function FinalCTA() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal y={32} duration={0.8} className="relative overflow-hidden rounded-3xl bg-ink-800 p-10 sm:p-16 text-center shadow-xl">
          {/* Ledger grid on dark */}
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle, rgba(250,248,243,1) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          {/* Brass glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-brass-400/25 blur-3xl" />

          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brass-300 mb-4">
              Kostenlos starten – kein Abo nötig
            </p>
            <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-background leading-[1.05] tracking-tight">
              Nie wieder Papierkram{' '}
              <span className="italic text-brass-300">im Flur.</span>
            </h2>
            <p className="mt-5 text-base sm:text-lg text-background/75 max-w-xl mx-auto leading-relaxed">
              Legen Sie Ihr erstes Mietverhältnis an und erstellen Sie alle Dokumente noch heute – ohne Kreditkarte, ohne Abo.
            </p>
            <div className="mt-10 flex justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="h-12 px-7 bg-brass-400 text-ink-900 hover:bg-brass-300 shadow-brass text-[15px] font-semibold">
                  Jetzt loslegen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
