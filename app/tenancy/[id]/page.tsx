'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  ArrowLeft, Plus, FileSignature, Home, Key, FileText,
  FileCheck, CheckCircle2, Clock, ChevronRight, Building2,
  Mail, Phone, User, Pencil, Trash2
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'

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
}> = {
  mietvertrag:               { label: 'Mietvertrag',               icon: FileSignature, hint: 'Vor Einzug',             order: 1, kind: 'document'  },
  Einzug:                    { label: 'Einzugsprotokoll',           icon: FileText,      hint: 'Am Einzugstag',          order: 2, kind: 'protocol'  },
  wohnungsgeberbestaetigung: { label: 'Wohnungsgeberbestätigung',   icon: Home,          hint: 'Pflicht bei Einzug',     order: 3, kind: 'document'  },
  kautionsbescheinigung:     { label: 'Kautionsbescheinigung',      icon: Key,           hint: 'Nach Kautionszahlung',   order: 4, kind: 'document'  },
  Auszug:                    { label: 'Auszugsprotokoll',           icon: FileCheck,     hint: 'Bei Auszug',             order: 5, kind: 'protocol'  },
  sonstiges:                 { label: 'Leeres Dokument',            icon: FileText,      hint: 'Freier Text, eigene Vorlage', order: 6, kind: 'document'  },
}

function safeDate(d?: string | null) {
  if (!d) return null
  try { return format(new Date(d), 'dd. MMM yyyy', { locale: de }) }
  catch { return null }
}

function StatusBadge({ status, finalized }: { status: string; finalized?: string | null }) {
  const done = status === 'final' || !!finalized
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
      done ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
    }`}>
      {done ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {done ? 'Abgeschlossen' : 'Entwurf'}
    </span>
  )
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

    // Merge protocols + documents into unified items list
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
    setCreating(type)
    const cfg = ITEM_CONFIG[type]

    try {
      if (cfg.kind === 'protocol') {
        const einzugItem = items.find(i => i.type === 'Einzug')

        // For Auszug: load Einzug data to pre-fill rooms/meters/keys
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
        // Create document
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

  if (loading || !tenancy) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-muted-foreground">Lade Mietverhältnis...</div>
      </div>
    )
  }

  const property = tenancy.properties
  const address = property?.address || `${property?.street || ''} ${property?.house_number || ''}, ${property?.zip_code || ''} ${property?.city || ''}`.trim()
  const tenantName = `${tenancy.tenant_salutation || ''} ${tenancy.tenant_first_name || ''} ${tenancy.tenant_last_name || ''}`.trim()

  // Which types already exist?
  const existingTypes = new Set(items.map(i => i.type))

  // Available items to add (not yet created)
  const availableToAdd = Object.entries(ITEM_CONFIG).filter(([type, cfg]) => {
    if (existingTypes.has(type)) return false
    // Auszug only available after Einzug is finalized
    if (type === 'Auszug') {
      const einzug = items.find(i => i.type === 'Einzug')
      return einzug?.status === 'final'
    }
    // Only one 'sonstiges' shown in add section, can add more from there
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-slate-900 truncate text-sm">{tenantName}</h1>
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <Building2 className="h-3 w-3 shrink-0" /> {address}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {/* Tenant info card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{tenantName}</p>
                <div className="flex flex-wrap gap-3 mt-1">
                  {tenancy.tenant_email && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {tenancy.tenant_email}
                    </span>
                  )}
                  {tenancy.tenant_phone && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {tenancy.tenant_phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" title="Bearbeiten"
                onClick={() => router.push(`/tenancy/${id}/edit`)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Mietverhältnis löschen"
                onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-sm text-slate-600">
            <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
            {address}
          </div>
        </div>

        {/* Document timeline */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Unterlagen & Protokolle
          </h2>

          <div className="relative">
            {/* Vertical line */}
            {items.length > 0 && (
              <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-slate-200" />
            )}

            <div className="space-y-3">
              {items.map((item) => {
                const cfg = ITEM_CONFIG[item.type]
                const Icon = cfg?.icon || FileText
                const done = item.status === 'final'

                return (
                  <div key={item.id} className="relative flex items-center gap-2 group/item">
                    <button
                      onClick={() => navigateToItem(item)}
                      className="relative flex items-center gap-4 flex-1 bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3.5 hover:border-primary/40 hover:shadow-md transition-all text-left group"
                    >
                      {/* Icon with done indicator */}
                      <div className={`relative shrink-0 h-10 w-10 rounded-full flex items-center justify-center z-10 ${
                        done ? 'bg-green-100' : 'bg-slate-100'
                      }`}>
                        <Icon className={`h-5 w-5 ${done ? 'text-green-600' : 'text-slate-500'}`} />
                        {done && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cfg?.hint && <span className="mr-2">{cfg.hint}</span>}
                          {done && item.finalized_at && (
                            <span className="text-green-600">✓ {safeDate(item.finalized_at)}</span>
                          )}
                          {!done && item.date && (
                            <span>{safeDate(item.date)}</span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={item.status} finalized={item.finalized_at} />
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                      </div>
                    </button>

                    {/* Delete button for non-finalized documents */}
                    {item.kind === 'document' && !item.finalized_at && (
                      <button
                        onClick={() => deleteDocument(item.id)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover/item:opacity-100 shrink-0"
                        title="Dokument löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Add items section */}
        {availableToAdd.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Hinzufügen
            </h2>
            <div className="space-y-2">
              {availableToAdd.map(([type, cfg]) => {
                const Icon = cfg.icon
                const isCreating = creating === type
                return (
                  <button
                    key={type}
                    onClick={() => createItem(type)}
                    disabled={!!creating}
                    className="flex items-center gap-3 w-full bg-white rounded-xl border border-dashed border-slate-300 px-4 py-3 hover:border-primary hover:bg-primary/5 transition-all text-left disabled:opacity-50"
                  >
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {isCreating ? (
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">{cfg.label}</p>
                      {cfg.hint && <p className="text-xs text-muted-foreground">{cfg.hint}</p>}
                    </div>
                    <Plus className="h-4 w-4 text-primary" />
                  </button>
                )
              })}

              {/* Always show "add custom doc" option */}
              <button
                onClick={() => createItem('sonstiges')}
                disabled={!!creating}
                className="flex items-center gap-3 w-full bg-white rounded-xl border border-dashed border-slate-200 px-4 py-3 hover:border-slate-400 hover:bg-slate-50 transition-all text-left disabled:opacity-50"
              >
                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <Plus className="h-4 w-4 text-slate-500" />
                </div>
                <p className="text-sm text-slate-500">Leeres Dokument erstellen</p>
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-slate-600">Noch keine Unterlagen</p>
            <p className="text-sm mt-1">Starte mit dem Mietvertrag oder dem Einzugsprotokoll</p>
          </div>
        )}
      </main>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mietverhältnis löschen</DialogTitle>
            <DialogDescription>
              Möchten Sie das Mietverhältnis von <strong>{tenantName}</strong> wirklich löschen?
              Alle zugehörigen Protokolle und Dokumente werden ebenfalls gelöscht.
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Abbrechen</Button>
            <Button variant="destructive" onClick={deleteTenancy} disabled={deleting}>
              {deleting ? 'Wird gelöscht...' : 'Endgültig löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
