import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'

const COLS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: 'Produkt',
    links: [
      { label: 'Preise', href: '/pricing' },
      { label: 'Registrieren', href: '/login?mode=signup' },
      { label: 'Anmelden', href: '/login' },
    ],
  },
  {
    title: 'Rechtliches',
    links: [
      { label: 'Impressum', href: '/impressum' },
      { label: 'Datenschutz', href: '/datenschutz' },
      { label: 'AGB', href: '/agb' },
      { label: 'Widerruf', href: '/widerruf' },
      { label: 'Auftragsverarbeitung', href: '/auftragsverarbeitung' },
    ],
  },
  {
    title: 'Kontakt',
    links: [
      { label: 'info@weserbergland-dienstleistungen.de', href: 'mailto:info@weserbergland-dienstleistungen.de', external: true },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
          {/* Brand + tagline */}
          <div>
            <Logo size={28} />
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xs">
              Rechtskonforme Übergabeprotokolle und digitale Mieter-Akten — direkt auf dem Smartphone.
            </p>
          </div>

          {/* Link columns */}
          {COLS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/70 mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors break-all"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Base line */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Weserbergland Dienstleistungen · Alle Rechte vorbehalten
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Alle Systeme verfügbar
          </p>
        </div>
      </div>
    </footer>
  )
}
