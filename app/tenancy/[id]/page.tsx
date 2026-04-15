'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  ArrowLeft, Plus, FileSignature, Home, Key, FileText,
  FileCheck, CheckCircle2, Clock, ChevronRight, Building2,
  Mail, Phone, Pencil, Trash2, Sparkles, MapPin,
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { RentalContractDialog } from '@/components/documents/RentalContractDialog'

interface TenancyItem {
  id: string
  kind: 'document' | 'protocol'
  type: string
  name: string
  status: 'draft' | 'final'
  finalized_at?: string | null
  date?: string | null
  order: number
}

const ITEM_CONFIG: Record<string, {
  label: string
  icon: React.ElementType
  hint: string
  order: number
  kind: 'document' | 'protocol'
  accent: 'ink' | 'brass' | 'emerald'
}> = {
  mietvertrag:               { label: 'Mietvertrag',               icon: FileSignature, hint: 'Vor Einzug',                  order: 1, kind: 'document', accent: 'ink'    },
  Einzug:                    { label: 'Einzugsprotokoll',           icon: Home,          hint: 'Am Einzugstag',               order: 2, kind: 'protocol', accent: 'brass'  },
  wohnungsgeberbestaetigung: { label: 'Wohnungsgeberbestätigung',   icon: FileText,      hint: 'Pflicht bei Einzug',          order: 3, kind: 'document', accent: 'ink'    },
  kautionsbescheinigung:     { label: 'Kautionsbescheinigung',      icon: Key,           hint: 'Nach Kautionszahlung',        order: 4, kind: 'document', accent: 'ink'    },
  Auszug:                    { label: 'Auszugsprotokoll',           icon: FileCheck,     hint: 'Bei Auszug',                  order: 5, kind: 'protocol', accent: 'emerald'},
  sonstiges:                 { label: 'Leeres Dokument',            icon: FileText,      hint: 'Freier Text, eigene Vorlage', order: 6, kind: 'document', accent: 'ink'    },
}

function safeDate(d?: string | null) {
  if (!d) return null
  try { return format(new Date(d), 'dd. MMM yyyy', { locale: de }) }
  catch { return null }
}

function initialsOf(first?: string, last?: string) {
  return `${(first?.[0] || '').toUpperCase()}${(last?.[0] || '').toUpperCase()}` || '??'
}

function StageFromItems(items: TenancyItem[]): { label: string; variant: 'draft' | 'active' | 'final' } {
  const einzug = items.find(i => i.type === 'Einzug')
  const auszug = items.find(i => i.type === 'Auszug')
  if (auszug?.status === 'final') return { label: 'Abgeschlossen', variant: 'final' }
  if (auszug) return { label: 'Auszug in Arbeit', variant: 'active' }
  if (einzug?.status === 'final') return { label: 'Laufend', variant: 'final' }
  if (einzug) return { label: 'Einzug in Arbeit', variant: 'active' }
  return { label: 'Neu', variant: 'draft' }
}

export default function TenancyPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [tenancy, setTenancy] = useState<any>(null)
  const [items, setItems] = useState<TenancyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [rentalDialogOpen, setRentalDialogOpen] = useState(false)

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    loadData()
  }, [id, user])

  const loadData = async () => {
    let json: any
    try {
      const res = await fetch(`/api/tenancies/${id}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      json = await res.json()
    } catch {
      toast.error('Daten konnten nicht geladen werden')
      router.push('/dashboard')
      return
    }
    if (json.error) { toast.error('Nicht gefunden'); router.push('/dashboard'); return }

    setTenancy(json.tenancy)

    const merged: TenancyItem[] = []

    for (const proto of (json.protocols || [])) {
      const cfg = ITEM_CONFIG[proto.type]
      if (!cfg) continue
      merged.push({
        id: proto.id,
        kind: 'protocol',
        type: proto.type,
        name: cfg.label,
        status: proto.finalized_at ? 'final' : 'draft',
        finalized_at: proto.finalized_at,
        date: proto.date,
        order: cfg.order,
      })
    }

    for (const doc of (json.documents || [])) {
      const cfg = ITEM_CONFIG[doc.type]
      merged.push({
        id: doc.id,
        kind: 'document',
        type: doc.type,
        name: doc.name,
        status: doc.status,
        finalized_at: doc.finalized_at,
        order: cfg?.order ?? 6,
      })
    }

    merged.sort((a, b) => a.order - b.order || new Date(a.finalized_at || 0).getTime() - new Date(b.finalized_at || 0).getTime())
    setItems(merged)
    setLoading(false)
  }

  const createItem = async (type: string) => {
    // Mietvertrag opens pre-fill dialog
    if (type === 'mietvertrag') {
      setRentalDialogOpen(true)
      return
    }
    setCreating(type)
    const cfg = ITEM_CONFIG[type]

    try {
      if (cfg.kind === 'protocol') {
        const einzugItem = items.find(i => i.type === 'Einzug')

        let einzugData: any = null
        if (type === 'Auszug' && einzugItem) {
          const { data } = await supabase.from('protocols').select('rooms,meters,keys').eq('id', einzugItem.id).single()
          einzugData = data
        }

        const rooms = type === 'Auszug'
          ? (einzugData?.rooms?.map((r: any) => ({ ...r, defects: r.defects || [] })) || [])
          : []
        const meters = type === 'Auszug'
          ? (einzugData?.meters?.map((m: any) => ({ ...m, reading: '', photoUrl: '' })) || [
              { id: crypto.randomUUID(), type: 'Strom', number: '', reading: '', photoUrl: '' },
              { id: crypto.randomUUID(), type: 'Wasser', number: '', reading: '', photoUrl: '' },
            ])
          : [
              { id: crypto.randomUUID(), type: 'Strom', number: '', reading: '', photoUrl: '' },
              { id: crypto.randomUUID(), type: 'Wasser', number: '', reading: '', photoUrl: '' },
            ]
        const keys = type === 'Auszug' ? (einzugData?.keys || []) : []

        const { data: proto, error } = await supabase.from('protocols').insert({
          tenancy_id: id,
          property_id: tenancy.property_id,
          owner_id: user!.id,
          tenant_salutation: tenancy.tenant_salutation,
          tenant_first_name: tenancy.tenant_first_name,
          tenant_last_name: tenancy.tenant_last_name,
          tenant_email: tenancy.tenant_email,
          tenant_phone: tenancy.tenant_phone,
          date: new Date().toISOString(),
          type,
          status: 'draft',
          rooms,
          meters,
          keys,
          linked_protocol_id: type === 'Auszug' ? (einzugItem?.id || null) : null,
        }).select().single()

        if (error) throw error
        router.push(`/protocol/${proto.id}`)
      } else {
        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, tenancy_id: id, property_id: tenancy.property_id }),
        })
        const { document, error } = await res.json()
        if (error) throw new Error(error)
        router.push(`/documents/${document.id}`)
      }
    } catch (err: any) {
      toast.error('Fehler: ' + (err.message || 'Unbekannt'))
    } finally {
      setCreating(null)
    }
  }

  const deleteTenancy = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/tenancies/${id}`, { method: 'DELETE' })
      const { error } = await res.json()
      if (error) throw new Error(error)
      toast.success('Mietverhältnis gelöscht')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error('Fehler: ' + (err.message || 'Unbekannt'))
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  const navigateToItem = (item: TenancyItem) => {
    if (item.kind === 'protocol') router.push(`/protocol/${item.id}`)
    else router.push(`/documents/${item.id}`)
  }

  const deleteDocument = async (docId: string) => {
    const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Fehler beim Löschen'); return }
    setItems(prev => prev.filter(i => i.id !== docId))
    toast.success('Dokument gelöscht')
  }

  /**
   * Protokolle (Einzug/Auszug) haben kein REST-Endpoint — sie werden direkt
   * über Supabase gelöscht (RLS schützt vor fremden Zugriffen). Ohne diesen
   * Handler fehlte der Trash-Button in der Akten-Timeline, obwohl er laut
   * Design für alle Entwurfs-Einträge sichtbar sein muss.
   */
  const deleteProtocol = async (protocolId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('protocols').delete().eq('id', protocolId)
    if (error) { toast.error('Fehler beim Löschen'); return }
    setItems(prev => prev.filter(i => i.id !== protocolId))
    toast.success('Protokoll gelöscht')
  }

  const deleteItem = (item: TenancyItem) => {
    if (item.kind === 'protocol') return deleteProtocol(item.id)
    return deleteDocument(item.id)
  }

  const stage = useMemo(() => StageFromItems(items), [items])

  if (loading || !tenancy) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Lade Mietverhältnis…
        </div>
      </div>
    )
  }

  const property = tenancy.properties
  const address = property?.address || `${property?.street || ''} ${property?.house_number || ''}, ${property?.zip_code || ''} ${property?.city || ''}`.trim()
  const tenantFullName = `${tenancy.tenant_first_name || ''} ${tenancy.tenant_last_name || ''}`.trim()
  const tenantName = `${tenancy.tenant_salutation || ''} ${tenantFullName}`.trim()
  const initials = initialsOf(tenancy.tenant_first_name, tenancy.tenant_last_name)

  const existingTypes = new Set(items.map(i => i.type))

  const availableToAdd = Object.entries(ITEM_CONFIG).filter(([type]) => {
    if (type === 'sonstiges') return false
    if (existingTypes.has(type)) return false
    if (type === 'Auszug') {
      const einzug = items.find(i => i.type === 'Einzug')
      return einzug?.status === 'final'
    }
    return true
  })

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.14em] font-semibold">Mietverhältnis</p>
            <span className="text-muted-foreground/40">·</span>
            <p className="text-sm text-foreground truncate">{tenantFullName}</p>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => router.push(`/tenancy/${id}/edit`)} title="Bearbeiten">
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-8 motion-page-in">
        {/* Hero info card */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-ink">
          {/* Top accent strip */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brass-400 via-brass-500 to-brass-400" />

          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4 min-w-0 flex-1">
                {/* Avatar */}
                <div className="shrink-0 h-16 w-16 rounded-2xl bg-gradient-to-br from-ink-700 to-ink-900 flex items-center justify-center shadow-ink">
                  <span className="font-heading text-xl text-background tracking-wide">{initials}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={stage.variant} size="sm">{stage.label}</Badge>
                  </div>
                  <h1 className="font-heading text-2xl md:text-3xl text-foreground leading-tight">{tenantName || 'Unbenanntes Mietverhältnis'}</h1>
                  <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span className="break-words">{address}</span>
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
                title="Mietverhältnis löschen"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Contact chips */}
            {(tenancy.tenant_email || tenancy.tenant_phone) && (
              <div className="mt-5 pt-5 border-t border-border flex flex-wrap gap-2">
                {tenancy.tenant_email && (
                  <a
                    href={`mailto:${tenancy.tenant_email}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 hover:bg-muted text-xs text-foreground transition-colors"
                  >
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    {tenancy.tenant_email}
                  </a>
                )}
                {tenancy.tenant_phone && (
                  <a
                    href={`tel:${tenancy.tenant_phone}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 hover:bg-muted text-xs text-foreground transition-colors"
                  >
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    {tenancy.tenant_phone}
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Timeline */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass-600">Akte</p>
              <h2 className="font-heading text-xl text-foreground mt-0.5">Unterlagen &amp; Protokolle</h2>
            </div>
            <span className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? 'Eintrag' : 'Einträge'}</span>
          </div>

          {items.length === 0 ? (
            <EmptyTimeline />
          ) : (
            <div className="relative">
              {/* Vertical rail */}
              <div className="absolute left-[27px] top-6 bottom-6 w-px bg-border" aria-hidden="true" />

              <ul className="space-y-3">
                {items.map((item, idx) => {
                  const cfg = ITEM_CONFIG[item.type]
                  const Icon = cfg?.icon || FileText
                  const done = item.status === 'final'

                  return (
                    <li key={item.id} className="relative flex items-center gap-2 group/row motion-fade-up hover-lift" style={{ '--stagger-i': idx } as React.CSSProperties}>
                      <button
                        onClick={() => navigateToItem(item)}
                        className="relative flex items-center gap-4 flex-1 bg-card rounded-2xl border border-border shadow-xs px-4 py-3.5 hover:border-ink-200 hover:shadow-sm transition-all text-left group min-w-0"
                      >
                        {/* Milestone dot / icon */}
                        <div className={`relative shrink-0 h-14 w-14 rounded-2xl flex items-center justify-center z-10 ring-4 ring-background ${
                          done
                            ? 'bg-emerald-50 text-emerald-700'
                            : cfg?.accent === 'brass'
                              ? 'bg-brass-50 text-brass-700'
                              : 'bg-muted text-foreground'
                        }`}>
                          <Icon className="h-5 w-5" />
                          {done && (
                            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-background">
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/*
                            Badge wird auf Mobile unter den Namen umgebrochen
                            (flex-wrap), damit lange Titel wie
                            „Wohnungsgeberbestätigung" nicht mehr mit … gekürzt
                            werden. Ab sm: steht der Badge wieder rechts neben
                            dem Namen (gap-x-2).
                          */}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="font-medium text-foreground text-sm break-words">{item.name}</p>
                            {done ? (
                              <Badge variant="final" size="sm">Abgeschlossen</Badge>
                            ) : (
                              <Badge variant="draft" size="sm">Entwurf</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 break-words">
                            {cfg?.hint && <span className="mr-2">{cfg.hint}</span>}
                            {done && item.finalized_at && (
                              <span className="text-emerald-700">✓ {safeDate(item.finalized_at)}</span>
                            )}
                            {!done && item.date && <span>{safeDate(item.date)}</span>}
                          </p>
                        </div>

                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                      </button>

                      {/*
                        Trash ist für JEDEN Entwurf sichtbar — Dokumente UND
                        Protokolle. Vorher war die Bedingung auf kind='document'
                        eingeschränkt, sodass Einzugs-/Auszugsprotokolle
                        ausschließlich über das Dashboard löschbar waren.
                      */}
                      {!item.finalized_at && (
                        /*
                          Auf Mobile (ohne Hover) muss der Trash IMMER sichtbar
                          sein, sonst ist er auf Touch-Geräten unerreichbar.
                          Ab sm: greift der klassische Hover-Reveal.
                        */
                        <button
                          onClick={() => deleteItem(item)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100 shrink-0"
                          title={item.kind === 'protocol' ? 'Protokoll löschen' : 'Dokument löschen'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </section>

        {/* Add items */}
        <section>
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass-600">Nächster Schritt</p>
            <h2 className="font-heading text-xl text-foreground mt-0.5">Hinzufügen</h2>
            {availableToAdd.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Alle Standarddokumente wurden bereits angelegt — sie finden sich in der Akte oben.
              </p>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {availableToAdd.map(([type, cfg]) => {
              const Icon = cfg.icon
              const isCreating = creating === type
              const tone =
                cfg.accent === 'brass'
                  ? 'bg-brass-50 text-brass-700 group-hover:bg-brass-100'
                  : cfg.accent === 'emerald'
                    ? 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100'
                    : 'bg-ink-50 text-ink-700 group-hover:bg-ink-100'
              return (
                <button
                  key={type}
                  onClick={() => createItem(type)}
                  disabled={!!creating}
                  className="group flex items-center gap-3 bg-card rounded-2xl border border-dashed border-border px-4 py-3 hover:border-solid hover:border-ink-200 hover:shadow-xs transition-all text-left disabled:opacity-50"
                >
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${tone}`}>
                    {isCreating ? (
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{cfg.label}</p>
                    {cfg.hint && <p className="text-xs text-muted-foreground truncate">{cfg.hint}</p>}
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </button>
              )
            })}

            <button
              onClick={() => createItem('sonstiges')}
              disabled={!!creating}
              className="group flex items-center gap-3 bg-muted/40 rounded-2xl border border-dashed border-border px-4 py-3 hover:border-ink-200 hover:bg-muted/60 transition-all text-left disabled:opacity-50"
            >
              <div className="h-10 w-10 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Leeres Dokument</p>
                <p className="text-xs text-muted-foreground">Freier Text, eigene Vorlage</p>
              </div>
              <Plus className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </button>
          </div>
        </section>
      </main>

      <RentalContractDialog
        open={rentalDialogOpen}
        onOpenChange={setRentalDialogOpen}
        tenancyId={id as string}
        propertyId={tenancy?.property_id}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mietverhältnis löschen</DialogTitle>
            <DialogDescription>
              Möchten Sie das Mietverhältnis von <strong>{tenantFullName}</strong> wirklich löschen?
              Alle zugehörigen Protokolle und Dokumente werden ebenfalls gelöscht.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Abbrechen</Button>
            <Button variant="destructive" onClick={deleteTenancy} disabled={deleting}>
              {deleting ? 'Wird gelöscht…' : 'Endgültig löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EmptyTimeline() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-10 text-center">
      <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-card border border-border flex items-center justify-center">
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-heading text-lg text-foreground">Noch keine Unterlagen</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        Starten Sie mit dem Mietvertrag oder direkt mit dem Einzugsprotokoll — die Akte füllt sich danach Schritt für Schritt.
      </p>
    </div>
  )
}
