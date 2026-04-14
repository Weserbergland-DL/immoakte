'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, FileText, LogOut, Settings, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { TenancyCard } from '@/components/dashboard/TenancyCard'

interface Protocol {
  id: string
  tenant_first_name?: string
  tenant_last_name?: string
  tenant_salutation?: string
  tenant_email?: string
  date: string | null
  type: string
  status: string
  property_id: string
  propertyAddress?: string
  linked_protocol_id?: string | null
  finalized_at?: string | null
  rooms?: any[]
  meters?: any[]
  keys?: any[]
}

interface TenancyGroup {
  id: string
  tenancyId?: string
  tenantName: string
  propertyAddress?: string
  propertyId?: string
  tenantSalutation?: string
  tenantFirstName?: string
  tenantLastName?: string
  tenantEmail?: string
  tenantPhone?: string
  einzug?: Protocol
  auszug?: Protocol
}

export default function Dashboard() {
  const { user, isAdmin, logout } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [tenancies, setTenancies] = useState<TenancyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [userCompany, setUserCompany] = useState('')
  const [userStreet, setUserStreet] = useState('')
  const [userHouseNumber, setUserHouseNumber] = useState('')
  const [userZipCode, setUserZipCode] = useState('')
  const [userCity, setUserCity] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [userEmailContact, setUserEmailContact] = useState('')
  const [userIban, setUserIban] = useState('')
  const [userBankName, setUserBankName] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [protocolToDelete, setProtocolToDelete] = useState<string | null>(null)
  const [unresolvedFeedbackCount, setUnresolvedFeedbackCount] = useState(0)

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    fetchData()
  }, [user, isAdmin])

  const fetchData = async () => {
    const { data: profile } = await supabase
      .from('users').select('name, company, street, house_number, zip_code, city, phone, email_contact, iban, bank_name').eq('id', user!.id).single()
    if (profile) {
      setUserName(profile.name || '')
      setUserCompany(profile.company || '')
      setUserStreet(profile.street || '')
      setUserHouseNumber(profile.house_number || '')
      setUserZipCode(profile.zip_code || '')
      setUserCity(profile.city || '')
      setUserPhone(profile.phone || '')
      setUserEmailContact(profile.email_contact || '')
      setUserIban(profile.iban || '')
      setUserBankName(profile.bank_name || '')
    }

    if (isAdmin) {
      const { count } = await supabase
        .from('feedback').select('*', { count: 'exact', head: true }).eq('status', 'new')
      setUnresolvedFeedbackCount(count || 0)
    }

    // Fetch tenancies (primary source of truth) and protocols in parallel
    const [tenanciesRes, protocolsRes] = await Promise.all([
      fetch('/api/tenancies').then(r => r.json()),
      supabase.from('protocols').select('*').eq('owner_id', user!.id).order('created_at', { ascending: false }),
    ])

    const fetchedTenancies = tenanciesRes.tenancies || []
    const fetchedProtocols = protocolsRes.data || []

    const groups: TenancyGroup[] = fetchedTenancies.map((t: any) => {
      const prop = t.properties
      const address = prop?.address || `${prop?.street || ''} ${prop?.house_number || ''}, ${prop?.zip_code || ''} ${prop?.city || ''}`.trim()

      const tProtos = fetchedProtocols.filter((p: any) => p.tenancy_id === t.id)
      const einzug = tProtos.find((p: any) => p.type === 'Einzug')
      const auszug = tProtos.find((p: any) => p.type === 'Auszug')

      return {
        id: t.id,
        tenancyId: t.id,
        tenantName: `${t.tenant_first_name || ''} ${t.tenant_last_name || ''}`.trim() || 'Unbekannter Mieter',
        propertyAddress: address || 'Unbekannte Adresse',
        propertyId: prop?.id,
        tenantSalutation: t.tenant_salutation,
        tenantFirstName: t.tenant_first_name,
        tenantLastName: t.tenant_last_name,
        tenantEmail: t.tenant_email,
        tenantPhone: t.tenant_phone,
        einzug: einzug ? { ...einzug, propertyAddress: address } : undefined,
        auszug: auszug ? { ...auszug, propertyAddress: address } : undefined,
      }
    })

    setTenancies(groups)
    setLoading(false)
  }

  const saveSettings = async () => {
    const { error } = await supabase.from('users').update({
      name: userName,
      company: userCompany,
      street: userStreet,
      house_number: userHouseNumber,
      zip_code: userZipCode,
      city: userCity,
      phone: userPhone,
      email_contact: userEmailContact,
      iban: userIban,
      bank_name: userBankName,
    }).eq('id', user!.id)
    if (error) toast.error('Fehler beim Speichern')
    else { toast.success('Stammdaten gespeichert'); setIsSettingsOpen(false) }
  }

  const confirmDelete = (protocolId: string) => {
    setProtocolToDelete(protocolId)
    setIsDeleteDialogOpen(true)
  }

  const executeDelete = async () => {
    if (!protocolToDelete) return
    const { error } = await supabase.from('protocols').delete().eq('id', protocolToDelete)
    if (error) { toast.error('Fehler beim Löschen'); return }
    toast.success('Protokoll gelöscht')
    setTenancies(prev =>
      prev.map(g => {
        const ng = { ...g }
        if (ng.einzug?.id === protocolToDelete) ng.einzug = undefined
        if (ng.auszug?.id === protocolToDelete) ng.auszug = undefined
        return ng
      })
    )
    setIsDeleteDialogOpen(false)
    setProtocolToDelete(null)
  }

  const duplicateTenancy = async (group: TenancyGroup) => {
    toast.loading('Mietverhältnis wird dupliziert...', { id: 'dup' })
    try {
      const res = await fetch('/api/duplicate-tenancy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenancyId: group.tenancyId || group.id, einzugId: group.einzug?.id, auszugId: group.auszug?.id }),
      })
      if (!res.ok) throw new Error()
      toast.success('Mietverhältnis dupliziert', { id: 'dup' })
      window.location.reload()
    } catch {
      toast.error('Fehler beim Duplizieren', { id: 'dup' })
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-base font-bold">Protokoll-Pro</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => router.push('/pricing')} className="hidden sm:inline-flex text-sm font-medium text-slate-600">
              Preise
            </Button>
            {isAdmin && (
              <div className="relative">
                <Button variant="ghost" size="icon" title="Admin" onClick={() => router.push('/admin')}>
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </Button>
                {unresolvedFeedbackCount > 0 && (
                  <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unresolvedFeedbackCount}
                  </span>
                )}
              </div>
            )}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger render={<Button variant="ghost" size="icon" title="Stammdaten" />}>
                <Settings className="h-5 w-5" />
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Stammdaten</DialogTitle></DialogHeader>
                <div className="space-y-5 py-4">
                  {/* Person / Firma */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Person &amp; Firma</p>
                    <div className="space-y-2">
                      <Label>Ihr Name (Vermieter/Verwalter)</Label>
                      <Input value={userName} onChange={e => setUserName(e.target.value)} placeholder="Max Mustermann" />
                    </div>
                    <div className="space-y-2">
                      <Label>Firma <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input value={userCompany} onChange={e => setUserCompany(e.target.value)} placeholder="Immobilien GmbH" />
                    </div>
                  </div>

                  {/* Adresse */}
                  <div className="space-y-3 border-t pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ihre Adresse</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-2">
                        <Label>Straße</Label>
                        <Input value={userStreet} onChange={e => setUserStreet(e.target.value)} placeholder="Musterstraße" />
                      </div>
                      <div className="space-y-2">
                        <Label>Hausnr.</Label>
                        <Input value={userHouseNumber} onChange={e => setUserHouseNumber(e.target.value)} placeholder="1a" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label>PLZ</Label>
                        <Input value={userZipCode} onChange={e => setUserZipCode(e.target.value)} placeholder="12345" />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Ort</Label>
                        <Input value={userCity} onChange={e => setUserCity(e.target.value)} placeholder="Musterstadt" />
                      </div>
                    </div>
                  </div>

                  {/* Kontakt */}
                  <div className="space-y-3 border-t pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kontakt</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Telefon</Label>
                        <Input value={userPhone} onChange={e => setUserPhone(e.target.value)} placeholder="+49 123 456789" />
                      </div>
                      <div className="space-y-2">
                        <Label>E-Mail</Label>
                        <Input type="email" value={userEmailContact} onChange={e => setUserEmailContact(e.target.value)} placeholder="max@beispiel.de" />
                      </div>
                    </div>
                  </div>

                  {/* Bankverbindung */}
                  <div className="space-y-3 border-t pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bankverbindung</p>
                    <div className="space-y-2">
                      <Label>IBAN</Label>
                      <Input value={userIban} onChange={e => setUserIban(e.target.value)} placeholder="DE12 3456 7890 1234 5678 90" />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input value={userBankName} onChange={e => setUserBankName(e.target.value)} placeholder="Musterbank" />
                    </div>
                  </div>

                  <Button onClick={saveSettings} className="w-full">Speichern</Button>
                </div>
              </DialogContent>
            </Dialog>
            <span className="text-sm text-muted-foreground hidden sm:inline-block max-w-[120px] truncate">
              {userName || user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={logout} title="Abmelden">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-5xl px-4 w-full">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Meine Protokolle</h2>
          <Button onClick={() => router.push('/tenancy/new')}>
            <Plus className="mr-2 h-4 w-4" /> Neues Mietverhältnis
          </Button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">Lade Protokolle...</div>
        ) : tenancies.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">Keine Protokolle vorhanden</h3>
              <p className="mb-4 text-sm text-muted-foreground max-w-sm">
                Erstellen Sie Ihr erstes Übergabeprotokoll — kostenlos und in Minuten erledigt.
              </p>
              <Button onClick={() => router.push('/tenancy/new')}>
                <Plus className="mr-2 h-4 w-4" /> Erstes Mietverhältnis erstellen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {tenancies.map(group => (
              <TenancyCard
                key={group.id}
                group={group}
                userId={user.id}
                onDelete={confirmDelete}
                onDuplicate={duplicateTenancy}
                onOpenTenancy={(g) => {
                  // Navigate to tenancy hub — use tenancyId if available, else einzug id
                  const tenancyId = g.tenancyId || g.einzug?.id
                  if (tenancyId) router.push(`/tenancy/${tenancyId}`)
                }}
                onAuszugCreated={(auszug) => {
                  setTenancies(prev => prev.map(g =>
                    g.id === group.id ? { ...g, auszug } : g
                  ))
                }}
              />
            ))}
          </div>
        )}
      </main>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Protokoll löschen</DialogTitle>
            <DialogDescription>
              Möchten Sie dieses Protokoll wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Abbrechen</Button>
            <Button variant="destructive" onClick={executeDelete}>Löschen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
