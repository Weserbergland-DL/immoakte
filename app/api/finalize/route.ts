import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

    const { protocolId } = await request.json()
    if (!protocolId) return NextResponse.json({ error: 'protocolId fehlt' }, { status: 400 })

    // Atomic check + update via DB function (prevents race condition when
    // two simultaneous requests try to finalize the free protocol at once)
    const { data, error } = await supabaseAdmin.rpc('finalize_protocol', {
      p_protocol_id: protocolId,
      p_owner_id:    user.id,
    })

    if (error) throw error

    if (data?.error === 'payment_required') {
      return NextResponse.json({ error: 'payment_required' }, { status: 402 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Finalize error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
