'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Loader2, User, Home } from 'lucide-react'

export default function NewTenancy() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [user, authLoading])

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

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) { setStep(2); return }

    setLoading(true)
    try {
      const res = await fetch('/api/tenancies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const { tenancy, error } = await res.json()
      if (error) throw new Error(error)
      toast.success('Mietverhältnis angelegt')
      router.push(`/tenancy/${tenancy.id}`)
    } catch (err: any) {
      toast.error('Fehler: ' + (err.message || 'Unbekannter Fehler'))
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const steps = [
    { label: 'Mieter', icon: User },
    { label: 'Immobilie', icon: Home },
  ]

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" className="mb-6 -ml-2" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
        </Button>

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-0">
          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                    i + 1 < step ? 'bg-primary text-white' :
                    i + 1 === step ? 'bg-primary text-white ring-4 ring-primary/20' :
                    'bg-white text-slate-400 border-2 border-slate-200'
                  }`}>
                    {i + 1 < step ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`mt-1.5 text-xs font-medium ${i + 1 === step ? 'text-primary' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`mb-4 h-0.5 w-20 mx-3 transition-all ${i + 1 < step ? 'bg-primary' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Neues Mietverhältnis</CardTitle>
            <CardDescription>
              {step === 1
                ? 'Mieterdaten eingeben — diese werden für alle Dokumente verwendet'
                : 'Adresse der Immobilie'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="space-y-4">
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
                      Aktuelle Adresse des Mieters <span className="normal-case font-normal text-muted-foreground">(optional, für Mietvertrag)</span>
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
              )}

              {step === 2 && (
                <div className="space-y-4">
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
              )}

              <div className="mt-8 flex justify-between">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>Zurück</Button>
                ) : <div />}
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {step === 1 ? (<>Weiter <ArrowRight className="ml-2 h-4 w-4" /></>) : 'Mietverhältnis anlegen'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
