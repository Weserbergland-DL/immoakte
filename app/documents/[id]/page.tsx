'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useDocument } from '@/hooks/useDocument'
import { DocumentToolbar, DOC_TYPE_LABELS } from '@/components/documents/DocumentToolbar'
import { DocumentPaper } from '@/components/documents/DocumentPaper'
import { PlaceholderSidebar } from '@/components/documents/PlaceholderSidebar'
import { SaveAsTemplateDialog } from '@/components/documents/SaveAsTemplateDialog'
import { DeleteDocumentDialog } from '@/components/documents/DeleteDocumentDialog'
import type { SignResult } from '@/components/documents/SignDialog'

// SignDialog only mounts when user clicks "Abschließen" — keeps signature_pad
// off the initial route bundle.
const SignDialog = dynamic(
  () => import('@/components/documents/SignDialog').then(m => ({ default: m.SignDialog })),
  { ssr: false },
)

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const {
    doc, name, content, parsedSections, loading, saving, isDirty, isFinalized,
    changeName, changeContent, changeSections, insertPlaceholder,
    save, finalize, remove, downloadPdf, saveAsTemplate,
  } = useDocument(id, !!user)

  // Local UI state (modals, panels) — fully owned by this page.
  const [showPlaceholders, setShowPlaceholders] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [saveTplOpen, setSaveTplOpen] = useState(false)
  const [signOpen, setSignOpen] = useState(false)

  const signParties = useMemo(() => {
    const fullName = `${doc?.tenant_first_name || ''} ${doc?.tenant_last_name || ''}`.trim()
    if (doc?.type === 'kautionsbescheinigung' || doc?.type === 'wohnungsgeberbestaetigung') {
      return [{ key: 'vermieter', label: 'Vermieter / Vermieterin', hint: 'Ihre Unterschrift' }]
    }
    return [
      { key: 'vermieter', label: 'Vermieter / Vermieterin', hint: 'Ihre Unterschrift' },
      { key: 'mieter', label: 'Mieter / Mieterin', hint: fullName || 'Unterschrift Mieter' },
    ]
  }, [doc?.type, doc?.tenant_first_name, doc?.tenant_last_name])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Lade Dokument…
        </div>
      </div>
    )
  }

  const handleFinalizeClick = async () => {
    if (isDirty) await save({ silent: true })
    setSignOpen(true)
  }

  const handleSignComplete = async (result: SignResult) => {
    await finalize({ signatureMode: result.mode, signatures: result.signatures })
  }

  const handleConfirmDelete = async () => {
    const ok = await remove()
    if (ok) setShowDelete(false)
  }

  const defaultTplName = `Meine ${(doc?.type && DOC_TYPE_LABELS[doc.type]) || 'Vorlage'}`

  return (
    <div className="min-h-screen bg-background pt-14 pb-24">
      <DocumentToolbar
        name={name}
        onNameChange={changeName}
        docType={doc?.type}
        tenancyId={doc?.tenancy_id}
        isFinalized={isFinalized}
        isDirty={isDirty}
        saving={saving}
        placeholdersOpen={showPlaceholders}
        onTogglePlaceholders={() => setShowPlaceholders(v => !v)}
        onSave={() => save()}
        onSaveAsTemplate={() => setSaveTplOpen(true)}
        onFinalize={handleFinalizeClick}
        onDownloadPdf={downloadPdf}
        onRequestDelete={() => setShowDelete(true)}
      />

      {doc?.type === 'mietvertrag' && !isFinalized && (
        <div className="bg-brass-50 border-b border-brass-200">
          <div className="mx-auto max-w-5xl px-4 py-2.5 flex items-center gap-2 text-brass-800 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              <strong className="font-medium">Rechtlicher Hinweis:</strong>{' '}
              Bitte lassen Sie diesen Mietvertrag vor Unterzeichnung von einem Rechtsanwalt prüfen.
            </span>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-8">
        {(doc?.tenant_first_name || doc?.finalized_at) && (
          <div className="mb-6 flex flex-wrap gap-2">
            {doc?.tenant_first_name && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 text-xs">
                <span className="text-muted-foreground">Mieter</span>
                <span className="font-medium text-foreground">{doc.tenant_first_name} {doc.tenant_last_name}</span>
              </span>
            )}
            {doc?.finalized_at && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs">
                <CheckCircle2 className="h-3 w-3" />
                {format(new Date(doc.finalized_at), 'dd. MMMM yyyy', { locale: de })}
              </span>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          {/* min-w-0 lets this grid item shrink below its intrinsic content-min
              width — without it, inner tables/long titles would push the
              column wider than the viewport on mobile (< 768px). */}
          <div className="min-w-0">
            <DocumentPaper
              parsedSections={parsedSections}
              content={content}
              isFinalized={isFinalized}
              isDirty={isDirty}
              onSectionsChange={changeSections}
              onContentChange={changeContent}
            />
          </div>

          {showPlaceholders && !isFinalized && (
            <PlaceholderSidebar
              onClose={() => setShowPlaceholders(false)}
              onInsert={insertPlaceholder}
            />
          )}
        </div>
      </main>

      <SignDialog
        open={signOpen}
        onOpenChange={setSignOpen}
        docType={doc?.type || 'sonstiges'}
        parties={signParties}
        onComplete={handleSignComplete}
      />

      <SaveAsTemplateDialog
        open={saveTplOpen}
        onOpenChange={setSaveTplOpen}
        defaultName={defaultTplName}
        onSave={saveAsTemplate}
      />

      <DeleteDocumentDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        documentName={name}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
