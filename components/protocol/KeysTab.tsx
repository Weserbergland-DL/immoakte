'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Key, Plus, Trash2 } from 'lucide-react'

interface KeysTabProps {
  protocol: any
  isFinalized: boolean
  saveProtocol: (data: any) => Promise<void>
  setProtocol: (updater: any) => void
}

export function KeysTab({ protocol, isFinalized, saveProtocol, setProtocol }: KeysTabProps) {
  const addKey = () =>
    saveProtocol({ keys: [...(protocol.keys || []), { id: crypto.randomUUID(), description: 'Haustür', count: 1 }] })

  const updateKey = (keyId: string, field: string, value: any) =>
    saveProtocol({ keys: protocol.keys.map((k: any) => k.id === keyId ? { ...k, [field]: value } : k) })

  const updateKeyLocal = (keyId: string, field: string, value: any) =>
    setProtocol((prev: any) => ({ ...prev, keys: prev.keys.map((k: any) => k.id === keyId ? { ...k, [field]: value } : k) }))

  const deleteKey = (keyId: string) =>
    saveProtocol({ keys: protocol.keys.filter((k: any) => k.id !== keyId) })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-muted-foreground font-medium">Übergebene Schlüssel festhalten</p>
        <Button onClick={addKey} size="sm" disabled={isFinalized}>
          <Plus className="h-4 w-4 mr-1" /> Schlüssel
        </Button>
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
    </div>
  )
}
