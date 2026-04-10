'use client'

import { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import SignaturePadLibrary from 'signature_pad'
import { Button } from '@/components/ui/button'

export interface SignaturePadHandle {
  getDataURL: () => string | null
  isEmpty: () => boolean
}

interface SignaturePadProps {
  label: string
  onChange?: (isEmpty: boolean) => void
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ label, onChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const signaturePadRef = useRef<SignaturePadLibrary | null>(null)
    const [isEmpty, setIsEmpty] = useState(true)

    useImperativeHandle(ref, () => ({
      getDataURL: () => {
        if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) return null
        return signaturePadRef.current.toDataURL('image/png')
      },
      isEmpty: () => signaturePadRef.current?.isEmpty() ?? true,
    }))

    useEffect(() => {
      if (canvasRef.current) {
        const canvas = canvasRef.current
        const ratio = Math.max(window.devicePixelRatio || 1, 1)
        canvas.width = canvas.offsetWidth * ratio
        canvas.height = canvas.offsetHeight * ratio
        canvas.getContext('2d')?.scale(ratio, ratio)

        const pad = new SignaturePadLibrary(canvas, { penColor: 'black' })
        pad.addEventListener('endStroke', () => {
          setIsEmpty(false)
          onChange?.(false)
        })
        signaturePadRef.current = pad
      }
      return () => { if (signaturePadRef.current) signaturePadRef.current.off() }
    }, [])

    const clear = () => {
      signaturePadRef.current?.clear()
      setIsEmpty(true)
      onChange?.(true)
    }

    return (
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium leading-none">{label}</label>
        <div className={`border-2 rounded-md bg-white overflow-hidden transition-colors ${isEmpty ? 'border-dashed border-slate-300' : 'border-slate-400'}`}>
          <canvas ref={canvasRef} className="w-full h-40 touch-none" />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {isEmpty ? 'Bitte hier unterschreiben' : '✓ Unterschrift vorhanden'}
          </p>
          <Button variant="outline" size="sm" onClick={clear} disabled={isEmpty}>Löschen</Button>
        </div>
      </div>
    )
  }
)
SignaturePad.displayName = 'SignaturePad'
