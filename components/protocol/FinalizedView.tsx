'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Droplets, FileText, Flame, Lock, Thermometer, WifiOff, Zap } from 'lucide-react'

interface FinalizedViewProps {
  protocol: any
  resolveImageUrl: (urlOrPath: string) => string
  userName: string
  userCompany: string
  propertyAddress: string
  isOnline: boolean
  tenantName: string
  isEmailDialogOpen: boolean
  setIsEmailDialogOpen: (v: boolean) => void
  onGeneratePDF: (uploadAndStore?: boolean) => Promise<void>
  onSendEmail: () => void
  onBack: () => void
}

export function FinalizedView({
  protocol, resolveImageUrl, userName, userCompany, propertyAddress,
  isOnline, tenantName, isEmailDialogOpen, setIsEmailDialogOpen,
  onGeneratePDF, onSendEmail, onBack,
}: FinalizedViewProps) {
  const rooms: any[] = protocol.rooms || []
  const meters: any[] = (protocol.meters || []).filter((m: any) => m.number || m.reading)
  const keys: any[] = protocol.keys || []

  const METER_ICONS: Record<string, React.ReactNode> = {
    Strom:   <Zap         className="h-4 w-4 text-yellow-500" />,
    Wasser:  <Droplets    className="h-4 w-4 text-blue-500"   />,
    Gas:     <Flame       className="h-4 w-4 text-orange-500" />,
    Heizung: <Thermometer className="h-4 w-4 text-red-500"    />,
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {!isOnline && (
        <div className="sticky top-0 z-30 bg-red-500 text-white text-xs font-medium px-4 py-2 flex items-center gap-2 justify-center">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          Kein Internet — Änderungen werden derzeit nicht gespeichert
        </div>
      )}

      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
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

      {/* Sticky PDF button */}
      <div className="sticky top-14 z-10 bg-white border-b border-slate-100 px-4 py-2.5">
        <div className="mx-auto max-w-3xl">
          <Button className="w-full sm:w-auto gap-2 shadow-sm" onClick={() => onGeneratePDF(false)}>
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
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Objekt &amp; Datum</p>
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
              <h2 className="font-bold text-slate-900 text-sm">Räume &amp; Zustand</h2>
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
                                <img key={pIdx} src={resolveImageUrl(url)} alt={`Foto ${pIdx + 1}`}
                                  className="h-20 w-20 object-cover rounded border border-amber-200 cursor-pointer"
                                  onClick={() => window.open(resolveImageUrl(url), '_blank')}
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
                    {METER_ICONS[meter.type] ?? <Zap className="h-4 w-4 text-slate-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 text-sm">{meter.type}</p>
                    <p className="text-xs text-slate-500">Nr. {meter.number}</p>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{meter.reading}</p>
                  {meter.photoUrl && (
                    <img src={resolveImageUrl(meter.photoUrl)} alt={meter.type}
                      className="h-10 w-10 object-cover rounded border border-slate-200 cursor-pointer shrink-0"
                      onClick={() => window.open(resolveImageUrl(meter.photoUrl), '_blank')}
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

      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Protokoll versenden</DialogTitle>
            <DialogDescription>
              Möchten Sie das fertige Protokoll jetzt per E-Mail an <strong>{protocol.tenant_email}</strong> senden?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEmailDialogOpen(false); onBack() }}>Später</Button>
            <Button onClick={onSendEmail}>Jetzt senden</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
