'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { AddressAutocomplete } from '@/components/AddressAutocomplete'

export default function NewProtocol() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    tenantSalutation: 'Herr',
    tenantFirstName: '',
    tenantLastName: '',
    tenantEmail: '',
    tenantPhone: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Einzug',
    street: '',
    houseNumber: '',
    zipCode: '',
    city: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (value: string | null, name: string) => {
    if (value !== null) setFormData({ ...formData, [name]: value })
  }

  const nextStep = () => setStep(step + 1)
  const prevStep = () => setStep(step - 1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const fullAddress = `${formData.street} ${formData.houseNumber}, ${formData.zipCode} ${formData.city}`.trim()

      // 1. Create property
      const { data: property, error: propError } = await supabase
        .from('properties')
        .insert({
          owner_id: user.id,
          address: fullAddress,
          street: formData.street,
          house_number: formData.houseNumber,
          zip_code: formData.zipCode,
          city: formData.city,
        })
        .select()
        .single()

      if (propError) throw propError

      // 2. Create protocol
      const { data: protocol, error: protoError } = await supabase
        .from('protocols')
        .insert({
          property_id: property.id,
          owner_id: user.id,
          tenant_salutation: formData.tenantSalutation,
          tenant_first_name: formData.tenantFirstName,
          tenant_last_name: formData.tenantLastName,
          tenant_email: formData.tenantEmail,
          tenant_phone: formData.tenantPhone,
          date: formData.date,
          type: formData.type,
          status: 'draft',
          rooms: [],
          meters: [
            { id: crypto.randomUUID(), type: 'Strom', number: '', reading: '', photoUrl: '' },
            { id: crypto.randomUUID(), type: 'Wasser', number: '', reading: '', photoUrl: '' },
          ],
          keys: [],
        })
        .select()
        .single()

      if (protoError) throw protoError

      toast.success('Protokoll erfolgreich angelegt')
      router.push(`/protocol/${protocol.id}`)
    } catch (error) {
      console.error(error)
      toast.error('Fehler beim Erstellen des Protokolls')
    } finally {
      setLoading(false)
    }
  }

  if (!user) { router.replace('/login'); return null }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" className="mb-6" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zum Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Neues Übergabeprotokoll</CardTitle>
            <CardDescription>
              Schritt {step} von 2: Stammdaten erfassen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); nextStep() }}>
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Art der Übergabe</Label>
                    <Select value={formData.type} onValueChange={(v) => handleSelectChange(v, 'type')}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Bitte wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Einzug">Einzug</SelectItem>
                        <SelectItem value="Auszug">Auszug</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Datum der Übergabe</Label>
                    <Input id="date" name="date" type="date" required value={formData.date} onChange={handleChange} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tenantSalutation">Anrede</Label>
                      <Select value={formData.tenantSalutation} onValueChange={(v) => handleSelectChange(v, 'tenantSalutation')}>
                        <SelectTrigger id="tenantSalutation">
                          <SelectValue placeholder="Anrede" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Herr">Herr</SelectItem>
                          <SelectItem value="Frau">Frau</SelectItem>
                          <SelectItem value="Divers">Divers</SelectItem>
                          <SelectItem value="Firma">Firma</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tenantFirstName">Vorname</Label>
                      <Input id="tenantFirstName" name="tenantFirstName" placeholder="Max" required value={formData.tenantFirstName} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tenantLastName">Nachname</Label>
                      <Input id="tenantLastName" name="tenantLastName" placeholder="Mustermann" required value={formData.tenantLastName} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tenantEmail">E-Mail (optional)</Label>
                      <Input id="tenantEmail" name="tenantEmail" type="email" placeholder="max@beispiel.de" value={formData.tenantEmail} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tenantPhone">Telefon (optional)</Label>
                      <Input id="tenantPhone" name="tenantPhone" type="tel" placeholder="+49 123 456789" value={formData.tenantPhone} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Adresse der Immobilie</Label>
                    <AddressAutocomplete
                      onAddressSelect={(address) => {
                        setFormData(prev => ({
                          ...prev,
                          street: address.street,
                          houseNumber: address.houseNumber,
                          zipCode: address.zipCode,
                          city: address.city,
                        }))
                      }}
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="street">Straße</Label>
                        <Input id="street" name="street" placeholder="Musterstraße" required value={formData.street} onChange={handleChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="houseNumber">Hausnr.</Label>
                        <Input id="houseNumber" name="houseNumber" placeholder="1a" required value={formData.houseNumber} onChange={handleChange} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">PLZ</Label>
                        <Input id="zipCode" name="zipCode" placeholder="12345" required value={formData.zipCode} onChange={handleChange} />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="city">Ort</Label>
                        <Input id="city" name="city" placeholder="Musterstadt" required value={formData.city} onChange={handleChange} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-between">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep}>Zurück</Button>
                ) : (
                  <div></div>
                )}
                {step < 2 ? (
                  <Button type="submit">
                    Weiter
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Protokoll anlegen
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
