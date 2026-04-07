'use client'

import React from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface PrintableProtocolProps {
  protocol: any
  userName: string
  userCompany: string
  propertyAddress: string
}

export const PrintableProtocol: React.FC<PrintableProtocolProps> = ({
  protocol,
  userName,
  userCompany,
  propertyAddress,
}) => {
  const safeFormatDate = (dateStr: any) => {
    if (!dateStr) return 'Kein Datum'
    try {
      return format(new Date(dateStr), 'dd.MM.yyyy', { locale: de })
    } catch {
      return 'Ungültiges Datum'
    }
  }

  return (
    <div id="pdf-content" className="pdf-container bg-white text-black p-8 font-sans" style={{ width: '720px', margin: '0 auto', color: '#000000', backgroundColor: '#ffffff', boxSizing: 'border-box' }}>
      <style>{`
        @page { size: A4; margin: 10mm; }
        .pdf-container { width: 720px !important; margin: 0 auto !important; box-sizing: border-box !important; background-color: #ffffff !important; color: #000000 !important; }
        .pdf-container * { box-sizing: border-box !important; border-color: #e2e8f0 !important; box-shadow: none !important; color-scheme: light !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; --tw-ring-color: rgba(0,0,0,0) !important; --tw-ring-offset-color: rgba(0,0,0,0) !important; --tw-shadow-color: rgba(0,0,0,0) !important; --tw-outline-color: rgba(0,0,0,0) !important; }
        .pdf-container .text-slate-800 { color: #1e293b !important; }
        .pdf-container .text-slate-700 { color: #334155 !important; }
        .pdf-container .text-slate-600 { color: #475569 !important; }
        .pdf-container .text-slate-500 { color: #64748b !important; }
        .pdf-container .text-slate-400 { color: #94a3b8 !important; }
        .pdf-container .text-slate-300 { color: #cbd5e1 !important; }
        .pdf-container .bg-slate-100 { background-color: #f1f5f9 !important; }
        .pdf-container .bg-slate-50 { background-color: #f8fafc !important; }
        .pdf-container .bg-white { background-color: #ffffff !important; }
        .pdf-container .text-black { color: #000000 !important; }
        .pdf-container .bg-slate-800 { background-color: #1e293b !important; }
        .pdf-container .text-white { color: #ffffff !important; }
        .pdf-container .border-slate-800 { border-color: #1e293b !important; }
        .pdf-container .border-slate-400 { border-color: #94a3b8 !important; }
        .pdf-container .border-slate-300 { border-color: #cbd5e1 !important; }
        .pdf-container .border-slate-200 { border-color: #e2e8f0 !important; }
        .pdf-container .bg-amber-50 { background-color: #fffbeb !important; }
        .pdf-container .border-amber-100 { border-color: #fef3c7 !important; }
        .pdf-container .text-amber-800 { color: #92400e !important; }
        .pdf-container .text-amber-900 { color: #78350f !important; }
        .pdf-container .bg-emerald-100 { background-color: #d1fae5 !important; }
        .pdf-container .text-emerald-800 { color: #065f46 !important; }
        .pdf-container .bg-red-100 { background-color: #fee2e2 !important; }
        .pdf-container .text-red-800 { color: #991b1b !important; }
        .grid { display: grid !important; }
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        .gap-8 { gap: 2rem !important; }
        .gap-4 { gap: 1rem !important; }
        .mb-8 { margin-bottom: 2rem !important; }
        .mb-4 { margin-bottom: 1rem !important; }
        .mb-2 { margin-bottom: 0.5rem !important; }
        .mt-16 { margin-top: 4rem !important; }
        .mt-12 { margin-top: 3rem !important; }
        .mt-2 { margin-top: 0.5rem !important; }
        .p-8 { padding: 2rem !important; }
        .p-4 { padding: 1rem !important; }
        .p-3 { padding: 0.75rem !important; }
        .pb-4 { padding-bottom: 1rem !important; }
        .pb-2 { padding-bottom: 0.5rem !important; }
        .pt-8 { padding-top: 2rem !important; }
        .rounded-lg { border-radius: 0.5rem !important; }
        .rounded-t-lg { border-top-left-radius: 0.5rem !important; border-top-right-radius: 0.5rem !important; }
        .border { border-width: 1px !important; border-style: solid !important; }
        .border-b { border-bottom-width: 1px !important; border-bottom-style: solid !important; }
        .border-b-2 { border-bottom-width: 2px !important; border-bottom-style: solid !important; }
        .border-t-2 { border-top-width: 2px !important; border-top-style: solid !important; }
        .flex { display: flex !important; }
        .justify-between { justify-content: space-between !important; }
        .justify-center { justify-content: center !important; }
        .items-center { align-items: center !important; }
        .items-end { align-items: flex-end !important; }
        .space-y-6 > * + * { margin-top: 1.5rem !important; }
        .space-y-4 > * + * { margin-top: 1rem !important; }
        .space-y-2 > * + * { margin-top: 0.5rem !important; }
        .w-full { width: 100% !important; }
        .h-40 { height: 10rem !important; }
        .max-h-full { max-height: 100% !important; }
        .max-w-full { max-width: 100% !important; }
        .font-bold { font-weight: 700 !important; }
        .font-semibold { font-weight: 600 !important; }
        .font-medium { font-weight: 500 !important; }
        .text-3xl { font-size: 1.875rem !important; line-height: 2.25rem !important; }
        .text-xl { font-size: 1.25rem !important; line-height: 1.75rem !important; }
        .text-lg { font-size: 1.125rem !important; line-height: 1.75rem !important; }
        .text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
        .text-xs { font-size: 0.75rem !important; line-height: 1rem !important; }
        .text-center { text-align: center !important; }
        .uppercase { text-transform: uppercase !important; }
        .tracking-widest { letter-spacing: 0.1em !important; }
        .tracking-wider { letter-spacing: 0.05em !important; }
        .whitespace-pre-wrap { white-space: pre-wrap !important; }
        .font-mono { font-family: monospace !important; }
        .italic { font-style: italic !important; }
        .pdf-image { display: block !important; max-width: 100% !important; max-height: 100% !important; width: auto !important; height: auto !important; object-fit: contain !important; background-color: #f8fafc !important; margin: 0 auto !important; }
        .pdf-grid { display: block !important; width: 100% !important; clear: both !important; }
        .pdf-grid-item { display: inline-block !important; vertical-align: top !important; width: 48% !important; margin-right: 2% !important; margin-bottom: 1rem !important; page-break-inside: avoid !important; text-align: center !important; }
        .pdf-grid-3 { display: block !important; width: 100% !important; clear: both !important; }
        .pdf-grid-3-item { display: inline-block !important; vertical-align: top !important; width: 31% !important; margin-right: 2% !important; margin-bottom: 1rem !important; page-break-inside: avoid !important; text-align: center !important; }
        .room-card, .meter-section, .key-section, .signature-section { display: block !important; width: 100% !important; clear: both !important; margin-bottom: 2rem !important; border: 1px solid #e2e8f0 !important; }
        .badge-container { display: inline-block !important; padding: 6px 12px !important; border-radius: 9999px !important; white-space: nowrap !important; min-width: 90px !important; text-align: center !important; font-size: 10px !important; font-weight: 700 !important; line-height: 1 !important; }
        .defect-container { display: block !important; width: 100% !important; page-break-inside: avoid !important; margin-bottom: 1.5rem !important; clear: both !important; }
      `}</style>

      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-slate-800 pb-4">
        <h1 className="text-3xl font-bold uppercase tracking-widest text-slate-800">Übergabeprotokoll</h1>
        <p className="text-lg text-slate-600 mt-2 font-medium">{protocol.type} - {safeFormatDate(protocol.date)}</p>
      </div>

      {/* Meta Information */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Vermieter / Verwalter</h3>
          <p className="font-semibold text-lg">{userName || 'Nicht angegeben'}</p>
          {userCompany && <p className="text-slate-600">{userCompany}</p>}
        </div>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Mieter</h3>
          <p className="font-semibold text-lg">{protocol.tenant_salutation} {protocol.tenant_first_name} {protocol.tenant_last_name}</p>
          {protocol.tenant_email && <p className="text-slate-600">{protocol.tenant_email}</p>}
          {protocol.tenant_phone && <p className="text-slate-600">{protocol.tenant_phone}</p>}
          {protocol.type === 'Auszug' && protocol.tenant_new_address && (
            <p className="text-slate-600 mt-1">
              <span className="text-xs text-slate-400" style={{ display: 'block' }}>Neue Anschrift:</span>
              {protocol.tenant_new_address}
            </p>
          )}
        </div>
      </div>

      <div className="mb-8 bg-slate-50 p-4 rounded-lg border border-slate-200">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Objekt</h3>
        <p className="font-medium text-lg">{propertyAddress || 'Nicht angegeben'}</p>
      </div>

      {protocol.type === 'Auszug' && protocol.witnesses && (
        <div className="mb-8 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Zeugen</h3>
          <p className="font-medium">{protocol.witnesses}</p>
        </div>
      )}

      {/* General Condition */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 border-b border-slate-300 pb-2 mb-4">Allgemeiner Zustand</h2>
        <p className="text-slate-700 whitespace-pre-wrap">{protocol.general_condition || 'Keine Angaben zum allgemeinen Zustand gemacht.'}</p>
      </div>

      {/* Rooms */}
      {protocol.rooms && protocol.rooms.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-300 pb-2 mb-4">Räume & Zustand</h2>
          <div className="space-y-6">
            {protocol.rooms.map((room: any, index: number) => (
              <div key={room.id || index} className="room-card border border-slate-200 rounded-lg p-4 bg-white">
                <div className="mb-4" style={{ display: 'table', width: '100%', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <div style={{ display: 'table-cell', verticalAlign: 'middle' }}>
                    <h3 className="text-lg font-bold text-slate-800" style={{ margin: 0 }}>{room.name}</h3>
                  </div>
                  <div style={{ display: 'table-cell', verticalAlign: 'middle', textAlign: 'right' }}>
                    <div className={cn(
                      "badge-container",
                      room.condition === 'Alles okay' ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    )}>
                      {room.condition}
                    </div>
                  </div>
                </div>
                {room.condition !== 'Alles okay' && room.defects && room.defects.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {room.defects.map((defect: any, dIdx: number) => (
                      <div key={defect.id || dIdx} className="defect-container bg-amber-50 p-4 rounded border border-amber-100">
                        <p className="text-sm font-bold text-amber-800 mb-2">Mangel {dIdx + 1}:</p>
                        <p className="text-sm text-amber-900 whitespace-pre-wrap mb-3">{defect.description}</p>
                        {defect.photoUrls && defect.photoUrls.length > 0 && (
                          <div className="pdf-grid mt-2">
                            {defect.photoUrls.map((url: string, pIdx: number) => (
                              <div key={pIdx} className="pdf-grid-item bg-slate-50 rounded border border-slate-200 overflow-hidden p-1" style={{ height: '240px', display: 'inline-table' }}>
                                <div style={{ display: 'table-cell', verticalAlign: 'middle', textAlign: 'center', width: '100%', height: '240px' }}>
                                  <img src={url} alt={`Mangel ${dIdx + 1} Foto ${pIdx + 1}`} className="pdf-image" />
                                </div>
                              </div>
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
      {protocol.meters && protocol.meters.length > 0 && (
        <div className="meter-section mb-8">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-300 pb-2 mb-4">Zählerstände</h2>
          <table className="w-full text-left border-collapse mb-4">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="p-3 border border-slate-800 font-bold uppercase tracking-wider text-xs">Zählerart</th>
                <th className="p-3 border border-slate-800 font-bold uppercase tracking-wider text-xs">Zählernummer</th>
                <th className="p-3 border border-slate-800 font-bold uppercase tracking-wider text-xs">Zählerstand</th>
              </tr>
            </thead>
            <tbody>
              {protocol.meters.map((meter: any, index: number) => (
                <tr key={meter.id || index}>
                  <td className="p-3 border border-slate-200">{meter.type}</td>
                  <td className="p-3 border border-slate-200 font-mono text-sm">{meter.number}</td>
                  <td className="p-3 border border-slate-200 font-bold">{meter.reading}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pdf-grid-3 mt-4">
            {protocol.meters.filter((m: any) => m.photoUrl).map((meter: any, index: number) => (
              <div key={meter.id || index} className="pdf-grid-3-item space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase">{meter.type} ({meter.number})</p>
                <div className="bg-slate-50 rounded border border-slate-200 overflow-hidden p-1" style={{ height: '150px', display: 'inline-table', width: '100%' }}>
                  <div style={{ display: 'table-cell', verticalAlign: 'middle', textAlign: 'center', width: '100%', height: '150px' }}>
                    <img src={meter.photoUrl} alt={`Zähler ${meter.type}`} className="pdf-image" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keys */}
      {protocol.keys && protocol.keys.length > 0 && (
        <div className="key-section mb-8">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-300 pb-2 mb-4">Schlüsselübergabe</h2>
          <ul className="space-y-2" style={{ listStyle: 'none', padding: 0 }}>
            {protocol.keys.map((key: any, index: number) => (
              <li key={key.id || index} className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-2" style={{ display: 'table', width: '100%' }}>
                <div style={{ display: 'table-cell', verticalAlign: 'middle', width: '60px' }}>
                  <span className="font-bold text-lg text-center bg-white rounded border border-slate-200 py-1" style={{ display: 'block', width: '48px' }}>{key.count}x</span>
                </div>
                <div style={{ display: 'table-cell', verticalAlign: 'middle', paddingLeft: '16px' }}>
                  <span className="text-slate-700 font-medium">{key.description}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Signatures */}
      <div className="signature-section mt-16 pt-8 border-t-2 border-slate-800">
        <h2 className="text-xl font-bold text-slate-800 mb-8 text-center">Unterschriften</h2>
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="h-40 flex items-end justify-center border-b-2 border-slate-400 mb-4 rounded-t-lg" style={{ backgroundColor: 'rgba(248,250,252,0.3)' }}>
              {protocol.landlord_signature ? (
                <img src={protocol.landlord_signature} alt="Unterschrift Vermieter" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', padding: '8px' }} />
              ) : (
                <span className="text-slate-300 italic" style={{ marginBottom: '16px' }}>Fehlt</span>
              )}
            </div>
            <p className="font-semibold text-slate-800">Vermieter / Verwalter</p>
            <p className="text-sm text-slate-500">{userName || 'Nicht angegeben'}</p>
          </div>
          <div className="text-center">
            <div className="h-40 flex items-end justify-center border-b-2 border-slate-400 mb-4 rounded-t-lg" style={{ backgroundColor: 'rgba(248,250,252,0.3)' }}>
              {protocol.tenant_signature ? (
                <img src={protocol.tenant_signature} alt="Unterschrift Mieter" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', padding: '8px' }} />
              ) : (
                <span className="text-slate-300 italic" style={{ marginBottom: '16px' }}>Fehlt</span>
              )}
            </div>
            <p className="font-semibold text-slate-800">Mieter</p>
            <p className="text-sm text-slate-500">{protocol.tenant_first_name} {protocol.tenant_last_name}</p>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-12">
          Dieses Protokoll wurde digital erstellt und signiert am {format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr.
        </p>
      </div>
    </div>
  )
}
