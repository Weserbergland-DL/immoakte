import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  // Fetch tenancy with property, protocols and documents
  const [tenancyRes, protocolsRes, documentsRes] = await Promise.all([
    supabaseAdmin.from('tenancies').select('*, properties(*)').eq('id', id).eq('owner_id', user.id).single(),
    supabaseAdmin.from('protocols').select('*').eq('tenancy_id', id).order('created_at', { ascending: true }),
    supabaseAdmin.from('documents').select('*').eq('tenancy_id', id).order('created_at', { ascending: true }),
  ])

  if (tenancyRes.error || !tenancyRes.data)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    tenancy: tenancyRes.data,
    protocols: protocolsRes.data || [],
    documents: documentsRes.data || [],
  })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const { data: existing } = await supabaseAdmin
    .from('tenancies').select('owner_id').eq('id', id).single()
  if (!existing || existing.owner_id !== user.id)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updates = await request.json()
  const { error } = await supabaseAdmin.from('tenancies').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
