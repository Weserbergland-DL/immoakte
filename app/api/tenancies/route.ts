import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('tenancies')
    .select('*, properties(*)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tenancies: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    tenant_salutation, tenant_first_name, tenant_last_name,
    tenant_email, tenant_phone,
    tenant_street, tenant_house_number, tenant_zip_code, tenant_city,
    street, house_number, zip_code, city,
  } = body

  // Create property first
  const fullAddress = `${street} ${house_number}, ${zip_code} ${city}`.trim()
  const { data: property, error: propError } = await supabaseAdmin
    .from('properties')
    .insert({ owner_id: user.id, address: fullAddress, street, house_number, zip_code, city })
    .select().single()

  if (propError) return NextResponse.json({ error: propError.message }, { status: 500 })

  // Create tenancy
  const { data: tenancy, error: tenError } = await supabaseAdmin
    .from('tenancies')
    .insert({
      owner_id: user.id,
      property_id: property.id,
      tenant_salutation,
      tenant_first_name,
      tenant_last_name,
      tenant_email: tenant_email || null,
      tenant_phone: tenant_phone || null,
      tenant_street: tenant_street || null,
      tenant_house_number: tenant_house_number || null,
      tenant_zip_code: tenant_zip_code || null,
      tenant_city: tenant_city || null,
    })
    .select().single()

  if (tenError) return NextResponse.json({ error: tenError.message }, { status: 500 })
  return NextResponse.json({ tenancy, property })
}
