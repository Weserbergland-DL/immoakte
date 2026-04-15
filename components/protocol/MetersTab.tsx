'use client'

import { useRef } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Camera, Droplets, Flame, Plus, Thermometer, Trash2, Zap } from 'lucide-react'

const METER_ICONS: Record<string, React.ReactNode> = {
  Strom:   <Zap        className="h-4 w-4 text-yellow-500" />,
  Wasser:  <Droplets   className="h-4 w-4 text-blue-500"   />,
  Gas:     <Flame      className="h-4 w-4 text-orange-500" />,
  Heizung: <Thermometer className="h-4 w-4 text-red-500"   />,
}

interface MetersTabProps {
  protocol: any
  isFinalized: boolean
  resolveImageUrl: (urlOrPath: string) => string
  handlePhotoUpload: (file: File) => Promise<string>
  deleteStoragePhoto: (urlOrPath: string) => Promise<void>
  saveProtocol: (data: any) => Promise<void>
  setProtocol: (updater: any) => void
}

export function MetersTab({
  protocol, isFinalized, resolveImageUrl, handlePhotoUpload, deleteStoragePhoto, saveProtocol, setProtocol
}: MetersTabProps) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const addMeter = () =>
    saveProtocol({ meters: [...(protocol.meters || []), { id: crypto.randomUUID(), type: 'Strom', number: '', reading: '', photoUrl: '' }] })

  const updateMeter = (meterId: string, field: string, value: any) => {
    if (field === 'photoUrl' && value === '') {
      const oldUrl = protocol.meters.find((m: any) => m.id === meterId)?.photoUrl
      if (oldUrl) deleteStoragePhoto(oldUrl)
    }
    saveProtocol({ meters: protocol.meters.map((m: any) => m.id === meterId ? { ...m, [field]: value } : m) })
  }

  const updateMeterLocal = (meterId: string, field: string, value: any) =>
    setProtocol((prev: any) => ({ ...prev, meters: prev.meters.map((m: any) => m.id === meterId ? { ...m, [field]: value } : m) }))

  const deleteMeter = (meterId: string) =>
    saveProtocol({ meters: protocol.meters.filter((m: any) => m.id !== meterId) })

  const handleMeterPhotoUpload = async (file: File, meterId: string) => {
    try {
      toast.loading('Lade Foto hoch...', { id: `upload-${meterId}` })
      const url = await handlePhotoUpload(file)
      updateMeter(meterId, 'photoUrl', url)
      toast.success('Foto hochgeladen', { id: `upload-${meterId}` })
    } catch {
      toast.error('Fehler beim Hochladen des Fotos', { id: `upload-${meterId}` })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-muted-foreground font-medium">Aktuelle Zählerstände dokumentieren</p>
        <Button onClick={addMeter} size="sm" disabled={isFinalized}>
          <Plus className="h-4 w-4 mr-1" /> Zähler
        </Button>
      </div>

      {(!protocol.meters || protocol.meters.length === 0) && (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-white">
          <div className="mb-3 rounded-full bg-slate-100 p-3">
            <Zap className="h-6 w-6 text-slate-400" />
          </div>
          <p className="font-medium text-slate-600">Noch keine Zähler erfasst</p>
          <p className="text-sm text-muted-foreground mt-1">Strom, Wasser, Gas &amp; Heizung hinzufügen</p>
        </div>
      )}

      {protocol.meters?.map((meter: any) => (
        <Card key={meter.id} className="mb-4">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              {METER_ICONS[meter.type] ?? <Zap className="h-4 w-4 text-slate-400" />}
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
                  className={!meter.number ? 'border-destructive' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">Zählerstand <span className="text-destructive">*</span></Label>
                <Input
                  value={meter.reading}
                  onChange={(e) => updateMeterLocal(meter.id, 'reading', e.target.value)}
                  onBlur={(e) => updateMeter(meter.id, 'reading', e.target.value)}
                  placeholder="0000.0"
                  className={!meter.reading ? 'border-destructive' : ''}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">Foto vom Zählerstand <span className="text-destructive">*</span></Label>
              <div className="flex items-center gap-4">
                {meter.photoUrl ? (
                  <div className="relative group w-24 h-24">
                    <img src={resolveImageUrl(meter.photoUrl)} alt="Zählerstand"
                      className="w-full h-full object-cover rounded border" />
                    <Button variant="destructive" size="icon"
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      onClick={() => updateMeter(meter.id, 'photoUrl', '')}
                      aria-label="Foto entfernen">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className={`w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-white hover:bg-slate-100 transition-colors cursor-pointer ${!meter.photoUrl ? 'border-destructive/50' : ''}`}
                    onClick={() => fileInputRefs.current[`meter-${meter.id}`]?.click()}
                  >
                    <input type="file"
                      ref={(el) => { fileInputRefs.current[`meter-${meter.id}`] = el }}
                      accept="image/*" className="hidden"
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
    </div>
  )
}
