'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Plus, Trash2, Copy, FileText, FileCheck, Home, Key,
  ChevronDown, FilePen, FileSignature, MapPin, ClipboardList,
  ArrowRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

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

const DOC_TYPES = [
  { type: 'mietvertrag',               label: 'Mietvertrag',               icon: FileSignature, hint: 'Vor Einzug' },
  { type: 'wohnungsgeberbestaetigung', label: 'Wohnungsgeberbestätigung',  icon: Home,          hint: 'Bei Einzug' },
  { type: 'kautionsbescheinigung',     label: 'Kautionsbescheinigung',     icon: Key,           hint: 'Nach Kautionszahlung' },
  { type: 'sonstiges',                 label: 'Leeres Dokument',           icon: FilePen,       hint: 'Freier Text' },
]
const DOC_TYPE_ORDER: Record<string, number> = {
  mietvertrag: 1, wohnungsgeberbestaetigung: 2, kautionsbescheinigung: 3, sonstiges: 4,
}

const safeFormatDate = (dateStr: string | null) => {
  if (!dateStr) return 'Kein Datum'
  try { return format(new Date(dateStr), 'dd. MMMM yyyy', { locale: de }) }
  catch { return '' }
}

function initialsOf(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || '–'
}

function DocIcon({ type }: { type: string }) {
  const found = DOC_TYPES.find(d => d.type === type)
  const Icon = found?.icon || FileText
  return <Icon className="h-3.5 w-3.5 text-muted-foreground" />
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
  const [docToDelete, setDocToDelete] = useState<Document | null>(null)
  const docMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showDocMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (docMenuRef.current && !docMenuRef.current.contains(e.target as Node)) {
        setShowDocMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDocMenu])

  const loadDocuments = async () => {
    if (docsLoaded) return
    const tenancyId = group.tenancyId || group.einzug?.id
    if (!tenancyId) return
    const res = await fetch(`/api/documents?tenancy_id=${tenancyId}`)
    const { documents } = await res.json()
    setDocuments(documents || [])
    setDocsLoaded(true)
  }

  const confirmDeleteDocument = async () => {
    if (!docToDelete) return
    const docId = docToDelete.id
    const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Fehler beim Löschen'); return }
    setDocuments(prev => prev.filter(d => d.id !== docId))
    setDocToDelete(null)
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

  useEffect(() => { if (group.tenancyId || group.einzug) loadDocuments() }, [])

  // Lifecycle stage for the small indicator in the header
  const stage =
    !group.einzug ? 'new' :
    !group.einzug.finalized_at ? 'einzug-draft' :
    !group.auszug ? 'active' :
    !group.auszug.finalized_at ? 'auszug-draft' :
    'closed'

  const stageMeta: Record<string, { label: string; badge: 'draft' | 'active' | 'final' | 'brass' }> = {
    'new':            { label: 'Neu',              badge: 'draft' },
    'einzug-draft':   { label: 'Einzug in Arbeit', badge: 'active' },
    'active':         { label: 'Laufend',          badge: 'brass' },
    'auszug-draft':   { label: 'Auszug in Arbeit', badge: 'active' },
    'closed':         { label: 'Abgeschlossen',    badge: 'final' },
  }

  return (
    <article
      className="group/card relative flex flex-col rounded-2xl border border-border bg-card shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
      onClick={() => onOpenTenancy(group)}
    >
      {/* Top accent strip */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-brass-400/60 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />

      {/* Header with avatar + tenant */}
      <div className="px-5 pt-5 pb-4 border-b border-border/60">
        <div className="flex items-start gap-3.5">
          <div className="shrink-0 h-11 w-11 rounded-xl bg-ink-50 dark:bg-ink-800 text-ink-700 dark:text-brass-300 font-heading text-lg flex items-center justify-center">
            {initialsOf(group.tenantName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <Badge variant={stageMeta[stage].badge} size="sm">{stageMeta[stage].label}</Badge>
            </div>
            <h3 className="font-heading text-[19px] leading-tight text-foreground truncate">
              {group.tenantName}
            </h3>
            {group.propertyAddress && (
              <p className="mt-1 text-xs text-muted-foreground truncate flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {group.propertyAddress}
              </p>
            )}
          </div>
          <button
            className="shrink-0 h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center opacity-0 group-hover/card:opacity-100"
            title="Mietverhältnis duplizieren"
            onClick={(e) => { e.stopPropagation(); onDuplicate(group) }}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-4 space-y-2">
        {/* Einzug */}
        {group.einzug && (
          <ProtocolRow
            label="Einzug"
            icon={FileText}
            date={safeFormatDate(group.einzug.date)}
            finalized={!!group.einzug.finalized_at}
            onOpen={() => router.push(`/protocol/${group.einzug!.id}`)}
            onDelete={!group.einzug.finalized_at ? () => onDelete(group.einzug!.id) : undefined}
          />
        )}
        {group.auszug && (
          <ProtocolRow
            label="Auszug"
            icon={FileCheck}
            date={safeFormatDate(group.auszug.date)}
            finalized={!!group.auszug.finalized_at}
            onOpen={() => router.push(`/protocol/${group.auszug!.id}`)}
            onDelete={!group.auszug.finalized_at ? () => onDelete(group.auszug!.id) : undefined}
          />
        )}

        {/* Documents */}
        {docsLoaded && documents.length > 0 && (
          <div className="pt-2 mt-2 border-t border-border/60 space-y-0.5">
            {[...documents]
              .sort((a, b) => (DOC_TYPE_ORDER[a.type] ?? 99) - (DOC_TYPE_ORDER[b.type] ?? 99))
              .map(doc => (
                <div key={doc.id} className="flex items-center group/doc">
                  <button
                    className="flex items-center justify-between flex-1 min-w-0 rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors text-left"
                    onClick={(e) => { e.stopPropagation(); router.push(`/documents/${doc.id}`) }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <DocIcon type={doc.type} />
                      <span className="text-[13px] text-foreground/80 truncate">{doc.name}</span>
                    </div>
                    <Badge variant={doc.finalized_at ? 'final' : 'draft'} size="sm">
                      {doc.finalized_at ? 'Final' : 'Entwurf'}
                    </Badge>
                  </button>
                  {!doc.finalized_at && (
                    <button
                      className="p-1 ml-1 rounded text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover/doc:opacity-100"
                      onClick={(e) => { e.stopPropagation(); setDocToDelete(doc) }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add menu — attached to bottom */}
      <div ref={docMenuRef} className="relative px-5 pb-5">
        <button
          className={cn(
            'flex items-center justify-center gap-1.5 w-full rounded-lg border border-dashed px-3 py-2 text-sm transition-colors',
            'border-border text-foreground/70 hover:border-brass-400 hover:bg-brass-50/50 hover:text-brass-700',
            'dark:hover:bg-brass-900/20 dark:hover:text-brass-300'
          )}
          onClick={(e) => { e.stopPropagation(); setShowDocMenu(v => !v); loadDocuments() }}
          disabled={creatingDoc}
        >
          <Plus className="h-3.5 w-3.5" />
          {creatingDoc ? 'Erstellt...' : 'Hinzufügen'}
          <ChevronDown className={cn('h-3.5 w-3.5 ml-auto transition-transform', showDocMenu && 'rotate-180')} />
        </button>

        {showDocMenu && (
          <div className="absolute bottom-full mb-2 left-5 right-5 bg-popover rounded-xl border border-border shadow-xl z-20 overflow-hidden">
            {!group.einzug && (
              <MenuItem
                icon={ClipboardList}
                title="Einzugsprotokoll"
                hint="Protokoll bei Einzug"
                onClick={(e) => { e.stopPropagation(); setShowDocMenu(false); createEinzug() }}
                primary
              />
            )}
            {group.einzug?.finalized_at && !group.auszug && (
              <MenuItem
                icon={FileCheck}
                title="Auszugsprotokoll"
                hint="Protokoll bei Auszug"
                onClick={(e) => { e.stopPropagation(); setShowDocMenu(false); createAuszug() }}
                primary
              />
            )}
            {DOC_TYPES.map(({ type, label, icon, hint }) => (
              <MenuItem
                key={type}
                icon={icon}
                title={label}
                hint={hint}
                onClick={(e) => { e.stopPropagation(); createDocument(type) }}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!docToDelete} onOpenChange={(open) => !open && setDocToDelete(null)}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Dokument löschen</DialogTitle>
            <DialogDescription>
              Möchten Sie das Dokument „{docToDelete?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocToDelete(null)}>Abbrechen</Button>
            <Button variant="destructive" onClick={confirmDeleteDocument}>Löschen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  )
}

function ProtocolRow({
  label, icon: Icon, date, finalized, onOpen, onDelete,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  date: string
  finalized: boolean
  onOpen: () => void
  onDelete?: () => void
}) {
  return (
    <div className="flex items-center group/row">
      <button
        onClick={(e) => { e.stopPropagation(); onOpen() }}
        className="flex items-center justify-between flex-1 rounded-lg bg-muted/60 border border-border px-3 py-2.5 hover:bg-muted hover:border-brass-300/60 transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={cn(
            'h-7 w-7 rounded-md flex items-center justify-center shrink-0',
            finalized ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-brass-100 text-brass-700 dark:bg-brass-900/30 dark:text-brass-300'
          )}>
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground leading-tight">{label}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">{date}</p>
          </div>
        </div>
        <Badge variant={finalized ? 'final' : 'active'} size="sm">
          {finalized ? 'Abgeschlossen' : 'Entwurf'}
        </Badge>
      </button>
      {onDelete && (
        <button
          className="ml-1 p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover/row:opacity-100"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

function MenuItem({
  icon: Icon, title, hint, onClick, primary,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  hint?: string
  onClick: (e: React.MouseEvent) => void
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full px-4 py-3 hover:bg-muted transition-colors text-left border-b border-border last:border-0',
        primary && 'bg-brass-50/50 dark:bg-brass-900/10'
      )}
    >
      <span className={cn(
        'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
        primary
          ? 'bg-brass-100 text-brass-700 dark:bg-brass-900/40 dark:text-brass-300'
          : 'bg-muted text-foreground/70'
      )}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground block">{title}</span>
        {hint && <span className="text-[11px] text-muted-foreground block">{hint}</span>}
      </span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
    </button>
  )
}
