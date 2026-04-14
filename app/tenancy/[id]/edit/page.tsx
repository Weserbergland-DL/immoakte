'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function EditTenancy() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const [form, setForm] = useState({
    tenant_salutation: 'Herr',
    tenant_first_name: '',
    tenant_last_name: '',
    tenant_email: '',
    tenant_phone: '',
    tenant_street: '',
    tenant_house_number: '',
    tenant_zip_code: '',
    tenant_city: '',
    street: '',
    house_number: '',
    zip_code: '',
    city: '',
  })

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    fetch(`/api/tenancies/${id}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(({ tenancy, error }) => {
        if (error || !tenancy) { toast.error('Nicht gefunden'); router.push('/dashboard'); return }
        const prop = tenancy.properties
        setForm({
          tenant_salutation: tenancy.tenant_salutation || 'Herr',
          tenant_first_name: tenancy.tenant_first_name || '',
          tenant_last_name: tenancy.tenant_last_name || '',
          tenant_email: tenancy.tenant_email || '',
          tenant_phone: tenancy.tenant_phone || '',
          tenant_street: tenancy.tenant_street || '',
          tenant_house_number: tenancy.tenant_house_number || '',
          tenant_zip_code: tenancy.tenant_zip_code || '',
          tenant_city: tenancy.tenant_city || '',
          street: prop?.street || '',
          house_number: prop?.house_number || '',
          zip_code: prop?.zip_code || '',
          city: prop?.city || '',
        })
        setInitialLoading(false)
      })
      .catch(() => {
        toast.error('Daten konnten nicht geladen werden')
        router.push('/dashboard')
      })
  }, [id, user])

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/tenancies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const { error } = await res.json()
      if (error) throw new Error(error)
      toast.success('Änderungen gespeichert')
      router.push(`/tenancy/${id}`)
    } catch (err: any) {
      toast.error('Fehler: ' + (err.message || 'Unbekannter Fehler'))
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-muted-foreground">Lade Daten...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" className="mb-6 -ml-2" onClick={() => router.push(`/tenancy/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
        </Button>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Mietverhältnis bearbeiten</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tenant section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Mieter</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Anrede</Label>
                    <Select value={form.tenant_salutation} onValueChange={v => { if (v) set('tenant_salutation', v) }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Herr">Herr</SelectItem>
                        <SelectItem value="Frau">Frau</SelectItem>
                        <SelectItem value="Divers">Divers</SelectItem>
                        <SelectItem value="Firma">Firma</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Vorname</Label>
                    <Input required placeholder="Max" value={form.tenant_first_name}
                      onChange={e => set('tenant_first_name', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nachname</Label>
                    <Input required placeholder="Mustermann" value={form.tenant_last_name}
                      onChange={e => set('tenant_last_name', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>E-Mail <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input type="email" placeholder="max@beispiel.de" value={form.tenant_email}
                      onChange={e => set('tenant_email', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefon <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input type="tel" placeholder="+49 123 456789" value={form.tenant_phone}
                      onChange={e => set('tenant_phone', e.target.value)} />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Aktuelle Adresse des Mieters <span className="normal-case font-normal">(optional, für Mietvertrag)</span>
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Straße</Label>
                      <Input placeholder="Hauptstraße" value={form.tenant_street}
                        onChange={e => set('tenant_street', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Hausnr.</Label>
                      <Input placeholder="5b" value={form.tenant_house_number}
                        onChange={e => set('tenant_house_number', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label>PLZ</Label>
                      <Input placeholder="12345" value={form.tenant_zip_code}
                        onChange={e => set('tenant_zip_code', e.target.value)} />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Ort</Label>
                      <Input placeholder="Musterstadt" value={form.tenant_city}
                        onChange={e => set('tenant_city', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Property section */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pt-2">Immobilie</h3>
                <AddressAutocomplete
                  onAddressSelect={(addr) => setForm(f => ({
                    ...f,
                    street: addr.street,
                    house_number: addr.houseNumber,
                    zip_code: addr.zipCode,
                    city: addr.city,
                  }))}
                />
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Straße</Label>
                    <Input required placeholder="Musterstraße" value={form.street}
                      onChange={e => set('street', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hausnr.</Label>
                    <Input required placeholder="1a" value={form.house_number}
                      onChange={e => set('house_number', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>PLZ</Label>
                    <Input required placeholder="12345" value={form.zip_code}
                      onChange={e => set('zip_code', e.target.value)} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Ort</Label>
                    <Input required placeholder="Musterstadt" value={form.city}
                      onChange={e => set('city', e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => router.push(`/tenancy/${id}`)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Speichern
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
