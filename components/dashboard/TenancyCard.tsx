'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Plus, Trash2, Copy, FileText, FileCheck, Home, Key,
  ChevronDown, FilePen, FileSignature, Building2, ClipboardList
} from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'

interface Protocol {
  id: string
  tenant_first_name?: string
  tenant_last_name?: string
  tenant_salutation?: string
  tenant_email?: string
  date: string | null
  type: string
  status: string
  property_id: string
  propertyAddress?: string
  linked_protocol_id?: string | null
  finalized_at?: string | null
  rooms?: any[]
  meters?: any[]
  keys?: any[]
}

interface Document {
  id: string
  name: string
  type: string
  status: string
  created_at: string
  finalized_at?: string | null
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

// Sorted by chronological need in a tenancy lifecycle
const DOC_TYPES = [
  { type: 'mietvertrag', label: 'Mietvertrag', icon: FileSignature, hint: 'Vor Einzug' },
  { type: 'wohnungsgeberbestaetigung', label: 'Wohnungsgeberbestätigung', icon: Home, hint: 'Bei Einzug' },
  { type: 'kautionsbescheinigung', label: 'Kautionsbescheinigung', icon: Key, hint: 'Nach Kautionszahlung' },
  { type: 'sonstiges', label: 'Leeres Dokument', icon: FilePen, hint: 'Freier Text, eigene Vorlage' },
]

// Priority order for sorting displayed documents
const DOC_TYPE_ORDER: Record<string, number> = {
  mietvertrag: 1,
  wohnungsgeberbestaetigung: 2,
  kautionsbescheinigung: 3,
  sonstiges: 4,
}

const safeFormatDate = (dateStr: string | null) => {
  if (!dateStr) return 'Kein Datum'
  try { return format(new Date(dateStr), 'dd. MMMM yyyy', { locale: de }) }
  catch { return '' }
}

function StatusBadge({ finalized }: { finalized?: string | null }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
      finalized ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
    }`}>
      {finalized ? 'Abgeschlossen' : 'Entwurf'}
    </span>
  )
}

function DocIcon({ type }: { type: string }) {
  const found = DOC_TYPES.find(d => d.type === type)
  const Icon = found?.icon || FileText
  return <Icon className="h-3.5 w-3.5 text-slate-500" />
}

interface TenancyCardProps {
  group: TenancyGroup
  userId: string
  onDelete: (id: string) => void
  onDuplicate: (group: TenancyGroup) => void
  onAuszugCreated: (auszug: Protocol) => void
  onOpenTenancy: (group: TenancyGroup) => void
}

export function TenancyCard({ group, userId, onDelete, onDuplicate, onAuszugCreated, onOpenTenancy }: TenancyCardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [showDocMenu, setShowDocMenu] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [docsLoaded, setDocsLoaded] = useState(false)
  const [creatingDoc, setCreatingDoc] = useState(false)

  const loadDocuments = async () => {
    if (docsLoaded) return
    const tenancyId = group.tenancyId || group.einzug?.id
    if (!tenancyId) return
    const res = await fetch(`/api/documents?tenancy_id=${tenancyId}`)
    const { documents } = await res.json()
    setDocuments(documents || [])
    setDocsLoaded(true)
  }

  const deleteDocument = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Fehler beim Löschen'); return }
    setDocuments(prev => prev.filter(d => d.id !== docId))
    toast.success('Dokument gelöscht')
  }

  const createDocument = async (type: string) => {
    setCreatingDoc(true)
    setShowDocMenu(false)
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        tenancy_id: group.tenancyId || group.einzug?.id || null,
        property_id: group.propertyId || group.einzug?.property_id || null,
      }),
    })
    const { document, error } = await res.json()
    setCreatingDoc(false)
    if (error) { toast.error('Fehler beim Erstellen'); return }
    router.push(`/documents/${document.id}`)
  }

  const createEinzug = async () => {
    toast.loading('Erstelle Einzugsprotokoll...', { id: 'create-einzug' })
    const { data, error } = await supabase.from('protocols').insert({
      tenancy_id: group.tenancyId,
      property_id: group.propertyId || null,
      owner_id: userId,
      tenant_salutation: group.tenantSalutation || '',
      tenant_first_name: group.tenantFirstName || '',
      tenant_last_name: group.tenantLastName || '',
      tenant_email: group.tenantEmail || null,
      tenant_phone: group.tenantPhone || null,
      date: new Date().toISOString(),
      type: 'Einzug',
      status: 'draft',
      rooms: [],
      meters: [
        { id: crypto.randomUUID(), type: 'Strom', number: '', reading: '', photoUrl: '' },
        { id: crypto.randomUUID(), type: 'Wasser', number: '', reading: '', photoUrl: '' },
      ],
      keys: [],
    }).select().single()
    if (error) { toast.error('Fehler', { id: 'create-einzug' }); return }
    toast.success('Einzugsprotokoll erstellt', { id: 'create-einzug' })
    router.push(`/protocol/${data.id}`)
  }

  const createAuszug = async () => {
    if (!group.einzug) return
    toast.loading('Erstelle Auszugsprotokoll...', { id: 'create-auszug' })
    const einzug = group.einzug
    const newRooms = einzug.rooms?.map(r => ({ ...r, defects: r.defects || [] })) || []
    const newMeters = einzug.meters?.map(m => ({ ...m, reading: '', photoUrl: '' })) || []

    const { data, error } = await supabase.from('protocols').insert({
      tenancy_id: group.tenancyId || einzug.id,
      property_id: einzug.property_id,
      owner_id: userId,
      tenant_salutation: einzug.tenant_salutation || '',
      tenant_first_name: einzug.tenant_first_name || '',
      tenant_last_name: einzug.tenant_last_name || '',
      date: new Date().toISOString(),
      type: 'Auszug',
      status: 'draft',
      linked_protocol_id: einzug.id,
      rooms: newRooms,
      meters: newMeters,
      keys: einzug.keys || [],
    }).select().single()

    if (error) { toast.error('Fehler', { id: 'create-auszug' }); return }
    toast.success('Auszugsprotokoll erstellt', { id: 'create-auszug' })
    onAuszugCreated({ ...data, propertyAddress: group.propertyAddress })
    router.push(`/protocol/${data.id}`)
  }

  // Load docs when card mounts if tenancy exists
  useEffect(() => { if (group.tenancyId || group.einzug) loadDocuments() }, [])

  return (
    <Card
      className="hover:border-primary/40 hover:shadow-md transition-all flex flex-col cursor-pointer"
      onClick={() => onOpenTenancy(group)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mietverhältnis</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground"
            title="Mietverhältnis duplizieren"
            onClick={(e) => { e.stopPropagation(); onDuplicate(group) }}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
        <CardTitle className="text-lg">{group.tenantName}</CardTitle>
        {group.propertyAddress && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1 flex items-center gap-1">
            <Building2 className="h-3 w-3 shrink-0" />
            {group.propertyAddress}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-2">
        {/* Protocols */}
        {group.einzug && (
          <button className="flex items-center justify-between rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-left hover:bg-slate-100 transition-colors w-full"
            onClick={(e) => { e.stopPropagation(); router.push(`/protocol/${group.einzug!.id}`) }}>
            <div>
              <p className="text-sm font-medium flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-400" /> Einzug
              </p>
              <p className="text-xs text-muted-foreground">{safeFormatDate(group.einzug.date)}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge finalized={group.einzug.finalized_at} />
              {!group.einzug.finalized_at && (
                <span className="p-1 hover:text-destructive text-muted-foreground transition-colors"
                  onClick={(e) => { e.stopPropagation(); onDelete(group.einzug!.id) }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </button>
        )}

        {group.auszug && (
          <button className="flex items-center justify-between rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-left hover:bg-slate-100 transition-colors w-full"
            onClick={(e) => { e.stopPropagation(); router.push(`/protocol/${group.auszug!.id}`) }}>
            <div>
              <p className="text-sm font-medium flex items-center gap-1.5">
                <FileCheck className="h-3.5 w-3.5 text-slate-400" /> Auszug
              </p>
              <p className="text-xs text-muted-foreground">{safeFormatDate(group.auszug.date)}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge finalized={group.auszug.finalized_at} />
              {!group.auszug.finalized_at && (
                <span className="p-1 hover:text-destructive text-muted-foreground transition-colors"
                  onClick={(e) => { e.stopPropagation(); onDelete(group.auszug!.id) }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </button>
        )}

        {/* Documents */}
        {docsLoaded && documents.length > 0 && (
          <div className="border-t border-slate-100 pt-2 space-y-1">
            {[...documents]
              .sort((a, b) => (DOC_TYPE_ORDER[a.type] ?? 99) - (DOC_TYPE_ORDER[b.type] ?? 99))
              .map(doc => (
              <div key={doc.id} className="flex items-center w-full group/doc">
                <button
                  className="flex items-center justify-between flex-1 rounded-md px-3 py-1.5 hover:bg-slate-50 transition-colors text-left"
                  onClick={(e) => { e.stopPropagation(); router.push(`/documents/${doc.id}`) }}>
                  <p className="text-sm flex items-center gap-1.5 text-slate-700">
                    <DocIcon type={doc.type} />
                    <span className="truncate max-w-[140px]">{doc.name}</span>
                  </p>
                  <StatusBadge finalized={doc.finalized_at} />
                </button>
                {!doc.finalized_at && (
                  <span
                    className="p-1 ml-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover/doc:opacity-100 cursor-pointer shrink-0"
                    onClick={(e) => deleteDocument(doc.id, e)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add document button */}
        <div className="relative mt-auto">
          <button
            className="flex items-center justify-center gap-1.5 w-full rounded-md border border-dashed border-primary/40 px-3 py-2 text-sm text-primary hover:bg-primary/5 transition-colors mt-1"
            onClick={(e) => { e.stopPropagation(); setShowDocMenu(v => !v); loadDocuments() }}
            disabled={creatingDoc}
          >
            <Plus className="h-3.5 w-3.5" />
            {creatingDoc ? 'Erstellt...' : 'Hinzufügen'}
            <ChevronDown className={`h-3.5 w-3.5 ml-auto transition-transform ${showDocMenu ? 'rotate-180' : ''}`} />
          </button>

          {showDocMenu && (
            <div className="absolute bottom-full mb-1 left-0 right-0 bg-white rounded-lg border border-slate-200 shadow-lg z-10 overflow-hidden">
              {/* Protocol items first */}
              {!group.einzug && (
                <button onClick={(e) => { e.stopPropagation(); setShowDocMenu(false); createEinzug() }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-slate-50 transition-colors text-left border-b border-slate-100">
                  <ClipboardList className="h-4 w-4 text-primary shrink-0" />
                  <span className="flex-1">
                    <span className="text-sm text-slate-800 block">Einzugsprotokoll</span>
                    <span className="text-xs text-muted-foreground">Protokoll bei Einzug</span>
                  </span>
                </button>
              )}
              {group.einzug?.finalized_at && !group.auszug && (
                <button onClick={(e) => { e.stopPropagation(); setShowDocMenu(false); createAuszug() }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-slate-50 transition-colors text-left border-b border-slate-100">
                  <FileCheck className="h-4 w-4 text-primary shrink-0" />
                  <span className="flex-1">
                    <span className="text-sm text-slate-800 block">Auszugsprotokoll</span>
                    <span className="text-xs text-muted-foreground">Protokoll bei Auszug</span>
                  </span>
                </button>
              )}
              {/* Document items */}
              {DOC_TYPES.map(({ type, label, icon: Icon, hint }) => (
                <button key={type} onClick={(e) => { e.stopPropagation(); createDocument(type) }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-slate-50 transition-colors text-left">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="flex-1">
                    <span className="text-sm text-slate-800 block">{label}</span>
                    {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
