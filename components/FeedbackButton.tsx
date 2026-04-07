'use client'

import React, { useState, useEffect } from 'react'
import { Bug, Send, X, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFeedback } from '@/contexts/FeedbackContext'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function FeedbackButton() {
  const { isOpen, closeFeedback, openFeedback, errorDetails } = useFeedback()
  const { user } = useAuth()
  const supabase = createClient()

  const [type, setType] = useState('bug')
  const [message, setMessage] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    if (errorDetails) setType('error')
  }, [errorDetails])

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen) return
      const items = e.clipboardData?.items
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile()
            if (file) {
              setImage(file)
              const reader = new FileReader()
              reader.onloadend = () => setImagePreview(reader.result as string)
              reader.readAsDataURL(file)
              toast.info('Bild aus Zwischenablage hinzugefügt')
            }
          }
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [isOpen])

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Bitte geben Sie eine Nachricht ein.')
      return
    }
    if (!user) {
      toast.error('Sie müssen angemeldet sein, um Feedback zu senden.')
      return
    }

    setIsSubmitting(true)
    try {
      let imageUrl = null
      if (image) {
        const fileName = `${user.id}/${Date.now()}_${image.name || 'pasted-image.png'}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('feedback')
          .upload(fileName, image)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('feedback').getPublicUrl(uploadData.path)
        imageUrl = publicUrl
      }

      const { error } = await supabase.from('feedback').insert({
        user_id: user.id,
        type,
        message,
        error_details: errorDetails || null,
        url: window.location.href,
        image_url: imageUrl,
        status: 'new',
      })
      if (error) throw error

      toast.success('Vielen Dank für Ihr Feedback!')
      setMessage('')
      setImage(null)
      setImagePreview(null)
      closeFeedback()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Fehler beim Senden des Feedbacks.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <>
      <Button
        onClick={() => openFeedback()}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 p-0"
        title="Fehler melden / Feedback geben"
      >
        <Bug className="h-6 w-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => !open && closeFeedback()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feedback & Fehlerbericht</DialogTitle>
            <DialogDescription>
              Helfen Sie uns, die App zu verbessern. Beschreiben Sie Ihr Problem oder Ihren Verbesserungsvorschlag.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Art des Feedbacks</Label>
              <Select value={type} onValueChange={(v) => v && setType(v)}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Bitte wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Fehler / Bug</SelectItem>
                  <SelectItem value="feature">Verbesserungsvorschlag</SelectItem>
                  <SelectItem value="error">Systemfehler</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Nachricht</Label>
              <Textarea
                id="message"
                placeholder="Was ist passiert? Oder was können wir besser machen?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px]"
                maxLength={5000}
              />
            </div>

            <div className="space-y-2">
              <Label>Screenshot / Bild hinzufügen (optional)</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className="w-full sm:w-auto"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Bild auswählen
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                {image && <span className="text-sm text-slate-500 truncate max-w-[150px]">{image.name}</span>}
              </div>
              <p className="text-[10px] text-slate-400 italic">
                Tipp: Du kannst auch einfach einen Screenshot mit Strg+V (oder Cmd+V) hier einfügen.
              </p>
              {imagePreview && (
                <div className="mt-2 relative">
                  <img src={imagePreview} alt="Preview" className="max-h-40 rounded-md" />
                  <button
                    type="button"
                    onClick={() => { setImage(null); setImagePreview(null) }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {errorDetails && (
              <div className="space-y-2">
                <Label>Technische Fehlerdetails (werden mitgesendet)</Label>
                <div className="bg-slate-100 p-2 rounded-md text-xs font-mono text-slate-600 max-h-24 overflow-y-auto">
                  {errorDetails}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeFeedback} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Wird gesendet...' : 'Senden'}
              {!isSubmitting && <Send className="ml-2 h-4 w-4" />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
