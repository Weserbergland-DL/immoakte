'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ArrowLeft, Camera, CheckCircle, FileText, Plus, Trash2 } from 'lucide-react'
import { SignaturePad } from '@/components/SignaturePad'
import { PrintableProtocol } from '@/components/PrintableProtocol'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const safeFormatDate = (dateStr: any) => {
  if (!dateStr) return 'Kein Datum'
  try {
    return format(new Date(dateStr), 'dd.MM.yyyy', { locale: de })
  } catch {
    return 'Ungültiges Datum'
  }
}

export default function ProtocolView() {
  const params = useParams()
  const id = params.id as string
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [protocol, setProtocol] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('rooms')
  const [userName, setUserName] = useState('')
  const [userCompany, setUserCompany] = useState('')
  const [propertyAddress, setPropertyAddress] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  useEffect(() => {
    if (!id || !user) return

    const fetchData = async () => {
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('name, company')
          .eq('id', user.id)
          .single()
        if (profile) {
          setUserName(profile.name || '')
          setUserCompany(profile.company || '')
        }

        const { data: proto, error } = await supabase
          .from('protocols')
          .select('*')
          .eq('id', id)
          .eq('owner_id', user.id)
          .single()

        if (error || !proto) {
          toast.error('Protokoll nicht gefunden oder keine Berechtigung')
          router.push('/dashboard')
          return
        }

        setProtocol(proto)

        if (proto.property_id) {
          const { data: prop } = await supabase
            .from('properties')
            .select('address')
            .eq('id', proto.property_id)
            .single()
          if (prop) setPropertyAddress(prop.address || '')
        }
      } catch {
        toast.error('Fehler beim Laden des Protokolls')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, user])

  const saveProtocol = async (updatedData: any) => {
    if (!id) return
    try {
      const { error } = await supabase
        .from('protocols')
        .update({ ...updatedData, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      setProtocol((prev: any) => ({ ...prev, ...updatedData }))
    } catch {
      toast.error('Fehler beim Speichern')
    }
  }

  const handlePhotoUpload = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX = 800
          let width = img.width
          let height = img.height
          if (width > height) {
            if (width > MAX) { height *= MAX / width; width = MAX }
          } else {
            if (height > MAX) { width *= MAX / height; height = MAX }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) { reject(new Error('Canvas context not available')); return }
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.6))
        }
        img.onerror = () => reject(new Error('Fehler beim Laden des Bildes'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'))
      reader.readAsDataURL(file)
    })
  }

  const handleMeterPhotoUpload = async (file: File, meterId: string) => {
    try {
      toast.loading('Lade Foto hoch...', { id: `upload-${meterId}` })
      const url = await handlePhotoUpload(file)
      updateMeter(meterId, 'photoUrl', url)
      toast.success('Foto hochgeladen', { id: `upload-${meterId}` })

      toast.loading('Analysiere Bild auf Zählerstand...', { id: `ocr-${meterId}` })
      const Tesseract = await import('tesseract.js')
      const result = await Tesseract.recognize(file, 'deu', { logger: m => console.log(m) })
      const numberMatch = result.data.text.match(/\b\d{4,7}(?:[.,]\d{1,2})?\b/)
      if (numberMatch) {
        updateMeterLocal(meterId, 'reading', numberMatch[0])
        updateMeter(meterId, 'reading', numberMatch[0])
        toast.success(`Zählerstand erkannt: ${numberMatch[0]}`, { id: `ocr-${meterId}` })
      } else {
        toast.info('Konnte keinen eindeutigen Zählerstand erkennen. Bitte manuell eintragen.', { id: `ocr-${meterId}` })
      }
    } catch (error) {
      console.error('Error uploading meter photo or running OCR:', error)
      toast.error('Fehler beim Hochladen oder Analysieren des Fotos', { id: `upload-${meterId}` })
    }
  }

  // Room functions
  const addRoom = (name: string = 'Neuer Raum') => {
    const newRoom = { id: crypto.randomUUID(), name, condition: 'Alles okay', defects: [] }
    saveProtocol({ rooms: [...(protocol.rooms || []), newRoom] })
  }
  const updateRoom = (roomId: string, field: string, value: any) => {
    const updatedRooms = protocol.rooms.map((r: any) => r.id === roomId ? { ...r, [field]: value } : r)
    saveProtocol({ rooms: updatedRooms })
  }
  const updateRoomLocal = (roomId: string, field: string, value: any) => {
    setProtocol((prev: any) => ({ ...prev, rooms: prev.rooms.map((r: any) => r.id === roomId ? { ...r, [field]: value } : r) }))
  }
  const deleteRoom = (roomId: string) => {
    saveProtocol({ rooms: protocol.rooms.filter((r: any) => r.id !== roomId) })
  }

  // Defect functions
  const addDefect = (roomId: string) => {
    const newDefect = { id: crypto.randomUUID(), description: '', photoUrls: [] }
    const updatedRooms = protocol.rooms.map((r: any) => r.id === roomId ? { ...r, defects: [...(r.defects || []), newDefect] } : r)
    saveProtocol({ rooms: updatedRooms })
  }
  const updateDefectLocal = (roomId: string, defectId: string, field: string, value: any) => {
    setProtocol((prev: any) => ({
      ...prev, rooms: prev.rooms.map((r: any) => r.id === roomId ? { ...r, defects: r.defects.map((d: any) => d.id === defectId ? { ...d, [field]: value } : d) } : r)
    }))
  }
  const updateDefect = (roomId: string, defectId: string, field: string, value: any) => {
    const updatedRooms = protocol.rooms.map((r: any) => r.id === roomId ? { ...r, defects: r.defects.map((d: any) => d.id === defectId ? { ...d, [field]: value } : d) } : r)
    saveProtocol({ rooms: updatedRooms })
  }
  const deleteDefect = (roomId: string, defectId: string) => {
    const updatedRooms = protocol.rooms.map((r: any) => r.id === roomId ? { ...r, defects: r.defects.filter((d: any) => d.id !== defectId) } : r)
    saveProtocol({ rooms: updatedRooms })
  }
  const addDefectPhoto = (roomId: string, defectId: string, photoUrl: string) => {
    const updatedRooms = protocol.rooms.map((r: any) => r.id === roomId ? { ...r, defects: r.defects.map((d: any) => d.id === defectId ? { ...d, photoUrls: [...(d.photoUrls || []), photoUrl] } : d) } : r)
    saveProtocol({ rooms: updatedRooms })
  }
  const deleteDefectPhoto = (roomId: string, defectId: string, photoIndex: number) => {
    const updatedRooms = protocol.rooms.map((r: any) => r.id === roomId ? { ...r, defects: r.defects.map((d: any) => d.id === defectId ? { ...d, photoUrls: d.photoUrls.filter((_: any, i: number) => i !== photoIndex) } : d) } : r)
    saveProtocol({ rooms: updatedRooms })
  }

  // Meter functions
  const addMeter = () => {
    const newMeter = { id: crypto.randomUUID(), type: 'Strom', number: '', reading: '', photoUrl: '' }
    saveProtocol({ meters: [...(protocol.meters || []), newMeter] })
  }
  const updateMeter = (meterId: string, field: string, value: any) => {
    const updatedMeters = protocol.meters.map((m: any) => m.id === meterId ? { ...m, [field]: value } : m)
    saveProtocol({ meters: updatedMeters })
  }
  const updateMeterLocal = (meterId: string, field: string, value: any) => {
    setProtocol((prev: any) => ({ ...prev, meters: prev.meters.map((m: any) => m.id === meterId ? { ...m, [field]: value } : m) }))
  }
  const deleteMeter = (meterId: string) => {
    saveProtocol({ meters: protocol.meters.filter((m: any) => m.id !== meterId) })
  }

  // Key functions
  const addKey = () => {
    const newKey = { id: crypto.randomUUID(), description: 'Haustür', count: 1 }
    saveProtocol({ keys: [...(protocol.keys || []), newKey] })
  }
  const updateKey = (keyId: string, field: string, value: any) => {
    const updatedKeys = protocol.keys.map((k: any) => k.id === keyId ? { ...k, [field]: value } : k)
    saveProtocol({ keys: updatedKeys })
  }
  const updateKeyLocal = (keyId: string, field: string, value: any) => {
    setProtocol((prev: any) => ({ ...prev, keys: prev.keys.map((k: any) => k.id === keyId ? { ...k, [field]: value } : k) }))
  }
  const deleteKey = (keyId: string) => {
    saveProtocol({ keys: protocol.keys.filter((k: any) => k.id !== keyId) })
  }

  const executeDelete = async () => {
    const { error } = await supabase.from('protocols').delete().eq('id', id)
    if (error) { toast.error('Fehler beim Löschen'); return }
    toast.success('Protokoll gelöscht')
    router.push('/dashboard')
  }

  const isRoomValid = (room: any) => {
    if (room.condition === 'Alles okay') return true
    if (!room.defects || room.defects.length === 0) return false
    return room.defects.every((d: any) => d.description?.trim().length > 0 && d.photoUrls?.length > 0)
  }
  const areAllRoomsValid = () => (protocol.rooms || []).every(isRoomValid)
  const areAllMetersValid = () => (protocol.meters || []).every((m: any) => m.number?.trim().length > 0 && m.reading?.trim().length > 0)

  const sendEmail = async () => {
    toast.success(`Protokoll wurde an ${protocol.tenant_email} gesendet.`)
    setIsEmailDialogOpen(false)
    router.push('/dashboard')
  }

  const generatePDF = async () => {
    if (!areAllRoomsValid()) {
      toast.error('Bitte füllen Sie alle Pflichtfelder bei den Mängeln aus (Beschreibung & mind. ein Foto pro Mangel).')
      setActiveTab('rooms')
      return
    }
    if (!areAllMetersValid()) {
      toast.error('Bitte füllen Sie alle Zählerdaten aus (Nummer & Stand).')
      setActiveTab('meters')
      return
    }
    try {
      toast.loading('Generiere PDF... Bitte warten.', { id: 'pdf-gen' })

      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.top = '0'
      container.style.color = '#000000'
      container.style.backgroundColor = '#ffffff'
      document.body.appendChild(container)

      const { createRoot } = await import('react-dom/client')
      const root = createRoot(container)

      await new Promise<void>((resolve) => {
        root.render(
          <PrintableProtocol
            protocol={protocol}
            userName={userName}
            userCompany={userCompany}
            propertyAddress={propertyAddress}
          />
        )
        setTimeout(resolve, 1500)
      })

      const element = container.querySelector('#pdf-content')
      if (!element) throw new Error('PDF container not found')

      const html2pdf = (await import('html2pdf.js')).default

      const opt: any = {
        margin: [10, 10, 10, 10],
        filename: `Protokoll_${protocol.tenant_first_name}_${protocol.tenant_last_name}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: 720,
          onclone: (clonedDoc: Document) => {
            const externalStyles = clonedDoc.querySelectorAll('link[rel="stylesheet"], style:not(#pdf-content style)')
            externalStyles.forEach(s => s.remove())
            const elements = clonedDoc.querySelectorAll('*')
            elements.forEach((el) => {
              const htmlEl = el as HTMLElement
              const inlineStyle = htmlEl.getAttribute('style') || ''
              if (inlineStyle.includes('oklch')) {
                htmlEl.setAttribute('style', inlineStyle.replace(/oklch\([^)]+\)/g, '#000000'))
              }
              const style = window.getComputedStyle(htmlEl)
              ;['color', 'backgroundColor', 'borderColor', 'outlineColor', 'fill', 'stroke'].forEach((prop) => {
                const val = style.getPropertyValue(prop)
                if (val?.includes('oklch')) {
                  htmlEl.style.setProperty(prop, prop === 'backgroundColor' ? 'transparent' : '#000000', 'important')
                }
              })
            })
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy', 'avoid'], avoid: ['.defect-container', '.pdf-grid-item', '.pdf-grid-3-item', '.signature-section'] }
      }

      await new Promise(resolve => setTimeout(resolve, 500))
      const pdfBlob = await html2pdf().set(opt).from(element as HTMLElement).outputPdf('blob')

      const pdfUrl = URL.createObjectURL(pdfBlob)
      window.open(pdfUrl, '_blank')

      await saveProtocol({ status: 'final' })
      toast.success('PDF generiert und Protokoll abgeschlossen', { id: 'pdf-gen' })

      if (protocol.tenant_email) {
        setIsEmailDialogOpen(true)
      } else {
        router.push('/dashboard')
      }

      setTimeout(() => {
        root.unmount()
        if (document.body.contains(container)) document.body.removeChild(container)
      }, 1000)
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Fehler bei der PDF-Erstellung', { id: 'pdf-gen' })
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center">Lade...</div>
  if (!protocol) return null

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold truncate">
            {protocol.tenant_salutation} {protocol.tenant_first_name} {protocol.tenant_last_name} - {protocol.type}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
              <Trash2 className="h-5 w-5" />
            </Button>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              protocol.status === 'final' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {protocol.status === 'final' ? 'Abgeschlossen' : 'Entwurf'}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-3xl px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="rooms" className="text-xs sm:text-sm">Räume</TabsTrigger>
            <TabsTrigger value="meters" className="text-xs sm:text-sm">Zähler</TabsTrigger>
            <TabsTrigger value="keys" className="text-xs sm:text-sm">Schlüssel</TabsTrigger>
            <TabsTrigger value="finish" className="text-xs sm:text-sm">Abschluss</TabsTrigger>
          </TabsList>

          {/* ROOMS TAB */}
          <TabsContent value="rooms" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Zimmer-Inspektion</h2>
              <DropdownMenu>
                <DropdownMenuTrigger className={buttonVariants({ size: 'sm' })}>
                  <Plus className="h-4 w-4 mr-1" /> Raum
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => addRoom('Wohnzimmer')}>Wohnzimmer</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addRoom('Schlafzimmer')}>Schlafzimmer</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addRoom('Flur')}>Flur</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addRoom('Küche')}>Küche</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addRoom('Badezimmer')}>Badezimmer</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addRoom('Balkon')}>Balkon</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => addRoom('Neuer Raum')}>Eigener Raum...</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {(!protocol.rooms || protocol.rooms.length === 0) && (
              <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                Noch keine Räume erfasst.
              </div>
            )}

            {protocol.rooms?.map((room: any) => (
              <Card key={room.id} className="mb-4">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <div className="relative flex-1 mr-4">
                    <Input
                      list={`room-names-${room.id}`}
                      value={room.name}
                      onChange={(e) => updateRoomLocal(room.id, 'name', e.target.value)}
                      onBlur={(e) => updateRoom(room.id, 'name', e.target.value)}
                      className="font-semibold text-lg border-none shadow-none px-0 focus-visible:ring-0 h-auto"
                    />
                    <datalist id={`room-names-${room.id}`}>
                      <option value="Wohnzimmer" />
                      <option value="Schlafzimmer" />
                      <option value="Flur" />
                      <option value="Küche" />
                      <option value="Badezimmer" />
                      <option value="Balkon" />
                    </datalist>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteRoom(room.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Zustand</Label>
                    <Select value={room.condition} onValueChange={(v) => updateRoom(room.id, 'condition', v)}>
                      <SelectTrigger className={cn(
                        "transition-colors",
                        room.condition === 'Alles okay' && "bg-emerald-50 border-emerald-200 text-emerald-700",
                        room.condition === 'Nicht okay' && "bg-red-50 border-red-200 text-red-700"
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alles okay">Alles okay</SelectItem>
                        <SelectItem value="Nicht okay">Nicht okay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {room.condition !== 'Alles okay' && (
                    <div className="space-y-6 border-t pt-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-bold uppercase tracking-wider text-slate-500">Mängel / Schäden</Label>
                        <Button variant="outline" size="sm" onClick={() => addDefect(room.id)}>
                          <Plus className="h-3 w-3 mr-1" /> Mangel hinzufügen
                        </Button>
                      </div>

                      {(!room.defects || room.defects.length === 0) && (
                        <p className="text-sm text-destructive font-medium italic">* Bitte erfassen Sie mindestens einen Mangel.</p>
                      )}

                      {room.defects?.map((defect: any) => (
                        <div key={defect.id} className="space-y-4 p-4 bg-slate-50 rounded-lg border relative group/defect">
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => deleteDefect(room.id, defect.id)}
                            className="absolute top-2 right-2 text-destructive opacity-0 group-hover/defect:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">Beschreibung <span className="text-destructive">*</span></Label>
                            <Textarea
                              value={defect.description}
                              onChange={(e) => updateDefectLocal(room.id, defect.id, 'description', e.target.value)}
                              onBlur={(e) => updateDefect(room.id, defect.id, 'description', e.target.value)}
                              placeholder="Wo genau ist der Schaden?"
                              className={!defect.description ? "border-destructive" : ""}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">Fotos <span className="text-destructive">*</span></Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {defect.photoUrls?.map((url: string, idx: number) => (
                                <div key={idx} className="relative group/photo aspect-square">
                                  <img src={url} alt="Schaden" className="w-full h-full object-cover rounded border" />
                                  <Button
                                    variant="destructive" size="icon"
                                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover/photo:opacity-100 transition-opacity"
                                    onClick={() => deleteDefectPhoto(room.id, defect.id, idx)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              <div
                                className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center bg-white hover:bg-slate-100 transition-colors cursor-pointer relative overflow-hidden"
                                onClick={() => fileInputRefs.current[`defect-${defect.id}`]?.click()}
                              >
                                <input
                                  type="file"
                                  ref={(el) => { fileInputRefs.current[`defect-${defect.id}`] = el }}
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    if (e.target.files?.[0]) {
                                      toast.promise(handlePhotoUpload(e.target.files[0]), {
                                        loading: 'Lade Foto hoch...',
                                        success: (url) => { addDefectPhoto(room.id, defect.id, url); return 'Foto hinzugefügt' },
                                        error: 'Fehler beim Hochladen',
                                      })
                                      e.target.value = ''
                                    }
                                  }}
                                />
                                <div className="text-center">
                                  <Camera className="h-6 w-6 mx-auto text-slate-400" />
                                  <span className="text-[10px] text-slate-500 font-medium">Foto hinzufügen</span>
                                </div>
                              </div>
                            </div>
                            {(!defect.photoUrls || defect.photoUrls.length === 0) && (
                              <p className="text-[10px] text-destructive font-medium italic">* Mindestens ein Foto erforderlich.</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* METERS TAB */}
          <TabsContent value="meters" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Zählerstände</h2>
              <Button onClick={addMeter} size="sm"><Plus className="h-4 w-4 mr-1" /> Zähler</Button>
            </div>

            {(!protocol.meters || protocol.meters.length === 0) && (
              <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">Noch keine Zähler erfasst.</div>
            )}

            {protocol.meters?.map((meter: any) => (
              <Card key={meter.id} className="mb-4">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <Select value={meter.type} onValueChange={(v) => updateMeter(meter.id, 'type', v)}>
                    <SelectTrigger className="w-[150px] font-semibold border-none shadow-none px-0 focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Strom">Strom</SelectItem>
                      <SelectItem value="Wasser">Wasser</SelectItem>
                      <SelectItem value="Gas">Gas</SelectItem>
                      <SelectItem value="Heizung">Heizung</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => deleteMeter(meter.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">Zählernummer <span className="text-destructive">*</span></Label>
                      <Input
                        value={meter.number}
                        onChange={(e) => updateMeterLocal(meter.id, 'number', e.target.value)}
                        onBlur={(e) => updateMeter(meter.id, 'number', e.target.value)}
                        placeholder="123456"
                        className={!meter.number ? "border-destructive" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">Zählerstand <span className="text-destructive">*</span></Label>
                      <Input
                        value={meter.reading}
                        onChange={(e) => updateMeterLocal(meter.id, 'reading', e.target.value)}
                        onBlur={(e) => updateMeter(meter.id, 'reading', e.target.value)}
                        placeholder="0000.0"
                        className={!meter.reading ? "border-destructive" : ""}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Foto vom Zählerstand</Label>
                    <div className="flex items-center gap-4">
                      {meter.photoUrl ? (
                        <div className="relative group w-24 h-24">
                          <img src={meter.photoUrl} alt="Zählerstand" className="w-full h-full object-cover rounded border" />
                          <Button variant="destructive" size="icon" className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => updateMeter(meter.id, 'photoUrl', '')}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-white hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => fileInputRefs.current[`meter-${meter.id}`]?.click()}>
                          <input
                            type="file"
                            ref={(el) => { fileInputRefs.current[`meter-${meter.id}`] = el }}
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              if (e.target.files?.[0]) {
                                handleMeterPhotoUpload(e.target.files[0], meter.id)
                                e.target.value = ''
                              }
                            }}
                          />
                          <div className="text-center">
                            <Camera className="h-6 w-6 mx-auto text-slate-400" />
                            <span className="text-[10px] text-slate-500 font-medium">Foto</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* KEYS TAB */}
          <TabsContent value="keys" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Schlüsselübergabe</h2>
              <Button onClick={addKey} size="sm"><Plus className="h-4 w-4 mr-1" /> Schlüssel</Button>
            </div>

            {(!protocol.keys || protocol.keys.length === 0) && (
              <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">Noch keine Schlüssel erfasst.</div>
            )}

            {protocol.keys?.map((key: any) => (
              <Card key={key.id} className="mb-4">
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Label>Beschreibung</Label>
                    <Input
                      value={key.description}
                      onChange={(e) => updateKeyLocal(key.id, 'description', e.target.value)}
                      onBlur={(e) => updateKey(key.id, 'description', e.target.value)}
                      placeholder="Haustür, Briefkasten..."
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Label>Anzahl</Label>
                    <Input
                      type="number" min="1"
                      value={key.count}
                      onChange={(e) => updateKeyLocal(key.id, 'count', parseInt(e.target.value) || 0)}
                      onBlur={(e) => updateKey(key.id, 'count', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteKey(key.id)} className="text-destructive mt-6">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* FINISH TAB */}
          <TabsContent value="finish" className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Abschluss & Unterschrift</h2>

            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label>Allgemeiner Zustand der Wohnung</Label>
                  <Select value={protocol.general_condition || ''} onValueChange={(v) => saveProtocol({ general_condition: v })}>
                    <SelectTrigger><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Besenrein">Besenrein</SelectItem>
                      <SelectItem value="Renoviert">Renoviert</SelectItem>
                      <SelectItem value="Nicht renoviert">Nicht renoviert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {protocol.type === 'Auszug' && (
                  <>
                    <div className="space-y-2">
                      <Label>Neue Anschrift des Mieters (Optional)</Label>
                      <Input
                        value={protocol.tenant_new_address || ''}
                        onChange={(e) => setProtocol({ ...protocol, tenant_new_address: e.target.value })}
                        onBlur={(e) => saveProtocol({ tenant_new_address: e.target.value })}
                        placeholder="Musterstraße 1, 12345 Musterstadt"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Zeugen (Optional)</Label>
                      <Input
                        value={protocol.witnesses || ''}
                        onChange={(e) => setProtocol({ ...protocol, witnesses: e.target.value })}
                        onBlur={(e) => saveProtocol({ witnesses: e.target.value })}
                        placeholder="Name der Zeugen"
                      />
                    </div>
                  </>
                )}

                <div className="border-t pt-6">
                  <SignaturePad label="Unterschrift Vermieter" onSave={(sig) => saveProtocol({ landlord_signature: sig })} />
                  {protocol.landlord_signature && (
                    <div className="mt-2 text-sm text-green-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" /> Gespeichert
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <SignaturePad
                    label={`Unterschrift Mieter (${protocol.tenant_first_name} ${protocol.tenant_last_name})`}
                    onSave={(sig) => saveProtocol({ tenant_signature: sig })}
                  />
                  {protocol.tenant_signature && (
                    <div className="mt-2 text-sm text-green-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" /> Gespeichert
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <Button
                    className="w-full" size="lg"
                    onClick={generatePDF}
                    disabled={!protocol.landlord_signature || !protocol.tenant_signature || !areAllRoomsValid() || !areAllMetersValid()}
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    PDF Generieren & Abschließen
                  </Button>
                  {(!protocol.landlord_signature || !protocol.tenant_signature) && (
                    <p className="text-xs text-center text-muted-foreground mt-2">Beide Unterschriften werden benötigt.</p>
                  )}
                  {(!areAllRoomsValid() || !areAllMetersValid()) && (
                    <p className="text-xs text-center text-destructive mt-2">Bitte füllen Sie alle Pflichtfelder aus (Mängeldetails & Zählerdaten).</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Protokoll löschen</DialogTitle>
            <DialogDescription>Möchten Sie dieses Protokoll wirklich unwiderruflich löschen?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Abbrechen</Button>
            <Button variant="destructive" onClick={executeDelete}>Löschen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Protokoll versenden</DialogTitle>
            <DialogDescription>
              Möchten Sie das fertige Protokoll jetzt per E-Mail an <strong>{protocol.tenant_email}</strong> senden?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEmailDialogOpen(false); router.push('/dashboard') }}>Später</Button>
            <Button onClick={sendEmail}>Jetzt senden</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
