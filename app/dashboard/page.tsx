'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  listTenancies, listAllProtocols, deleteProtocol as storeDeleteProtocol,
  duplicateTenancyForAuszug, getProfile, saveProfile, exportAllData,
} from '@/lib/local-store'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Logo } from '@/components/brand/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  Plus, Settings, Archive, Bookmark,
  CircleCheck, Clock, Search, Download, RefreshCw,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { TenancyCard } from '@/components/dashboard/TenancyCard'
import { cn } from '@/lib/utils'

interface Protocol {
  id: string
  tenant_first_name?: string | null
  tenant_last_name?: string | null
  tenant_salutation?: string | null
  tenant_email?: string | null
  date?: string | null
  type: string
  status: string
  property_id?: string | null
  propertyAddress?: string
  linked_protocol_id?: string | null
  finalized_at?: string | null
  rooms?: any[]
  meters?: any[]
  keys?: any[]
}

interface TenancyGroup {
  id: string
  tenancyId?: string
  tenantName: string
  propertyAddress?: string
  propertyId?: string
  tenantSalutation?: string
  tenantFirstName?: string
  tenantLastName?: string
  tenantEmail?: string
  tenantPhone?: string
  einzug?: Protocol
  auszug?: Protocol
}

type FilterMode = 'all' | 'active' | 'closed'

export default function Dashboard() {
  const { user, resetLocalData } = useAuth()
  const router = useRouter()

  const [tenancies, setTenancies] = useState<TenancyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [userCompany, setUserCompany] = useState('')
  const [userStreet, setUserStreet] = useState('')
  const [userHouseNumber, setUserHouseNumber] = useState('')
  const [userZipCode, setUserZipCode] = useState('')
  const [userCity, setUserCity] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [userEmailContact, setUserEmailContact] = useState('')
  const [userIban, setUserIban] = useState('')
  const [userBankName, setUserBankName] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [protocolToDelete, setProtocolToDelete] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return
    fetchData()
  }, [user])

  const fetchData = async () => {
    const profile = getProfile()
    setUserName(profile.name || '')
    setUserCompany(profile.company || '')
    setUserStreet(profile.street || '')
    setUserHouseNumber(profile.house_number || '')
    setUserZipCode(profile.zip_code || '')
    setUserCity(profile.city || '')
    setUserPhone(profile.phone || '')
    setUserEmailContact(profile.email_contact || '')
    setUserIban(profile.iban || '')
    setUserBankName(profile.bank_name || '')

    const fetchedTenancies = listTenancies()
    const fetchedProtocols = listAllProtocols()

    const groups: TenancyGroup[] = fetchedTenancies.map((t: any) => {
      const prop = t.properties
      const address = prop?.address || `${prop?.street || ''} ${prop?.house_number || ''}, ${prop?.zip_code || ''} ${prop?.city || ''}`.trim()

      const tProtos = fetchedProtocols.filter((p: any) => p.tenancy_id === t.id)
      const einzug = tProtos.find((p: any) => p.type === 'Einzug')
      const auszug = tProtos.find((p: any) => p.type === 'Auszug')

      return {
        id: t.id,
        tenancyId: t.id,
        tenantName: `${t.tenant_first_name || ''} ${t.tenant_last_name || ''}`.trim() || 'Unbekannter Mieter',
        propertyAddress: address || 'Unbekannte Adresse',
        propertyId: prop?.id,
        tenantSalutation: t.tenant_salutation,
        tenantFirstName: t.tenant_first_name,
        tenantLastName: t.tenant_last_name,
        tenantEmail: t.tenant_email,
        tenantPhone: t.tenant_phone,
        einzug: einzug ? { ...einzug, propertyAddress: address } : undefined,
        auszug: auszug ? { ...auszug, propertyAddress: address } : undefined,
      }
    })

    setTenancies(groups)
    setLoading(false)
  }

  const saveSettings = () => {
    saveProfile({
      name: userName,
      company: userCompany,
      street: userStreet,
      house_number: userHouseNumber,
      zip_code: userZipCode,
      city: userCity,
      phone: userPhone,
      email_contact: userEmailContact,
      iban: userIban,
      bank_name: userBankName,
    })
    toast.success('Stammdaten gespeichert')
    setIsSettingsOpen(false)
  }

  const confirmDelete = (protocolId: string) => {
    setProtocolToDelete(protocolId)
    setIsDeleteDialogOpen(true)
  }

  const executeDelete = () => {
    if (!protocolToDelete) return
    const ok = storeDeleteProtocol(protocolToDelete)
    if (!ok) { toast.error('Fehler beim Löschen'); return }
    toast.success('Protokoll gelöscht')
    setTenancies(prev =>
      prev.map(g => {
        const ng = { ...g }
        if (ng.einzug?.id === protocolToDelete) ng.einzug = undefined
        if (ng.auszug?.id === protocolToDelete) ng.auszug = undefined
        return ng
      })
    )
    setIsDeleteDialogOpen(false)
    setProtocolToDelete(null)
  }

  const duplicateTenancy = async (group: TenancyGroup) => {
    toast.loading('Mietverhältnis wird dupliziert...', { id: 'dup' })
    try {
      const tenancyId = group.tenancyId || group.id
      const sourceProtocolId = group.einzug?.id
      if (!sourceProtocolId) throw new Error('Kein Einzugsprotokoll vorhanden')
      const result = duplicateTenancyForAuszug(tenancyId, sourceProtocolId)
      if (!result) throw new Error('Duplikation fehlgeschlagen')
      toast.success('Mietverhältnis dupliziert', { id: 'dup' })
      window.location.reload()
    } catch (e: any) {
      toast.error(e?.message || 'Fehler beim Duplizieren', { id: 'dup' })
    }
  }

  const downloadExport = () => {
    try {
      const data = exportAllData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `immoakte-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Export wurde heruntergeladen.')
    } catch (err: any) {
      toast.error(err?.message || 'Fehler beim Export')
    }
  }

  const handleResetLocal = () => {
    resetLocalData()
    setIsResetDialogOpen(false)
    setIsSettingsOpen(false)
    toast.success('Lokale Daten wurden zurückgesetzt.')
    window.location.reload()
  }

  const stats = useMemo(() => {
    const total = tenancies.length
    const active = tenancies.filter(t =>
      (t.einzug && !t.auszug?.finalized_at) ||
      (!t.einzug && !t.auszug)
    ).length
    const closed = tenancies.filter(t => t.auszug?.finalized_at).length
    const drafts = tenancies.filter(t =>
      (t.einzug && !t.einzug.finalized_at) || (t.auszug && !t.auszug.finalized_at)
    ).length
    return { total, active, closed, drafts }
  }, [tenancies])

  const filtered = useMemo(() => {
    return tenancies.filter(t => {
      if (filter === 'active' && t.auszug?.finalized_at) return false
      if (filter === 'closed' && !t.auszug?.finalized_at) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          t.tenantName.toLowerCase().includes(q) ||
          (t.propertyAddress || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [tenancies, filter, search])

  if (!user) return null

  const displayName = userName || 'Vermieter'
  const firstName = displayName.split(/\s+/)[0]

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-5">
            <Link href="/" aria-label="Zur Startseite">
              <Logo size={26} />
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <button className="px-3 py-1.5 rounded-md text-sm font-medium text-foreground bg-muted">
                Dashboard
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" title="Eigene Vorlagen" onClick={() => router.push('/templates')}>
              <Bookmark className="h-4 w-4" />
            </Button>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger render={<Button variant="ghost" size="icon" title="Stammdaten" />}>
                <Settings className="h-4 w-4" />
              </DialogTrigger>
              <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-heading text-2xl">Stammdaten</DialogTitle>
                  <DialogDescription>
                    Diese Angaben erscheinen automatisch in Ihren Protokollen und Dokumenten.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <Fieldset title="Person & Firma">
                    <FormRow>
                      <FormField label="Ihr Name (Vermieter/Verwalter)">
                        <Input value={userName} onChange={e => setUserName(e.target.value)} placeholder="Max Mustermann" />
                      </FormField>
                    </FormRow>
                    <FormRow>
                      <FormField label="Firma" hint="optional">
                        <Input value={userCompany} onChange={e => setUserCompany(e.target.value)} placeholder="Immobilien GmbH" />
                      </FormField>
                    </FormRow>
                  </Fieldset>

                  <Fieldset title="Ihre Adresse">
                    <FormRow cols={3}>
                      <FormField label="Straße" span={2}>
                        <Input value={userStreet} onChange={e => setUserStreet(e.target.value)} placeholder="Musterstraße" />
                      </FormField>
                      <FormField label="Hausnr.">
                        <Input value={userHouseNumber} onChange={e => setUserHouseNumber(e.target.value)} placeholder="1a" />
                      </FormField>
                    </FormRow>
                    <FormRow cols={3}>
                      <FormField label="PLZ">
                        <Input value={userZipCode} onChange={e => setUserZipCode(e.target.value)} placeholder="12345" />
                      </FormField>
                      <FormField label="Ort" span={2}>
                        <Input value={userCity} onChange={e => setUserCity(e.target.value)} placeholder="Musterstadt" />
                      </FormField>
                    </FormRow>
                  </Fieldset>

                  <Fieldset title="Kontakt">
                    <FormRow cols={2}>
                      <FormField label="Telefon">
                        <Input value={userPhone} onChange={e => setUserPhone(e.target.value)} placeholder="+49 123 456789" />
                      </FormField>
                      <FormField label="E-Mail">
                        <Input type="email" value={userEmailContact} onChange={e => setUserEmailContact(e.target.value)} placeholder="max@beispiel.de" />
                      </FormField>
                    </FormRow>
                  </Fieldset>

                  <Fieldset title="Bankverbindung">
                    <FormRow>
                      <FormField label="IBAN">
                        <Input value={userIban} onChange={e => setUserIban(e.target.value)} placeholder="DE12 3456 7890 1234 5678 90" />
                      </FormField>
                    </FormRow>
                    <FormRow>
                      <FormField label="Bank" hint="optional">
                        <Input value={userBankName} onChange={e => setUserBankName(e.target.value)} placeholder="Musterbank" />
                      </FormField>
                    </FormRow>
                  </Fieldset>

                  <Button onClick={saveSettings} className="w-full h-10">Speichern</Button>

                  <div className="pt-6 mt-4 border-t border-border">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brass-600 mb-2">
                      Datenexport
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      Lädt alle lokal gespeicherten Daten als JSON-Datei herunter.
                    </p>
                    <Button variant="outline" className="w-full h-10" onClick={downloadExport}>
                      <Download className="h-4 w-4 mr-2" />
                      Meine Daten herunterladen
                    </Button>
                  </div>

                  <div className="pt-6 mt-4 border-t border-border">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-destructive mb-2">
                      Lokale Daten zurücksetzen
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                      Löscht alle Mietverhältnisse, Protokolle, Dokumente und Vorlagen aus dem Browser. Diese Aktion kann nicht rückgängig gemacht werden.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-9 text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setIsResetDialogOpen(true)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Lokale Daten zurücksetzen
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <ThemeToggle compact />
          </div>
        </div>
      </header>

      <main className="mx-auto mt-10 max-w-6xl px-4 sm:px-6 motion-page-in">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brass-600 mb-2">
            Willkommen zurück
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl tracking-tight text-foreground leading-[1.05]">
            Guten Tag{firstName ? `, ${firstName}` : ''}.
          </h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Ihre Mieter-Akten auf einen Blick. Alles, was Sie für ein ordentliches Protokoll brauchen — in drei Klicks.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          <StatCard label="Mietverhältnisse" value={stats.total} icon={Archive} tone="ink" loading={loading}
            style={{ '--stagger-i': 0 } as React.CSSProperties} className="motion-fade-up" />
          <StatCard label="Aktiv" value={stats.active} icon={Clock} tone="brass" loading={loading}
            style={{ '--stagger-i': 1 } as React.CSSProperties} className="motion-fade-up" />
          <StatCard label="Abgeschlossen" value={stats.closed} icon={CircleCheck} tone="emerald" loading={loading}
            className="motion-fade-up" style={{ '--stagger-i': 2 } as React.CSSProperties} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="font-heading text-2xl text-foreground">Meine Akten</h2>
            <p className="text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? 'Mietverhältnis' : 'Mietverhältnisse'}
              {search && ` · Suche: „${search}"`}
            </p>
          </div>
          <Button onClick={() => router.push('/tenancy/new')} className="h-10 shrink-0 shadow-ink">
            <Plus className="mr-1.5 h-4 w-4" />
            Neues Mietverhältnis
          </Button>
        </div>

        {tenancies.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border w-fit">
              {[
                { k: 'all' as const,    label: 'Alle',          count: stats.total },
                { k: 'active' as const, label: 'Aktiv',         count: stats.active },
                { k: 'closed' as const, label: 'Abgeschlossen', count: stats.closed },
              ].map(({ k, label, count }) => (
                <button key={k} onClick={() => setFilter(k)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                    filter === k ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  )}>
                  {label}
                  <span className={cn(
                    'text-[11px] rounded-full px-1.5 h-4 min-w-[16px] inline-flex items-center justify-center',
                    filter === k ? 'bg-brass-100 text-brass-800 dark:bg-brass-900/40 dark:text-brass-200' : 'bg-background text-muted-foreground'
                  )}>{count}</span>
                </button>
              ))}
            </div>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input type="text" placeholder="Mieter oder Adresse suchen…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-brass-400 focus:ring-2 focus:ring-brass-400/20 transition-colors" />
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex gap-3">
                  <Skeleton className="h-11 w-11 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : tenancies.length === 0 ? (
          <EmptyState onCreate={() => router.push('/tenancy/new')} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Keine Treffer für die aktuelle Auswahl.</p>
            <Button variant="ghost" onClick={() => { setFilter('all'); setSearch('') }} className="mt-3">
              Filter zurücksetzen
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((group, idx) => (
              <div key={group.id} className="motion-fade-up hover-lift"
                style={{ '--stagger-i': idx } as React.CSSProperties}>
                <TenancyCard
                  group={group}
                  userId={user.id}
                  onDelete={confirmDelete}
                  onDuplicate={duplicateTenancy}
                  onOpenTenancy={(g) => {
                    const tenancyId = g.tenancyId || g.einzug?.id
                    if (tenancyId) router.push(`/tenancy/${tenancyId}`)
                  }}
                  onAuszugCreated={(auszug) => {
                    setTenancies(prev => prev.map(g => g.id === group.id ? { ...g, auszug } : g))
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Protokoll löschen</DialogTitle>
            <DialogDescription>
              Möchten Sie dieses Protokoll wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Abbrechen</Button>
            <Button variant="destructive" onClick={executeDelete}>Löschen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lokale Daten zurücksetzen?</DialogTitle>
            <DialogDescription>
              Alle Mietverhältnisse, Protokolle, Dokumente und Vorlagen werden aus dem Browser entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>Abbrechen</Button>
            <Button variant="destructive" onClick={handleResetLocal}>Zurücksetzen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({
  label, value, icon: Icon, tone, loading, className, style,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  tone: 'ink' | 'brass' | 'emerald'
  loading?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  const toneStyles = {
    ink:     { pill: 'bg-ink-50 text-ink-700 dark:bg-ink-800 dark:text-brass-300', ring: 'from-ink-400/20' },
    brass:   { pill: 'bg-brass-100 text-brass-700 dark:bg-brass-900/40 dark:text-brass-300', ring: 'from-brass-400/30' },
    emerald: { pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', ring: 'from-emerald-400/20' },
  }[tone]
  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-xs hover:shadow-md transition-all',
      className
    )} style={style}>
      <div className={cn('absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br blur-2xl pointer-events-none opacity-60', toneStyles.ring, 'to-transparent')} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <p className="mt-1.5 font-heading text-[40px] leading-none tracking-tight text-foreground tabular-nums">
            {loading ? <span className="inline-block h-8 w-10 bg-muted rounded animate-pulse" /> : value}
          </p>
        </div>
        <span className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', toneStyles.pill)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-border bg-gradient-to-br from-muted/50 to-background py-20 px-6 text-center">
      <div className="absolute inset-0 bg-ledger opacity-40 pointer-events-none" />
      <div className="relative">
        <div className="mx-auto w-40 h-28 mb-6">
          <svg viewBox="0 0 160 110" className="w-full h-full" aria-hidden="true">
            <rect x="10" y="20" width="140" height="80" rx="4" fill="#faf0d9" stroke="#e9c775" strokeWidth="1" />
            <line x1="10" y1="55" x2="150" y2="55" stroke="#c9974b" strokeWidth="1" opacity="0.4" />
            <rect x="22" y="28" width="22" height="22" rx="2" fill="#1e2a47" />
            <rect x="48" y="28" width="22" height="22" rx="2" fill="#394669" />
            <rect x="74" y="28" width="22" height="22" rx="2" fill="#c9974b" />
            <rect x="100" y="28" width="22" height="22" rx="2" fill="#78716c" opacity="0.6" />
            <rect x="22" y="62" width="22" height="22" rx="2" fill="none" stroke="#d4cec2" strokeWidth="1" strokeDasharray="2 2" />
            <rect x="48" y="62" width="22" height="22" rx="2" fill="none" stroke="#d4cec2" strokeWidth="1" strokeDasharray="2 2" />
            <rect x="74" y="62" width="22" height="22" rx="2" fill="none" stroke="#d4cec2" strokeWidth="1" strokeDasharray="2 2" />
            <path d="M 80 95 L 80 105 M 76 101 L 80 105 L 84 101" stroke="#c9974b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <h3 className="font-heading text-2xl text-foreground mb-2">Noch leer hier drinnen.</h3>
        <p className="text-muted-foreground max-w-sm mx-auto mb-8">
          Legen Sie Ihr erstes Mietverhältnis an — Mieter, Adresse, fertig. Das Protokoll erstellen Sie direkt daraus.
        </p>
        <Button onClick={onCreate} size="lg" className="h-11 px-6 shadow-ink">
          <Plus className="mr-1.5 h-4 w-4" />
          Erstes Mietverhältnis anlegen
        </Button>
      </div>
    </div>
  )
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass-600">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function FormRow({ children, cols }: { children: React.ReactNode; cols?: number }) {
  return (
    <div className={cn('grid gap-3', cols === 2 && 'grid-cols-2', cols === 3 && 'grid-cols-3', !cols && 'grid-cols-1')}>
      {children}
    </div>
  )
}

function FormField({
  label, hint, span, children,
}: {
  label: string; hint?: string; span?: number; children: React.ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', span === 2 && 'col-span-2')}>
      <Label className="text-xs font-medium text-foreground/80">
        {label}
        {hint && <span className="ml-1 text-muted-foreground font-normal">· {hint}</span>}
      </Label>
      {children}
    </div>
  )
}
