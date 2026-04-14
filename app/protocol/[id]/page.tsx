'use client'

import { useEffect, useState, useRef, createRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
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
import { ArrowLeft, Camera, CheckCircle, Droplets, FileText, Flame, Home, Key, Lock, Plus, Thermometer, Trash2, WifiOff, Zap } from 'lucide-react'
import { SignaturePad, type SignaturePadHandle } from '@/components/SignaturePad'
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
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [protocol, setProtocol] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('rooms')
  const [userName, setUserName] = useState('')
  const [userCompany, setUserCompany] = useState('')
  const [propertyAddress, setPropertyAddress] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [landlordSigEmpty, setLandlordSigEmpty] = useState(true)
  const [tenantSigEmpty, setTenantSigEmpty] = useState(true)
  const landlordSigRef = useRef<SignaturePadHandle>(null)
  const tenantSigRef = useRef<SignaturePadHandle>(null)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const [isOnline, setIsOnline] = useState(true)
  const [resolvedImages, setResolvedImages] = useState<Map<string, string>>(new Map())

  // Extract storage path from a full public/signed URL or return as-is if already a path
  const extractStoragePath = (urlOrPath: string): string | null => {
    if (!urlOrPath || urlOrPath.startsWith('data:')) return null
    if (!urlOrPath.startsWith('http')) return urlOrPath // already a path
    const marker = '/object/public/protocol-images/'
    const idx = urlOrPath.indexOf(marker)
    if (idx !== -1) return decodeURIComponent(urlOrPath.slice(idx + marker.length).split('?')[0])
    return null
  }

  // Resolve a stored path/URL to a signed URL for display
  const resolveImageUrl = (urlOrPath: string): string => {
    if (!urlOrPath || urlOrPath.startsWith('data:')) return urlOrPath
    const path = extractStoragePath(urlOrPath)
    if (!path) return urlOrPath
    return resolvedImages.get(path) || urlOrPath
  }

  // Batch-sign all image paths in a protocol (called once after load)
  const loadResolvedImages = async (proto: any) => {
    const paths = new Set<string>()
    proto.rooms?.forEach((r: any) =>
      r.defects?.forEach((d: any) =>
        d.photoUrls?.forEach((u: string) => { const p = extractStoragePath(u); if (p) paths.add(p) })
      )
    )
    proto.meters?.forEach((m: any) => { const p = extractStoragePath(m.photoUrl); if (p) paths.add(p) })
    if (paths.size === 0) return
    const { data } = await supabase.storage.from('protocol-images').createSignedUrls([...paths], 86400)
    const map = new Map<string, string>(resolvedImages)
    data?.forEach(({ path, signedUrl }: any) => { if (signedUrl) map.set(path, signedUrl) })
    setResolvedImages(map)
  }

  useEffect(() => {
    const onOnline  = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    setIsOnline(navigator.onLine)
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

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
        loadResolvedImages(proto)

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

  // Nach Stripe-Zahlung: PDF automatisch generieren
  useEffect(() => {
    if (searchParams.get('finalized') === 'true' && protocol && !loading) {
      setActiveTab('finish')
      setTimeout(() => generatePDF(true), 500)
      // Query-Parameter entfernen
      router.replace(`/protocol/${id}`)
    }
  }, [searchParams, protocol, loading])

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
          const MAX = 1200
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

          canvas.toBlob(async (blob) => {
            if (!blob) { reject(new Error('Fehler beim Verarbeiten des Bildes')); return }
            try {
              const path = `${user!.id}/${id}/${crypto.randomUUID()}.jpg`
              const { data, error } = await supabase.storage
                .from('protocol-images')
                .upload(path, blob, { contentType: 'image/jpeg', upsert: false })
              if (error) throw error
              // Generate signed URL for immediate display (24h)
              const { data: signed } = await supabase.storage
                .from('protocol-images')
                .createSignedUrl(data.path, 86400)
              if (signed?.signedUrl) {
                setResolvedImages(prev => new Map(prev).set(data.path, signed.signedUrl))
              }
              resolve(data.path) // store path in DB, not public URL
            } catch (err) {
              reject(err)
            }
          }, 'image/jpeg', 0.75)
        }
        img.onerror = () => reject(new Error('Fehler beim Laden des Bildes'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'))
      reader.readAsDataURL(file)
    })
  }

  // Delete photo from Supabase Storage (handles paths and legacy public URLs)
  const deleteStoragePhoto = async (urlOrPath: string) => {
    if (!urlOrPath || urlOrPath.startsWith('data:')) return
    try {
      const path = extractStoragePath(urlOrPath) || urlOrPath
      await supabase.storage.from('protocol-images').remove([path])
      setResolvedImages(prev => { const m = new Map(prev); m.delete(path); return m })
    } catch { /* non-critical */ }
  }

  const handleMeterPhotoUpload = async (file: File, meterId: string) => {
    try {
      toast.loading('Lade Foto hoch...', { id: `upload-${meterId}` })
      const url = await handlePhotoUpload(file)
      updateMeter(meterId, 'photoUrl', url)
      toast.success('Foto hochgeladen', { id: `upload-${meterId}` })
    } catch (error) {
      console.error('Error uploading meter photo:', error)
      toast.error('Fehler beim Hochladen des Fotos', { id: `upload-${meterId}` })
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
    const room = protocol.rooms.find((r: any) => r.id === roomId)
    const defect = room?.defects?.find((d: any) => d.id === defectId)
    const urlToDelete = defect?.photoUrls?.[photoIndex]
    if (urlToDelete) deleteStoragePhoto(urlToDelete)
    const updatedRooms = protocol.rooms.map((r: any) => r.id === roomId ? { ...r, defects: r.defects.map((d: any) => d.id === defectId ? { ...d, photoUrls: d.photoUrls.filter((_: any, i: number) => i !== photoIndex) } : d) } : r)
    saveProtocol({ rooms: updatedRooms })
  }

  // Meter functions
  const addMeter = () => {
    const newMeter = { id: crypto.randomUUID(), type: 'Strom', number: '', reading: '', photoUrl: '' }
    saveProtocol({ meters: [...(protocol.meters || []), newMeter] })
  }
  const updateMeter = (meterId: string, field: string, value: any) => {
    if (field === 'photoUrl' && value === '') {
      const oldUrl = protocol.meters.find((m: any) => m.id === meterId)?.photoUrl
      if (oldUrl) deleteStoragePhoto(oldUrl)
    }
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
  const areAllMetersValid = () => (protocol.meters || []).every((m: any) => m.number?.trim().length > 0 && m.reading?.trim().length > 0 && m.photoUrl?.length > 0)

  const sendEmail = async () => {
    toast.success(`Protokoll wurde an ${protocol.tenant_email} gesendet.`)
    setIsEmailDialogOpen(false)
    router.push('/dashboard')
  }

  const handleFinalize = async () => {
    if (!areAllRoomsValid()) {
      toast.error('Bitte füllen Sie alle Pflichtfelder bei den Mängeln aus (Beschreibung & mind. ein Foto pro Mangel).')
      setActiveTab('rooms')
      return
    }
    if (!areAllMetersValid()) {
      toast.error('Bitte füllen Sie alle Zählerdaten aus (Nummer, Stand & Foto pro Zähler).')
      setActiveTab('meters')
      return
    }

    // Unterschriften aus Refs holen
    const landlordSig = landlordSigRef.current?.getDataURL()
    const tenantSig = tenantSigRef.current?.getDataURL()

    if (!landlordSig || !tenantSig) {
      toast.error('Beide Unterschriften werden benötigt.')
      setActiveTab('finish')
      return
    }

    // Unterschriften erst jetzt in DB speichern
    await saveProtocol({ landlord_signature: landlordSig, tenant_signature: tenantSig })

    setIsCheckoutLoading(true)
    try {
      // Versuchen kostenlos oder mit Pro abzuschließen
      const res = await fetch('/api/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protocolId: id }),
      })

      if (res.ok) {
        // Kostenloses oder Pro → PDF generieren und in DB speichern
        setProtocol((prev: any) => ({ ...prev, finalized_at: new Date().toISOString(), status: 'final' }))
        await generatePDF(true)
        if (protocol.tenant_email) setIsEmailDialogOpen(true)
        else router.push('/dashboard')
      } else {
        const data = await res.json()
        if (data.error === 'payment_required') {
          // Stripe Checkout starten
          const checkoutRes = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ONDEMAND,
              mode: 'payment',
              protocolId: id,
            }),
          })
          const { url } = await checkoutRes.json()
          if (url) window.location.href = url
        } else {
          toast.error('Fehler beim Abschließen')
        }
      }
    } catch {
      toast.error('Fehler beim Abschließen')
    } finally {
      setIsCheckoutLoading(false)
    }
  }

  // Convert any URL/path to base64 data URI (resolves storage paths via signed URLs)
  const urlToBase64 = async (urlOrPath: string): Promise<string> => {
    if (!urlOrPath) return ''
    if (urlOrPath.startsWith('data:')) return urlOrPath
    try {
      let url = urlOrPath
      // If it's a storage path (not a full URL), generate a short-lived signed URL for the PDF
      if (!urlOrPath.startsWith('http')) {
        const { data } = await supabase.storage.from('protocol-images').createSignedUrl(urlOrPath, 300)
        if (!data?.signedUrl) return ''
        url = data.signedUrl
      }
      const res = await fetch(url)
      if (!res.ok) return ''
      const blob = await res.blob()
      return await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = () => resolve('')
        reader.readAsDataURL(blob)
      })
    } catch { return '' }
  }

  // Pre-convert all photos in protocol to base64 so html2canvas can render them
  const prepareProtocolImages = async (p: any) => {
    const copy = { ...p }
    if (copy.rooms) {
      copy.rooms = await Promise.all(copy.rooms.map(async (room: any) => ({
        ...room,
        defects: room.defects ? await Promise.all(room.defects.map(async (d: any) => ({
          ...d,
          photoUrls: d.photoUrls ? await Promise.all(d.photoUrls.map(urlToBase64)) : [],
        }))) : [],
      })))
    }
    if (copy.meters) {
      copy.meters = await Promise.all(copy.meters.map(async (m: any) => ({
        ...m,
        photoUrl: m.photoUrl ? await urlToBase64(m.photoUrl) : '',
      })))
    }
    if (copy.landlord_signature && !copy.landlord_signature.startsWith('data:')) {
      copy.landlord_signature = await urlToBase64(copy.landlord_signature)
    }
    if (copy.tenant_signature && !copy.tenant_signature.startsWith('data:')) {
      copy.tenant_signature = await urlToBase64(copy.tenant_signature)
    }
    return copy
  }

  const downloadStoredPDF = async () => {
    if (!protocol?.pdf_url) return false
    try {
      const link = document.createElement('a')
      link.href = protocol.pdf_url
      link.download = `Protokoll_${protocol.tenant_first_name}_${protocol.tenant_last_name}.pdf`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return true
    } catch { return false }
  }

  const generatePDF = async (uploadAndStore = false) => {
    // If PDF already stored, just download it
    if (protocol?.pdf_url && !uploadAndStore) {
      const ok = await downloadStoredPDF()
      if (ok) return
    }

    try {
      toast.loading('Generiere PDF... Bitte warten.', { id: 'pdf-gen' })

      // Pre-fetch all images to base64 so they render correctly
      toast.loading('Lade Bilder...', { id: 'pdf-gen' })
      const preparedProtocol = await prepareProtocolImages(protocol)

      const container = document.createElement('div')
      container.style.cssText = 'position:absolute;left:-9999px;top:0;background:#fff;'
      document.body.appendChild(container)

      const { createRoot } = await import('react-dom/client')
      const root = createRoot(container)

      await new Promise<void>((resolve) => {
        root.render(
          <PrintableProtocol
            protocol={preparedProtocol}
            userName={userName}
            userCompany={userCompany}
            propertyAddress={propertyAddress}
          />
        )
        setTimeout(resolve, 800)
      })

      const element = container.querySelector('#pdf-content')
      if (!element) throw new Error('PDF container not found')

      toast.loading('Erstelle PDF...', { id: 'pdf-gen' })

      const html2pdf = (await import('html2pdf.js')).default
      const filename = `Protokoll_${protocol.tenant_first_name}_${protocol.tenant_last_name}.pdf`

      const opt: any = {
        margin: 0,
        filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 794, // A4 at 96dpi
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      }

      const pdfBlob: Blob = await html2pdf().set(opt).from(element as HTMLElement).outputPdf('blob')

      // Upload to Supabase and save URL on first finalization
      if (uploadAndStore) {
        try {
          toast.loading('Speichere PDF...', { id: 'pdf-gen' })
          const formData = new FormData()
          formData.append('pdf', pdfBlob, filename)
          formData.append('protocolId', id)
          const res = await fetch('/api/protocol/save-pdf', { method: 'POST', body: formData })
          const data = await res.json()
          if (data.url) {
            setProtocol((prev: any) => ({ ...prev, pdf_url: data.url }))
          }
        } catch (e) {
          console.warn('PDF upload failed, falling back to local download', e)
        }
      }

      // Open PDF for download
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 5000)

      toast.success('PDF erfolgreich heruntergeladen', { id: 'pdf-gen' })

      setTimeout(() => {
        root.unmount()
        if (document.body.contains(container)) document.body.removeChild(container)
      }, 1000)
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Fehler bei der PDF-Erstellung', { id: 'pdf-gen' })
    }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center flex-col gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Lade Protokoll...</p>
    </div>
  )
  if (!protocol) return null

  const isFinalized = !!protocol.finalized_at
  const tenantName = `${protocol.tenant_salutation ? protocol.tenant_salutation + ' ' : ''}${protocol.tenant_first_name} ${protocol.tenant_last_name}`.trim()

  // ── READ-ONLY VIEW FOR FINALIZED PROTOCOLS ──────────────────────────────
  if (isFinalized) {
    const rooms: any[] = protocol.rooms || []
    const meters: any[] = (protocol.meters || []).filter((m: any) => m.number || m.reading)
    const keys: any[] = protocol.keys || []

    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        {/* Header */}
        {!isOnline && (
          <div className="sticky top-0 z-30 bg-red-500 text-white text-xs font-medium px-4 py-2 flex items-center gap-2 justify-center">
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            Kein Internet — Änderungen werden derzeit nicht gespeichert
          </div>
        )}
        <header className="bg-white shadow-sm sticky top-0 z-20">
          <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold leading-tight truncate">{tenantName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {protocol.type} · {propertyAddress}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-green-100 text-green-800 whitespace-nowrap shrink-0">
              <Lock className="h-3 w-3" /> Abgeschlossen
            </span>
          </div>
        </header>

        {/* Sticky PDF Button */}
        <div className="sticky top-14 z-10 bg-white border-b border-slate-100 px-4 py-2.5">
          <div className="mx-auto max-w-3xl">
            <Button className="w-full sm:w-auto gap-2 shadow-sm" onClick={() => generatePDF(false)}>
              <FileText className="h-4 w-4" />
              PDF herunterladen
            </Button>
          </div>
        </div>

        <main className="mx-auto max-w-3xl px-4 py-5 space-y-5">

          {/* Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Vermieter</p>
              <p className="font-semibold text-slate-900 text-sm">{userName || '—'}</p>
              {userCompany && <p className="text-xs text-slate-500">{userCompany}</p>}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Mieter</p>
              <p className="font-semibold text-slate-900 text-sm">{tenantName}</p>
              {protocol.tenant_email && <p className="text-xs text-slate-500">{protocol.tenant_email}</p>}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Objekt & Datum</p>
              <p className="font-semibold text-slate-900 text-sm">{propertyAddress}</p>
              <p className="text-xs text-slate-500">{protocol.type} · {new Date(protocol.date).toLocaleDateString('de-DE')}</p>
            </div>
          </div>

          {/* General condition */}
          {protocol.general_condition && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Allgemeiner Zustand</p>
              <p className="text-slate-800 font-medium">{protocol.general_condition}</p>
            </div>
          )}

          {/* Rooms */}
          {rooms.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-900 text-sm">Räume & Zustand</h2>
                <span className="text-xs text-slate-400">{rooms.length} Räume</span>
              </div>
              <div className="divide-y divide-slate-100">
                {rooms.map((room: any, idx: number) => (
                  <div key={room.id || idx}>
                    <div className={`flex items-center justify-between px-4 py-3 border-l-4 ${room.condition === 'Alles okay' ? 'border-l-emerald-400' : 'border-l-red-400'}`}>
                      <span className="font-medium text-slate-800 text-sm">{room.name}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${room.condition === 'Alles okay' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {room.condition}
                      </span>
                    </div>
                    {room.condition !== 'Alles okay' && room.defects?.length > 0 && (
                      <div className="px-4 pb-3 space-y-2">
                        {room.defects.map((defect: any, dIdx: number) => (
                          <div key={defect.id || dIdx} className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                            <p className="text-xs font-bold text-amber-700 mb-1">Mangel {dIdx + 1}</p>
                            <p className="text-sm text-amber-900">{defect.description}</p>
                            {defect.photoUrls?.length > 0 && (
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {defect.photoUrls.map((url: string, pIdx: number) => (
                                  <img key={pIdx} src={url} alt={`Foto ${pIdx + 1}`}
                                    className="h-20 w-20 object-cover rounded border border-amber-200 cursor-pointer"
                                    onClick={() => window.open(url, '_blank')}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meters */}
          {meters.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="font-bold text-slate-900 text-sm">Zählerstände</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {meters.map((meter: any, idx: number) => (
                  <div key={meter.id || idx} className="flex items-center gap-4 px-4 py-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      {(({
                        Strom: <Zap className="h-4 w-4 text-yellow-500" />,
                        Wasser: <Droplets className="h-4 w-4 text-blue-500" />,
                        Gas: <Flame className="h-4 w-4 text-orange-500" />,
                        Heizung: <Thermometer className="h-4 w-4 text-red-500" />,
                      } as Record<string, React.ReactNode>)[meter.type] ?? <Zap className="h-4 w-4 text-slate-400" />)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 text-sm">{meter.type}</p>
                      <p className="text-xs text-slate-500">Nr. {meter.number}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 text-sm">{meter.reading}</p>
                    </div>
                    {meter.photoUrl && (
                      <img src={resolveImageUrl(meter.photoUrl)} alt={meter.type}
                        className="h-10 w-10 object-cover rounded border border-slate-200 cursor-pointer shrink-0"
                        onClick={() => window.open(meter.photoUrl, '_blank')}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keys */}
          {keys.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="font-bold text-slate-900 text-sm">Schlüsselübergabe</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {keys.map((key: any, idx: number) => (
                  <div key={key.id || idx} className="flex items-center gap-3 px-4 py-3">
                    <span className="font-bold text-slate-900 bg-slate-100 rounded px-2 py-0.5 text-sm shrink-0">{key.count}x</span>
                    <span className="text-slate-700 text-sm">{key.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-bold text-slate-900 text-sm text-center mb-5">Unterschriften</h2>
            <div className="grid grid-cols-2 gap-5">
              <div className="text-center">
                {protocol.landlord_signature ? (
                  <img src={protocol.landlord_signature} alt="Unterschrift Vermieter"
                    className="h-20 w-full object-contain mb-2 border-b-2 border-slate-300 pb-2" />
                ) : (
                  <div className="h-20 border-b-2 border-slate-200 mb-2 flex items-center justify-center">
                    <span className="text-slate-300 text-xs italic">Fehlt</span>
                  </div>
                )}
                <p className="font-semibold text-xs text-slate-700">Vermieter / Verwalter</p>
                <p className="text-xs text-slate-400">{userName}</p>
              </div>
              <div className="text-center">
                {protocol.tenant_signature ? (
                  <img src={protocol.tenant_signature} alt="Unterschrift Mieter"
                    className="h-20 w-full object-contain mb-2 border-b-2 border-slate-300 pb-2" />
                ) : (
                  <div className="h-20 border-b-2 border-slate-200 mb-2 flex items-center justify-center">
                    <span className="text-slate-300 text-xs italic">Fehlt</span>
                  </div>
                )}
                <p className="font-semibold text-xs text-slate-700">Mieter</p>
                <p className="text-xs text-slate-400">{tenantName}</p>
              </div>
            </div>
            <p className="text-center text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
              Abgeschlossen am {new Date(protocol.finalized_at).toLocaleString('de-DE')} Uhr
            </p>
          </div>

        </main>

        {/* Dialogs */}
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
  // ── END READ-ONLY VIEW ──────────────────────────────────────────────────

  const METER_ICONS: Record<string, React.ReactNode> = {
    Strom: <Zap className="h-4 w-4 text-yellow-500" />,
    Wasser: <Droplets className="h-4 w-4 text-blue-500" />,
    Gas: <Flame className="h-4 w-4 text-orange-500" />,
    Heizung: <Thermometer className="h-4 w-4 text-red-500" />,
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold leading-tight truncate">{tenantName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {protocol.type} {propertyAddress ? `· ${propertyAddress}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!protocol.finalized_at && (
              <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
              protocol.finalized_at ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {protocol.finalized_at ? <><Lock className="h-3 w-3" /> Abgeschlossen</> : 'Entwurf'}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-14 z-10 bg-slate-50 pt-2 pb-2 border-b border-slate-200 mb-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="rooms" className="text-xs sm:text-sm">Räume</TabsTrigger>
              <TabsTrigger value="meters" className="text-xs sm:text-sm">Zähler</TabsTrigger>
              <TabsTrigger value="keys" className="text-xs sm:text-sm">Schlüssel</TabsTrigger>
              <TabsTrigger value="finish" className="text-xs sm:text-sm">Abschluss</TabsTrigger>
            </TabsList>
          </div>

          {isFinalized && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 mb-4 text-sm text-green-800">
              <Lock className="h-4 w-4 shrink-0" />
              <span>Dieses Protokoll ist abgeschlossen und kann nicht mehr bearbeitet werden.</span>
            </div>
          )}

          {/* ROOMS TAB */}
          <TabsContent value="rooms" className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-muted-foreground font-medium">Zustand der einzelnen Räume erfassen</p>
              <DropdownMenu>
                <DropdownMenuTrigger className={buttonVariants({ size: 'sm' })} disabled={isFinalized}>
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
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-white">
                <div className="mb-3 rounded-full bg-slate-100 p-3">
                  <Home className="h-6 w-6 text-slate-400" />
                </div>
                <p className="font-medium text-slate-600">Noch keine Räume erfasst</p>
                <p className="text-sm text-muted-foreground mt-1">Klicken Sie auf „+ Raum" um zu beginnen</p>
              </div>
            )}

            {protocol.rooms?.map((room: any) => (
              <Card key={room.id} className={`mb-4 overflow-hidden border-l-4 ${room.condition === 'Nicht okay' ? 'border-l-red-400' : 'border-l-emerald-400'}`}>
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
                                  <img src={resolveImageUrl(url)} alt="Schaden" className="w-full h-full object-cover rounded border" />
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
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-muted-foreground font-medium">Aktuelle Zählerstände dokumentieren</p>
              <Button onClick={addMeter} size="sm" disabled={isFinalized}><Plus className="h-4 w-4 mr-1" /> Zähler</Button>
            </div>

            {(!protocol.meters || protocol.meters.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-white">
                <div className="mb-3 rounded-full bg-slate-100 p-3">
                  <Zap className="h-6 w-6 text-slate-400" />
                </div>
                <p className="font-medium text-slate-600">Noch keine Zähler erfasst</p>
                <p className="text-sm text-muted-foreground mt-1">Strom, Wasser, Gas & Heizung hinzufügen</p>
              </div>
            )}

            {protocol.meters?.map((meter: any) => (
              <Card key={meter.id} className="mb-4">
                <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    {METER_ICONS[meter.type] || <Zap className="h-4 w-4 text-slate-400" />}
                    <Select value={meter.type} onValueChange={(v) => updateMeter(meter.id, 'type', v)}>
                      <SelectTrigger className="w-[140px] font-semibold border-none shadow-none px-0 focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Strom">Strom</SelectItem>
                        <SelectItem value="Wasser">Wasser</SelectItem>
                        <SelectItem value="Gas">Gas</SelectItem>
                        <SelectItem value="Heizung">Heizung</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                    <Label className="flex items-center gap-1">Foto vom Zählerstand <span className="text-destructive">*</span></Label>
                    <div className="flex items-center gap-4">
                      {meter.photoUrl ? (
                        <div className="relative group w-24 h-24">
                          <img src={resolveImageUrl(meter.photoUrl)} alt="Zählerstand" className="w-full h-full object-cover rounded border" />
                          <Button variant="destructive" size="icon" className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => updateMeter(meter.id, 'photoUrl', '')}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className={`w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-white hover:bg-slate-100 transition-colors cursor-pointer ${!meter.photoUrl ? 'border-destructive/50' : ''}`} onClick={() => fileInputRefs.current[`meter-${meter.id}`]?.click()}>
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
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-muted-foreground font-medium">Übergebene Schlüssel festhalten</p>
              <Button onClick={addKey} size="sm" disabled={isFinalized}><Plus className="h-4 w-4 mr-1" /> Schlüssel</Button>
            </div>

            {(!protocol.keys || protocol.keys.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-white">
                <div className="mb-3 rounded-full bg-slate-100 p-3">
                  <Key className="h-6 w-6 text-slate-400" />
                </div>
                <p className="font-medium text-slate-600">Noch keine Schlüssel erfasst</p>
                <p className="text-sm text-muted-foreground mt-1">Haustür, Briefkasten, Keller etc. hinzufügen</p>
              </div>
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
            <p className="text-sm text-muted-foreground font-medium mb-2">Unterschriften einholen &amp; Protokoll abschließen</p>

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
                  <SignaturePad
                    ref={landlordSigRef}
                    label="Unterschrift Vermieter"
                    onChange={(empty) => setLandlordSigEmpty(empty)}
                  />
                </div>

                <div className="border-t pt-6">
                  <SignaturePad
                    ref={tenantSigRef}
                    label={`Unterschrift Mieter (${protocol.tenant_first_name} ${protocol.tenant_last_name})`}
                    onChange={(empty) => setTenantSigEmpty(empty)}
                  />
                </div>

                <div className="border-t pt-6">
                  {protocol.finalized_at ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-2 text-green-700 font-semibold">
                        <Lock className="h-5 w-5" />
                        Protokoll abgeschlossen & gesperrt
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Abgeschlossen am {new Date(protocol.finalized_at).toLocaleDateString('de-DE')}
                      </p>
                      <Button variant="outline" className="w-full" onClick={() => generatePDF(false)}>
                        <FileText className="mr-2 h-5 w-5" />
                        PDF herunterladen
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        className="w-full" size="lg"
                        onClick={handleFinalize}
                        disabled={isCheckoutLoading}
                      >
                        <FileText className="mr-2 h-5 w-5" />
                        {isCheckoutLoading ? 'Wird verarbeitet...' : 'PDF Generieren & Abschließen'}
                      </Button>
                      {(landlordSigEmpty || tenantSigEmpty) && (
                        <p className="text-xs text-center text-muted-foreground mt-2">Beide Unterschriften werden benötigt.</p>
                      )}
                    </>
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
