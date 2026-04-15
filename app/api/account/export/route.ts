import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * GET /api/account/export
 *
 * Datenexport (Art. 15 + Art. 20 DSGVO — Auskunft + Datenportabilität).
 *
 * Liefert sämtliche personenbezogenen Daten des angemeldeten Nutzers als
 * strukturiertes JSON zurück (maschinenlesbar, Art. 20 DSGVO verlangt ein
 * "strukturiertes, gängiges und maschinenlesbares Format").
 *
 * Enthält:
 *  - Auth-Daten: E-Mail, Erstellt, letzter Login, Metadaten (inkl. Consent-TS)
 *  - Profil (users-Tabelle)
 *  - Alle Mietverhältnisse, Properties, Protokolle, Dokumente, eigene Vorlagen,
 *    Beta-Feedback, immer gefiltert auf owner_id/user_id.
 *
 * Admin-Rolle wird NICHT mit exportiert (kein Grund, Betriebsgeheimnisse rauszugeben).
 */
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  // Nacheinander — parallele Queries sind möglich, aber die Dump-Größe bleibt
  // klein (ein einzelner Nutzer) und so ist die Fehlerursache bei Problemen
  // leichter zu lokalisieren.
  const [profile, tenancies, properties, protocols, documents, templates, feedback] = await Promise.all([
    supabaseAdmin.from('users').select('*').eq('id', user.id).maybeSingle(),
    supabaseAdmin.from('tenancies').select('*').eq('owner_id', user.id),
    supabaseAdmin.from('properties').select('*').eq('owner_id', user.id),
    supabaseAdmin.from('protocols').select('*').eq('owner_id', user.id),
    supabaseAdmin.from('documents').select('*').eq('owner_id', user.id),
    supabaseAdmin.from('document_templates').select('*').eq('owner_id', user.id),
    supabaseAdmin.from('beta_feedback').select('*').eq('user_id', user.id),
  ])

  // Admin-Rolle + interne Felder aus dem users-Record entfernen, bevor sie raus geht.
  const profileClean = profile.data ? Object.fromEntries(
    Object.entries(profile.data).filter(([k]) => !['role'].includes(k))
  ) : null

  const payload = {
    export: {
      generatedAt: new Date().toISOString(),
      format: 'immoakte-data-export-v1',
      legalBasis: ['Art. 15 DSGVO', 'Art. 20 DSGVO'],
      notice: 'Dieser Export enthält alle personenbezogenen Daten, die wir unter Ihrer Nutzer-ID verarbeiten. Die Datei dürfen Sie ohne Einschränkungen speichern, teilen oder in andere Systeme überführen.',
    },
    account: {
      id: user.id,
      email: user.email,
      emailVerifiedAt: user.email_confirmed_at,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
      authProvider: user.app_metadata?.provider ?? 'email',
      userMetadata: user.user_metadata ?? {},
    },
    profile: profileClean,
    tenancies: tenancies.data ?? [],
    properties: properties.data ?? [],
    protocols: protocols.data ?? [],
    documents: documents.data ?? [],
    documentTemplates: templates.data ?? [],
    feedback: feedback.data ?? [],
  }

  const filename = `immoakte-datenexport-${new Date().toISOString().slice(0, 10)}.json`
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
