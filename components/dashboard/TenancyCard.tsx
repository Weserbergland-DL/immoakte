'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Plus, Trash2, Copy, FileText, FileCheck, Home, Key,
  ChevronDown, FilePen, FileSignature, Building2
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
  tenancyId?: string   // real tenancy table ID (may differ from einzug.id for new tenancies)
  tenantName: string
  propertyAddress?: string
  einzug?: Protocol
  auszug?: Protocol
}

// Sorted by chronological need in a tenancy lifecycle
const DOC_TYPES = [
  { type: 'mietvertrag', label: 'Mietvertrag', icon: FileSignature, hint: 'Vor Einzug' },
  { type: 'wohnungsgeberbestaetigung', label: 'Wohnungsgeberbestätigung', icon: Home, hint: 'Bei Einzug' },
  { type: 'kautionsbescheinigung', label: 'Kautionsbescheinigung', icon: Key, hint: 'Nach Kautionszahlung' },
  { type: 'sonstiges', label: 'Eigenes Dokument', icon: FilePen, hint: '' },
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
    const protocolId = group.einzug?.id
    if (!protocolId) return
    const res = await fetch(`/api/documents?protocol_id=${protocolId}`)
    const { documents } = await res.json()
    setDocuments(documents || [])
    setDocsLoaded(true)
  }

  const createDocument = async (type: string) => {
    setCreatingDoc(true)
    setShowDocMenu(false)
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        protocol_id: group.einzug?.id || null,
        property_id: group.einzug?.property_id || null,
      }),
    })
    const { document, error } = await res.json()
    setCreatingDoc(false)
    if (error) { toast.error('Fehler beim Erstellen'); return }
    router.push(`/documents/${document.id}`)
  }

  const createAuszug = async () => {
    if (!group.einzug) return
    toast.loading('Erstelle Auszugsprotokoll...', { id: 'create-auszug' })
    const einzug = group.einzug
    const newRooms = einzug.rooms?.map(r => ({ ...r, defects: r.defects || [] })) || []
    const newMeters = einzug.meters?.map(m => ({ ...m, reading: '', photoUrl: '' })) || []

    const { data, error } = await supabase.from('protocols').insert({
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

  // Load docs when card mounts if einzug exists
  useState(() => { if (group.einzug) loadDocuments() })

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

        {group.auszug ? (
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
        ) : (
          group.einzug?.finalized_at && (
            <button className="flex items-center justify-between rounded-md border border-dashed border-slate-300 px-3 py-2 text-left hover:border-slate-400 hover:bg-slate-50 transition-colors w-full"
              onClick={(e) => { e.stopPropagation(); createAuszug() }}>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Auszugsprotokoll
              </p>
            </button>
          )
        )}

        {/* Documents */}
        {docsLoaded && documents.length > 0 && (
          <div className="border-t border-slate-100 pt-2 space-y-1">
            {[...documents]
              .sort((a, b) => (DOC_TYPE_ORDER[a.type] ?? 99) - (DOC_TYPE_ORDER[b.type] ?? 99))
              .map(doc => (
              <button key={doc.id}
                className="flex items-center justify-between w-full rounded-md px-3 py-1.5 hover:bg-slate-50 transition-colors text-left"
                onClick={(e) => { e.stopPropagation(); router.push(`/documents/${doc.id}`) }}>
                <p className="text-sm flex items-center gap-1.5 text-slate-700">
                  <DocIcon type={doc.type} />
                  <span className="truncate max-w-[160px]">{doc.name}</span>
                </p>
                <StatusBadge finalized={doc.finalized_at} />
              </button>
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
            {creatingDoc ? 'Erstellt...' : 'Dokument hinzufügen'}
            <ChevronDown className={`h-3.5 w-3.5 ml-auto transition-transform ${showDocMenu ? 'rotate-180' : ''}`} />
          </button>

          {showDocMenu && (
            <div className="absolute bottom-full mb-1 left-0 right-0 bg-white rounded-lg border border-slate-200 shadow-lg z-10 overflow-hidden">
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
