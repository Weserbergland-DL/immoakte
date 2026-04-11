import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Tief-kopiert ein Protokoll inkl. aller JSONB-Daten (rooms, meters, keys mit Fotos)
async function duplicateProtocol(original: any, userId: string, linkedId?: string) {
  const { data, error } = await supabaseAdmin
    .from('protocols')
    .insert({
      property_id: original.property_id,
      owner_id: userId,
      tenant_salutation: original.tenant_salutation,
      tenant_first_name: original.tenant_first_name,
      tenant_last_name: original.tenant_last_name,
      tenant_email: original.tenant_email,
      tenant_phone: original.tenant_phone,
      date: original.date,
      type: original.type,
      status: 'draft',
      linked_protocol_id: linkedId ?? null,
      rooms: original.rooms ?? [],
      meters: original.meters ?? [],
      keys: original.keys ?? [],
      general_condition: original.general_condition,
      tenant_new_address: original.tenant_new_address,
      witnesses: original.witnesses,
      // Unterschriften & finalized_at werden NICHT kopiert
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { einzugId, auszugId } = await request.json()
    if (!einzugId) return NextResponse.json({ error: 'einzugId fehlt' }, { status: 400 })

    // Original-Protokolle laden (nur eigene)
    const { data: einzug, error: e1 } = await supabaseAdmin
      .from('protocols')
      .select('*')
      .eq('id', einzugId)
      .eq('owner_id', user.id)
      .single()

    if (e1 || !einzug) return NextResponse.json({ error: 'Einzug nicht gefunden' }, { status: 404 })

    // Einzug duplizieren
    const newEinzug = await duplicateProtocol(einzug, user.id)

    // Auszug duplizieren falls vorhanden, mit neuer linked_protocol_id
    if (auszugId) {
      const { data: auszug } = await supabaseAdmin
        .from('protocols')
        .select('*')
        .eq('id', auszugId)
        .eq('owner_id', user.id)
        .single()

      if (auszug) {
        await duplicateProtocol(auszug, user.id, newEinzug.id)
      }
    }

    return NextResponse.json({ success: true, newEinzugId: newEinzug.id })
  } catch (error: any) {
    console.error('Duplicate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
