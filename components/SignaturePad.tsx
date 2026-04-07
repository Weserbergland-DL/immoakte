'use client'

import { useRef, useState, useEffect } from 'react'
import SignaturePadLibrary from 'signature_pad'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface SignaturePadProps {
  onSave: (signature: string) => void
  label: string
}

export function SignaturePad({ onSave, label }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signaturePadRef = useRef<SignaturePadLibrary | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d')?.scale(ratio, ratio)

      const pad = new SignaturePadLibrary(canvas, { penColor: 'black' })
      pad.addEventListener('endStroke', () => setIsEmpty(false))
      signaturePadRef.current = pad
    }

    return () => {
      if (signaturePadRef.current) signaturePadRef.current.off()
    }
  }, [])

  const clear = () => {
    signaturePadRef.current?.clear()
    setIsEmpty(true)
  }

  const save = () => {
    if (signaturePadRef.current?.isEmpty()) {
      toast.error('Bitte unterschreiben Sie zuerst.')
      return
    }
    const dataURL = signaturePadRef.current?.toDataURL('image/png')
    if (dataURL) onSave(dataURL)
  }

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      <div className="border rounded-md bg-white overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-40 touch-none" />
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={clear}>Löschen</Button>
        <Button size="sm" onClick={save} disabled={isEmpty}>Speichern</Button>
      </div>
    </div>
  )
}
