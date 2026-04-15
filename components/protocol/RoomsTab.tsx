'use client'

import { useRef } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Camera, Home, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoomsTabProps {
  protocol: any
  isFinalized: boolean
  resolveImageUrl: (urlOrPath: string) => string
  handlePhotoUpload: (file: File) => Promise<string>
  deleteStoragePhoto: (urlOrPath: string) => Promise<void>
  saveProtocol: (data: any) => Promise<void>
  setProtocol: (updater: any) => void
}

export function RoomsTab({
  protocol, isFinalized, resolveImageUrl, handlePhotoUpload, deleteStoragePhoto, saveProtocol, setProtocol
}: RoomsTabProps) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const addRoom = (name = 'Neuer Raum') =>
    saveProtocol({ rooms: [...(protocol.rooms || []), { id: crypto.randomUUID(), name, condition: 'Alles okay', defects: [] }] })

  const updateRoom = (roomId: string, field: string, value: any) =>
    saveProtocol({ rooms: protocol.rooms.map((r: any) => r.id === roomId ? { ...r, [field]: value } : r) })

  const updateRoomLocal = (roomId: string, field: string, value: any) =>
    setProtocol((prev: any) => ({ ...prev, rooms: prev.rooms.map((r: any) => r.id === roomId ? { ...r, [field]: value } : r) }))

  const deleteRoom = (roomId: string) =>
    saveProtocol({ rooms: protocol.rooms.filter((r: any) => r.id !== roomId) })

  const addDefect = (roomId: string) =>
    saveProtocol({ rooms: protocol.rooms.map((r: any) => r.id === roomId ? { ...r, defects: [...(r.defects || []), { id: crypto.randomUUID(), description: '', photoUrls: [] }] } : r) })

  const updateDefectLocal = (roomId: string, defectId: string, field: string, value: any) =>
    setProtocol((prev: any) => ({ ...prev, rooms: prev.rooms.map((r: any) => r.id === roomId ? { ...r, defects: r.defects.map((d: any) => d.id === defectId ? { ...d, [field]: value } : d) } : r) }))

  const updateDefect = (roomId: string, defectId: string, field: string, value: any) =>
    saveProtocol({ rooms: protocol.rooms.map((r: any) => r.id === roomId ? { ...r, defects: r.defects.map((d: any) => d.id === defectId ? { ...d, [field]: value } : d) } : r) })

  const deleteDefect = (roomId: string, defectId: string) =>
    saveProtocol({ rooms: protocol.rooms.map((r: any) => r.id === roomId ? { ...r, defects: r.defects.filter((d: any) => d.id !== defectId) } : r) })

  const addDefectPhoto = (roomId: string, defectId: string, photoUrl: string) =>
    saveProtocol({ rooms: protocol.rooms.map((r: any) => r.id === roomId ? { ...r, defects: r.defects.map((d: any) => d.id === defectId ? { ...d, photoUrls: [...(d.photoUrls || []), photoUrl] } : d) } : r) })

  const deleteDefectPhoto = (roomId: string, defectId: string, photoIndex: number) => {
    const room = protocol.rooms.find((r: any) => r.id === roomId)
    const defect = room?.defects?.find((d: any) => d.id === defectId)
    const urlToDelete = defect?.photoUrls?.[photoIndex]
    if (urlToDelete) deleteStoragePhoto(urlToDelete)
    saveProtocol({ rooms: protocol.rooms.map((r: any) => r.id === roomId ? { ...r, defects: r.defects.map((d: any) => d.id === defectId ? { ...d, photoUrls: d.photoUrls.filter((_: any, i: number) => i !== photoIndex) } : d) } : r) })
  }

  return (
    <div className="space-y-4">
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
                <option value="Wohnzimmer" /><option value="Schlafzimmer" />
                <option value="Flur" /><option value="Küche" />
                <option value="Badezimmer" /><option value="Balkon" />
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
                  'transition-colors',
                  room.condition === 'Alles okay' && 'bg-emerald-50 border-emerald-200 text-emerald-700',
                  room.condition === 'Nicht okay' && 'bg-red-50 border-red-200 text-red-700',
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
                    <Button variant="ghost" size="icon" onClick={() => deleteDefect(room.id, defect.id)}
                      className="absolute top-2 right-2 text-destructive opacity-100 sm:opacity-0 sm:group-hover/defect:opacity-100 transition-opacity"
                      aria-label="Mangel löschen">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">Beschreibung <span className="text-destructive">*</span></Label>
                      <Textarea
                        value={defect.description}
                        onChange={(e) => updateDefectLocal(room.id, defect.id, 'description', e.target.value)}
                        onBlur={(e) => updateDefect(room.id, defect.id, 'description', e.target.value)}
                        placeholder="Wo genau ist der Schaden?"
                        className={!defect.description ? 'border-destructive' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">Fotos <span className="text-destructive">*</span></Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {defect.photoUrls?.map((url: string, idx: number) => (
                          <div key={idx} className="relative group/photo aspect-square">
                            <img src={resolveImageUrl(url)} alt="Schaden" className="w-full h-full object-cover rounded border" />
                            <Button variant="destructive" size="icon"
                              className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-100 sm:opacity-0 sm:group-hover/photo:opacity-100 transition-opacity"
                              onClick={() => deleteDefectPhoto(room.id, defect.id, idx)}
                              aria-label="Foto entfernen">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <div className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center bg-white hover:bg-slate-100 transition-colors cursor-pointer relative overflow-hidden"
                          onClick={() => fileInputRefs.current[`defect-${defect.id}`]?.click()}>
                          <input type="file"
                            ref={(el) => { fileInputRefs.current[`defect-${defect.id}`] = el }}
                            accept="image/*" className="hidden"
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
    </div>
  )
}
