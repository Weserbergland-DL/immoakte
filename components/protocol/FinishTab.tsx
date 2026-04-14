'use client'

import type { RefObject } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Lock } from 'lucide-react'
import { SignaturePad, type SignaturePadHandle } from '@/components/SignaturePad'

interface FinishTabProps {
  protocol: any
  isCheckoutLoading: boolean
  landlordSigRef: RefObject<SignaturePadHandle | null>
  tenantSigRef: RefObject<SignaturePadHandle | null>
  landlordSigEmpty: boolean
  tenantSigEmpty: boolean
  setLandlordSigEmpty: (v: boolean) => void
  setTenantSigEmpty: (v: boolean) => void
  saveProtocol: (data: any) => Promise<void>
  setProtocol: (updater: any) => void
  onFinalize: () => Promise<void>
  onGeneratePDF: (uploadAndStore?: boolean) => Promise<void>
}

export function FinishTab({
  protocol, isCheckoutLoading,
  landlordSigRef, tenantSigRef,
  landlordSigEmpty, tenantSigEmpty,
  setLandlordSigEmpty, setTenantSigEmpty,
  saveProtocol, setProtocol,
  onFinalize, onGeneratePDF,
}: FinishTabProps) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground font-medium mb-2">
        Unterschriften einholen &amp; Protokoll abschließen
      </p>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label>Allgemeiner Zustand der Wohnung</Label>
            <Select
              value={protocol.general_condition || ''}
              onValueChange={(v) => saveProtocol({ general_condition: v })}
            >
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
                <Label>Neue Anschrift des Mieters <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  value={protocol.tenant_new_address || ''}
                  onChange={(e) => setProtocol((p: any) => ({ ...p, tenant_new_address: e.target.value }))}
                  onBlur={(e) => saveProtocol({ tenant_new_address: e.target.value })}
                  placeholder="Musterstraße 1, 12345 Musterstadt"
                />
              </div>
              <div className="space-y-2">
                <Label>Zeugen <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  value={protocol.witnesses || ''}
                  onChange={(e) => setProtocol((p: any) => ({ ...p, witnesses: e.target.value }))}
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
              onChange={setLandlordSigEmpty}
            />
          </div>

          <div className="border-t pt-6">
            <SignaturePad
              ref={tenantSigRef}
              label={`Unterschrift Mieter (${protocol.tenant_first_name} ${protocol.tenant_last_name})`}
              onChange={setTenantSigEmpty}
            />
          </div>

          <div className="border-t pt-6">
            {protocol.finalized_at ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-green-700 font-semibold">
                  <Lock className="h-5 w-5" />
                  Protokoll abgeschlossen &amp; gesperrt
                </div>
                <p className="text-xs text-muted-foreground">
                  Abgeschlossen am {new Date(protocol.finalized_at).toLocaleDateString('de-DE')}
                </p>
                <Button variant="outline" className="w-full" onClick={() => onGeneratePDF(false)}>
                  <FileText className="mr-2 h-5 w-5" />
                  PDF herunterladen
                </Button>
              </div>
            ) : (
              <>
                <Button className="w-full" size="lg" onClick={onFinalize} disabled={isCheckoutLoading}>
                  <FileText className="mr-2 h-5 w-5" />
                  {isCheckoutLoading ? 'Wird verarbeitet...' : 'PDF Generieren & Abschließen'}
                </Button>
                {(landlordSigEmpty || tenantSigEmpty) && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Beide Unterschriften werden benötigt.
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
