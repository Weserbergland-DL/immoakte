'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DocumentEditor } from '@/components/DocumentEditor'
import { toast } from 'sonner'
import {
  ArrowLeft, Save, Download, CheckCircle, FileText,
  Tag, Trash2, AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { PLACEHOLDER_LABELS } from '@/lib/document-templates'

const TYPE_LABELS: Record<string, string> = {
  wohnungsgeberbestaetigung: 'Wohnungsgeberbestätigung',
  mietvertrag: 'Mietvertrag',
  kautionsbescheinigung: 'Kautionsbescheinigung',
  sonstiges: 'Leeres Dokument',
}

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [doc, setDoc] = useState<any>(null)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [showPlaceholders, setShowPlaceholders] = useState(false)

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    fetch(`/api/documents/${id}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(({ document, error }) => {
        if (error) { toast.error('Dokument nicht gefunden'); router.replace('/dashboard'); return }
        setDoc(document)
        setName(document.name)
        setContent(document.content)
        setLoading(false)
      })
      .catch(() => {
        toast.error('Dokument konnte nicht geladen werden')
        router.replace('/dashboard')
      })
  }, [id, user])

  const save = useCallback(async (opts?: { finalize?: boolean }) => {
    setSaving(true)
    const updates: any = { name, content }
    if (opts?.finalize) {
      updates.status = 'final'
      updates.finalized_at = new Date().toISOString()
    }
    const res = await fetch(`/api/documents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      setIsDirty(false)
      if (opts?.finalize) {
        setDoc((prev: any) => ({ ...prev, status: 'final', finalized_at: updates.finalized_at }))
        toast.success('Dokument abgeschlossen')
      } else {
        toast.success('Gespeichert')
      }
    } else {
      toast.error('Fehler beim Speichern')
    }
    setSaving(false)
  }, [id, name, content])

  const handleDelete = async () => {
    if (!confirm('Dokument wirklich löschen?')) return
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Fehler beim Löschen'); return }
    toast.success('Dokument gelöscht')
    router.push('/dashboard')
  }

  const downloadPDF = async () => {
    toast.loading('PDF wird erstellt...', { id: 'doc-pdf' })
    try {
      // Save first
      await save()

      const html2pdf = (await import('html2pdf.js')).default
      const container = document.createElement('div')
      container.style.cssText = 'width:210mm;padding:20mm;font-family:Helvetica,Arial,sans-serif;font-size:11pt;line-height:1.6;color:#0f172a;background:#fff'
      container.innerHTML = content

      // Style the content nicely for PDF
      const style = document.createElement('style')
      style.textContent = `
        h1 { font-size: 20pt; font-weight: 800; margin: 0 0 4mm 0; }
        h2 { font-size: 13pt; font-weight: 700; margin: 5mm 0 2mm 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 1mm; }
        p { margin: 0 0 3mm 0; }
        hr { border: none; border-top: 1px solid #cbd5e1; margin: 4mm 0; }
        strong { font-weight: 700; }
        em { color: #64748b; font-size: 9pt; }
        ul, ol { margin: 0 0 3mm 4mm; }
      `
      container.prepend(style)
      document.body.appendChild(container)

      const filename = `${name.replace(/\s+/g, '_')}.pdf`
      await html2pdf().set({
        margin: 0,
        filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(container).save()

      document.body.removeChild(container)
      toast.success('PDF heruntergeladen', { id: 'doc-pdf' })
    } catch (e) {
      toast.error('Fehler beim Erstellen der PDF', { id: 'doc-pdf' })
    }
  }

  const insertPlaceholder = (ph: string) => {
    // Insert placeholder at cursor or append to content
    const withPh = content + `<p>${ph}</p>`
    setContent(withPh)
    setIsDirty(true)
    setShowPlaceholders(false)
    toast.info(`Platzhalter eingefügt: ${ph}`)
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-muted-foreground">Lade Dokument...</div>
    </div>
  )

  const isFinalized = doc?.status === 'final'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              {isFinalized ? (
                <h1 className="font-semibold text-slate-900 truncate text-sm">{name}</h1>
              ) : (
                <Input
                  value={name}
                  onChange={(e) => { setName(e.target.value); setIsDirty(true) }}
                  className="h-7 text-sm font-semibold border-0 shadow-none px-0 focus-visible:ring-0 bg-transparent max-w-[300px]"
                />
              )}
              <p className="text-xs text-muted-foreground">{TYPE_LABELS[doc?.type] || doc?.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isFinalized ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                <CheckCircle className="h-3.5 w-3.5" /> Abgeschlossen
              </span>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowPlaceholders(v => !v)}>
                  <Tag className="h-3.5 w-3.5 mr-1.5" />
                  Platzhalter
                </Button>
                <Button variant="outline" size="sm" onClick={() => save()} disabled={saving || !isDirty}>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {saving ? 'Speichert...' : 'Speichern'}
                </Button>
                <Button size="sm" onClick={() => save({ finalize: true })} disabled={saving}>
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  Abschließen
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={downloadPDF}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              PDF
            </Button>
            {!isFinalized && (
              <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Placeholder drawer */}
      {showPlaceholders && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="mx-auto max-w-5xl px-4 py-3">
            <p className="text-xs font-medium text-blue-700 mb-2">Platzhalter einfügen (wird beim Erstellen automatisch befüllt):</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PLACEHOLDER_LABELS).map(([ph, label]) => (
                <button
                  key={ph}
                  onClick={() => insertPlaceholder(ph)}
                  className="text-xs bg-white border border-blue-200 hover:border-blue-400 text-blue-700 px-2.5 py-1 rounded-full transition-colors"
                >
                  {ph} <span className="text-blue-400">· {label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mietvertrag warning */}
      {doc?.type === 'mietvertrag' && !isFinalized && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="mx-auto max-w-5xl px-4 py-2 flex items-center gap-2 text-amber-700 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Rechtlicher Hinweis: Bitte lassen Sie diesen Mietvertrag vor Unterzeichnung von einem Rechtsanwalt prüfen.</span>
          </div>
        </div>
      )}

      {/* Editor */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Meta info */}
        {(doc?.tenant_first_name || doc?.finalized_at) && (
          <div className="mb-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {doc.tenant_first_name && (
              <span>Mieter: <strong className="text-slate-700">{doc.tenant_first_name} {doc.tenant_last_name}</strong></span>
            )}
            {doc.finalized_at && (
              <span>Abgeschlossen: <strong className="text-slate-700">
                {format(new Date(doc.finalized_at), 'dd. MMMM yyyy', { locale: de })}
              </strong></span>
            )}
          </div>
        )}

        {/* Editor or read-only view */}
        <div className="bg-white rounded-xl shadow-sm">
          {isFinalized ? (
            <div
              className="prose prose-sm max-w-none p-8"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <DocumentEditor
              content={content}
              onChange={(html) => { setContent(html); setIsDirty(true) }}
            />
          )}
        </div>

        {isDirty && !isFinalized && (
          <p className="text-xs text-muted-foreground mt-2 text-center">Ungespeicherte Änderungen</p>
        )}
      </main>
    </div>
  )
}
