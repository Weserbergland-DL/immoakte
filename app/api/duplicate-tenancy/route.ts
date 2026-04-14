import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Tief-kopiert ein Protokoll inkl. aller JSONB-Daten (rooms, meters, keys mit Fotos)
async function duplicateProtocol(original: any, userId: string, newTenancyId: string, linkedId?: string) {
  const { data, error } = await supabaseAdmin
    .from('protocols')
    .insert({
      tenancy_id: newTenancyId,
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

    const { tenancyId, einzugId, auszugId } = await request.json()
    if (!tenancyId) return NextResponse.json({ error: 'tenancyId fehlt' }, { status: 400 })

    // Original-Mietverhältnis laden (nur eigene)
    const { data: originalTenancy, error: tErr } = await supabaseAdmin
      .from('tenancies')
      .select('*')
      .eq('id', tenancyId)
      .eq('owner_id', user.id)
      .single()

    if (tErr || !originalTenancy) return NextResponse.json({ error: 'Mietverhältnis nicht gefunden' }, { status: 404 })

    // Neues Mietverhältnis anlegen (gleiche Immobilie, gleiche Mieterdaten als Vorlage)
    const { data: newTenancy, error: newTErr } = await supabaseAdmin
      .from('tenancies')
      .insert({
        owner_id: user.id,
        property_id: originalTenancy.property_id,
        tenant_salutation: originalTenancy.tenant_salutation,
        tenant_first_name: originalTenancy.tenant_first_name,
        tenant_last_name: originalTenancy.tenant_last_name,
        tenant_email: originalTenancy.tenant_email,
        tenant_phone: originalTenancy.tenant_phone,
        tenant_street: originalTenancy.tenant_street,
        tenant_house_number: originalTenancy.tenant_house_number,
        tenant_zip_code: originalTenancy.tenant_zip_code,
        tenant_city: originalTenancy.tenant_city,
      })
      .select()
      .single()

    if (newTErr || !newTenancy) throw new Error(newTErr?.message || 'Mietverhältnis konnte nicht erstellt werden')

    // Protokolle duplizieren, falls vorhanden
    if (einzugId) {
      const { data: einzug } = await supabaseAdmin
        .from('protocols')
        .select('*')
        .eq('id', einzugId)
        .eq('owner_id', user.id)
        .single()

      if (einzug) {
        const newEinzug = await duplicateProtocol(einzug, user.id, newTenancy.id)

        if (auszugId) {
          const { data: auszug } = await supabaseAdmin
            .from('protocols')
            .select('*')
            .eq('id', auszugId)
            .eq('owner_id', user.id)
            .single()

          if (auszug) {
            await duplicateProtocol(auszug, user.id, newTenancy.id, newEinzug.id)
          }
        }
      }
    }

    return NextResponse.json({ success: true, newTenancyId: newTenancy.id })
  } catch (error: any) {
    console.error('Duplicate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
