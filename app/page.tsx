'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ClipboardCheck, ShieldCheck, Zap, Smartphone } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/layout/Header'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Landing() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  if (loading || user) return null

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <section className="px-6 py-20 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            Digitale Mietübergabe <br />
            <span className="text-primary">einfach &amp; sicher.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Erstellen Sie professionelle Übergabeprotokolle in Minuten.
            Rechtssicher, digital und direkt auf dem Smartphone.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/login?mode=signup">
              <Button size="lg">Jetzt kostenlos starten</Button>
            </Link>
          </div>
        </section>

        <section className="bg-slate-50 px-6 py-20">
          <div className="mx-auto max-w-5xl grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Smartphone, title: 'Mobil optimiert', desc: 'Erfassen Sie Mängel direkt vor Ort mit Ihrem Smartphone.' },
              { icon: ShieldCheck, title: 'Rechtssicher', desc: 'Professionelle Protokolle, die vor Gericht Bestand haben.' },
              { icon: Zap, title: 'Schnell & Einfach', desc: 'In wenigen Minuten zum fertigen PDF-Protokoll.' },
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="mt-2 text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
