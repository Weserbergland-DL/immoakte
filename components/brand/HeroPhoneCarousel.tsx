'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LayoutGrid, Camera, FileSignature, Home as HomeIcon, CheckCircle2, ClipboardList, type LucideIcon } from 'lucide-react'
import { PhoneFrame } from './PhoneFrame'
import { DashboardMockup } from './DashboardMockup'
import { ProtocolMockup } from './ProtocolMockup'
import { SignatureMockup } from './SignatureMockup'

interface Annotation {
  icon: LucideIcon
  label: string
  /** Absolute position relative to the phone-frame wrapper. Pills sit OUTSIDE
   *  the phone bezel — either `right: '100%'` (left of phone) or `left: '100%'`
   *  (right of phone), with a small gap so they don't touch. Each screen uses
   *  a different combination so the two pills never share a position with
   *  another screen. */
  position: CSSProperties
  /** Which direction the pill gently bobs. */
  floatDir: 'up' | 'down'
}

interface Screen {
  key: string
  label: string
  node: ReactNode
  annotations: [Annotation, Annotation]
}

/** How far a pill "bites" into the phone. Around half the pill is now on
 *  the phone — the other half extends outward. That way the right-side pill
 *  doesn't overflow the viewport on laptop sizes, and the bitten half still
 *  leaves the phone's central screen content visible. */
const OVERLAP = '-90px'

/** Each screen has one pill on each side of the phone, at different vertical
 *  positions. The pills slightly overlap the bezel (~28px) so they feel
 *  anchored — but 80%+ of their width is outside the phone, so they never
 *  cover the screen content. Varying the top/bottom per screen gives the
 *  eye something fresh on each cycle. */
const SCREENS: Screen[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    node: <DashboardMockup />,
    annotations: [
      {
        icon: LayoutGrid,
        label: 'Alle Akten auf einen Blick',
        // Top, extending LEFT out of the phone
        position: { top: 64, right: '100%', marginRight: OVERLAP },
        floatDir: 'up',
      },
      {
        icon: ClipboardList,
        label: 'Status pro Mietverhältnis',
        // Bottom, extending RIGHT out of the phone
        position: { bottom: 80, left: '100%', marginLeft: OVERLAP },
        floatDir: 'down',
      },
    ],
  },
  {
    key: 'protocol',
    label: 'Einzugsprotokoll',
    node: <ProtocolMockup />,
    annotations: [
      {
        icon: HomeIcon,
        label: 'Raum für Raum geprüft',
        // Top, extending RIGHT
        position: { top: 140, left: '100%', marginLeft: OVERLAP },
        floatDir: 'up',
      },
      {
        icon: Camera,
        label: 'Fotos direkt erfassen',
        // Middle-lower, extending LEFT
        position: { top: 300, right: '100%', marginRight: OVERLAP },
        floatDir: 'down',
      },
    ],
  },
  {
    key: 'signature',
    label: 'Unterschriften',
    node: <SignatureMockup />,
    annotations: [
      {
        icon: FileSignature,
        label: 'Digitale Unterschrift',
        // Upper-middle, extending LEFT
        position: { top: 220, right: '100%', marginRight: OVERLAP },
        floatDir: 'up',
      },
      {
        icon: CheckCircle2,
        label: 'Rechtssicher als PDF',
        // Lower, extending RIGHT
        position: { bottom: 100, left: '100%', marginLeft: OVERLAP },
        floatDir: 'down',
      },
    ],
  },
]

/** Hero-Phone das alle ~3s zwischen 3 App-Screens crossfadet.
 *  Zwei Annotation-Pills pro Screen, jede an einer anderen Position. */
export function HeroPhoneCarousel() {
  const [index, setIndex] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (reducedMotion) return
    // Von 5500ms auf 3000ms beschleunigt — Carousel-Wechsel fühlt sich
    // jetzt deutlich zügiger an, Annotation-Pills bleiben lesbar.
    const id = setInterval(() => setIndex(i => (i + 1) % SCREENS.length), 3000)
    return () => clearInterval(id)
  }, [reducedMotion])

  const active = SCREENS[index]

  return (
    <div className="relative flex flex-col items-center">
      {/* Phone + annotation overlay — wrapper is sized exactly like the phone
          so absolutely-positioned annotations can use left:100% / right:100%
          to sit right next to the bezel. */}
      <div className="relative w-[300px]">
        <PhoneFrame tilt>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active.key}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="h-full w-full"
            >
              {active.node}
            </motion.div>
          </AnimatePresence>
        </PhoneFrame>

        {/* Annotation pills — rendered per screen. AnimationPill owns its own
            fade-out-then-swap logic to avoid relying on motion's unreliable
            mount animation under React 19 hydration. */}
        <div className="absolute inset-0 hidden lg:block pointer-events-none">
          <AnimationPill slot="first" annotation={active.annotations[0]} />
          <AnimationPill slot="second" annotation={active.annotations[1]} />
        </div>
      </div>

      {/* Screen-label + indicator dots below phone */}
      <div className="mt-6 flex items-center gap-1.5">
        {SCREENS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Screen ${s.label} anzeigen`}
            className={
              'h-1.5 rounded-full transition-all duration-300 ' +
              (i === index ? 'w-8 bg-brass-500' : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60')
            }
          />
        ))}
      </div>
      <p className="mt-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {active.label}
      </p>
    </div>
  )
}

/** Single pill that cross-fades its content (icon + label + position) whenever
 *  the parent passes a new annotation. Uses pure CSS transitions — motion's
 *  `initial`/`animate` is unreliable after React 19 hydration. */
function AnimationPill({
  annotation,
  slot,
}: {
  annotation: Annotation
  /** Used only for a float-animation delay so the two pills don't bob in sync. */
  slot: 'first' | 'second'
}) {
  // Current *displayed* content. When the prop changes, fade the visible pill
  // out, wait for the transition, then swap in the new content and fade back.
  const [displayed, setDisplayed] = useState(annotation)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // First paint on client: fade in.
    const id = requestAnimationFrame(() => setIsVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    if (annotation.label === displayed.label) return
    setIsVisible(false)
    // Fade-out → swap → fade-in: von 400ms auf 250ms verkürzt, passt zum
    // schnelleren 3s-Carousel-Rhythmus ohne abzuschneiden.
    const t = setTimeout(() => {
      setDisplayed(annotation)
      requestAnimationFrame(() => setIsVisible(true))
    }, 250)
    return () => clearTimeout(t)
  }, [annotation, displayed.label])

  const Icon = displayed.icon
  const floatClass = displayed.floatDir === 'up' ? 'hero-pill-float-up' : 'hero-pill-float-down'
  const floatDelay = slot === 'second' ? '1.2s' : '0s'

  return (
    <div
      className={
        'absolute flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1.5 whitespace-nowrap ' +
        'transition-opacity duration-300 ' +
        (isVisible ? 'opacity-100 ' : 'opacity-0 ') +
        floatClass
      }
      style={{
        ...displayed.position,
        animationDelay: floatDelay,
        // Brand-blue glow so the pill stays readable against the dark phone
        // bezel without looking generic. Uses the ink-700 tone.
        boxShadow:
          '0 10px 24px -8px rgba(30, 42, 71, 0.38), ' +
          '0 4px 10px -4px rgba(30, 42, 71, 0.22)',
      }}
    >
      <Icon className="h-3.5 w-3.5 text-brass-600" />
      <span className="text-xs font-medium text-foreground">{displayed.label}</span>
    </div>
  )
}
