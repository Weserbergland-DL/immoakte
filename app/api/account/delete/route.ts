import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * DELETE /api/account/delete
 *
 * Self-service Konto-Löschung (Art. 17 DSGVO – Recht auf Vergessenwerden).
 *
 * Flow:
 *  1. Nutzer muss aktuell eingeloggt sein (Session-Cookie).
 *  2. Nutzer muss zur Bestätigung im Body { confirmEmail } die eigene E-Mail
 *     schicken — schützt vor versehentlicher Löschung.
 *  3. Wir löschen das Konto via Supabase Admin API.
 *     auth.admin.deleteUser() kaskadiert über FK (ON DELETE CASCADE) auf:
 *     users → tenancies, properties, protocols, documents, templates, feedback.
 *
 * Der aktuelle Service-Role-Key ist nur SERVER-SEITIG verfügbar.
 * Admin-Konten können sich NICHT selbst löschen (Sicherheitsnetz).
 */
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  const { confirmEmail } = await request.json().catch(() => ({}))
  if (!confirmEmail || typeof confirmEmail !== 'string') {
    return NextResponse.json(
      { error: 'Bitte E-Mail-Adresse zur Bestätigung angeben.' },
      { status: 400 },
    )
  }
  // Case-insensitive Vergleich, beide Seiten getrimmt.
  if (confirmEmail.trim().toLowerCase() !== (user.email || '').toLowerCase()) {
    return NextResponse.json(
      { error: 'E-Mail stimmt nicht mit Ihrem Konto überein.' },
      { status: 400 },
    )
  }

  // Admin-Selbstlöschung verhindern — Admins müssen per anderem Admin gelöscht werden.
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role === 'admin') {
    return NextResponse.json(
      { error: 'Admin-Konten können nicht per Self-Service gelöscht werden. Bitte Support kontaktieren.' },
      { status: 403 },
    )
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Session-Cookie räumen wir noch auf — verhindert, dass der Client noch
  // einen gültigen Token hat, auch wenn der User gelöscht ist.
  await supabase.auth.signOut()

  return NextResponse.json({ success: true })
}
