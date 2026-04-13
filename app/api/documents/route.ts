import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { DEFAULT_TEMPLATES, fillPlaceholders } from '@/lib/document-templates'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tenancyId = searchParams.get('tenancy_id')
  const protocolId = searchParams.get('protocol_id')
  const propertyId = searchParams.get('property_id')

  let query = supabaseAdmin
    .from('documents')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (tenancyId) query = query.eq('tenancy_id', tenancyId)
  else if (protocolId) query = query.eq('protocol_id', protocolId)
  else if (propertyId) query = query.eq('property_id', propertyId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ documents: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { type, tenancy_id, protocol_id, property_id, name } = body

  // Get user profile for placeholders
  const { data: profile } = await supabaseAdmin
    .from('users').select('name, company').eq('id', user.id).single()

  // Get tenancy/protocol data for placeholder filling
  let tenancyData: any = null
  let propertyData: any = null

  if (tenancy_id) {
    const { data: ten } = await supabaseAdmin
      .from('tenancies').select('*, properties(*)').eq('id', tenancy_id).single()
    tenancyData = ten
    propertyData = ten?.properties
  } else if (protocol_id) {
    const { data: proto } = await supabaseAdmin
      .from('protocols').select('*').eq('id', protocol_id).single()
    tenancyData = proto // treat protocol as tenancy-like for backward compat
    if (proto?.property_id) {
      const { data: prop } = await supabaseAdmin
        .from('properties').select('*').eq('id', proto.property_id).single()
      propertyData = prop
    }
  } else if (property_id) {
    const { data: prop } = await supabaseAdmin
      .from('properties').select('*').eq('id', property_id).single()
    propertyData = prop
  }

  // Build placeholder values
  const address = propertyData
    ? (propertyData.address || `${propertyData.street || ''} ${propertyData.house_number || ''}, ${propertyData.zip_code || ''} ${propertyData.city || ''}`.trim())
    : ''

  const placeholders: Record<string, string> = {
    '{{vermieter_name}}': profile?.name || '',
    '{{vermieter_firma}}': profile?.company || '',
    '{{mieter_anrede}}': tenancyData?.tenant_salutation || '',
    '{{mieter_vorname}}': tenancyData?.tenant_first_name || '',
    '{{mieter_nachname}}': tenancyData?.tenant_last_name || '',
    '{{mieter_name}}': `${tenancyData?.tenant_first_name || ''} ${tenancyData?.tenant_last_name || ''}`.trim(),
    '{{adresse}}': address,
    '{{strasse}}': propertyData ? `${propertyData.street || ''} ${propertyData.house_number || ''}`.trim() : '',
    '{{plz_ort}}': propertyData ? `${propertyData.zip_code || ''} ${propertyData.city || ''}`.trim() : '',
    '{{einzugsdatum}}': tenancyData?.start_date ? format(new Date(tenancyData.start_date), 'dd.MM.yyyy', { locale: de }) : (tenancyData?.date ? format(new Date(tenancyData.date), 'dd.MM.yyyy', { locale: de }) : ''),
    '{{datum_heute}}': format(new Date(), 'dd.MM.yyyy', { locale: de }),
    '{{mietbeginn}}': tenancyData?.start_date ? format(new Date(tenancyData.start_date), 'dd.MM.yyyy', { locale: de }) : '',
    '{{kaltmiete}}': '',
    '{{kaution}}': '',
  }

  // Get template content
  const templateKey = type as keyof typeof DEFAULT_TEMPLATES
  const templateDef = DEFAULT_TEMPLATES[templateKey]
  const rawContent = templateDef?.content || ''
  const filledContent = fillPlaceholders(rawContent, placeholders)

  const docName = name || templateDef?.name || 'Neues Dokument'

  const { data, error } = await supabaseAdmin.from('documents').insert({
    owner_id: user.id,
    tenancy_id: tenancy_id || null,
    protocol_id: protocol_id || null,
    property_id: property_id || propertyData?.id || null,
    name: docName,
    type,
    content: filledContent,
    status: 'draft',
    tenant_salutation: tenancyData?.tenant_salutation || null,
    tenant_first_name: tenancyData?.tenant_first_name || null,
    tenant_last_name: tenancyData?.tenant_last_name || null,
    tenant_email: tenancyData?.tenant_email || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ document: data })
}
