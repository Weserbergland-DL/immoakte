'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Bug, AlertTriangle, Lightbulb, CheckCircle2, Clock, Copy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { toast } from 'sonner'

interface Feedback {
  id: string
  type: 'bug' | 'feature' | 'error'
  message: string
  error_details?: string
  status: 'new' | 'resolved'
  created_at: string
  url?: string
  image_url?: string
}

export default function FeedbackList() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchFeedbacks = async () => {
      let query = supabase.from('feedback').select('*').order('created_at', { ascending: false })
      if (!isAdmin) {
        query = query.eq('user_id', user.id)
      }
      const { data, error } = await query
      if (error) console.error(error)
      else setFeedbacks((data || []) as Feedback[])
      setLoading(false)
    }

    fetchFeedbacks()
  }, [user, isAdmin])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="h-5 w-5 text-orange-500" />
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'feature': return <Lightbulb className="h-5 w-5 text-blue-500" />
      default: return <Bug className="h-5 w-5 text-slate-500" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bug': return 'Fehler / Bug'
      case 'error': return 'Systemfehler'
      case 'feature': return 'Verbesserungsvorschlag'
      default: return type
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    if (!isAdmin) return
    const newStatus = currentStatus === 'resolved' ? 'new' : 'resolved'
    const { error } = await supabase.from('feedback').update({ status: newStatus }).eq('id', id)
    if (!error) setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, status: newStatus as 'new' | 'resolved' } : f))
  }

  const copyToClipboard = (item: Feedback) => {
    const textToCopy = `Typ: ${getTypeLabel(item.type)}
Datum: ${item.created_at ? format(new Date(item.created_at), 'dd.MM.yyyy HH:mm', { locale: de }) : 'Unbekannt'}
URL: ${item.url || 'Unbekannt'}

Nachricht:
${item.message}

Fehlerdetails:
${item.error_details || 'Keine Details'}`

    navigator.clipboard.writeText(textToCopy).then(() => {
      toast.success('In die Zwischenablage kopiert')
    }).catch(() => {
      toast.error('Kopieren fehlgeschlagen')
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Feedback &amp; Fehler</h1>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Lade Einträge...</div>
        ) : feedbacks.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-12 text-slate-500">
              <CheckCircle2 className="h-12 w-12 mb-4 text-green-500 opacity-50" />
              <p>Keine Fehler oder Feedbacks vorhanden.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="bg-slate-50 border-b py-3 px-4 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(item.type)}
                    <CardTitle className="text-base font-medium">{getTypeLabel(item.type)}</CardTitle>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {item.created_at ? format(new Date(item.created_at), 'dd.MM.yyyy HH:mm', { locale: de }) : 'Unbekannt'}
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.status === 'resolved' ? 'Erledigt' : 'Neu'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-slate-700 whitespace-pre-wrap">{item.message}</p>

                  {item.image_url && (
                    <div className="mt-4">
                      <a href={item.image_url} target="_blank" rel="noopener noreferrer" className="block group relative">
                        <img src={item.image_url} alt="Feedback Screenshot" className="max-h-[300px] rounded-md border object-contain bg-slate-100" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                          <span className="bg-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">Bild in neuem Tab öffnen</span>
                        </div>
                      </a>
                    </div>
                  )}

                  {item.error_details && (
                    <div className="mt-4 p-3 bg-slate-900 rounded-md overflow-x-auto relative group">
                      <Button variant="secondary" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(item)} title="Kopieren">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap pr-8">{item.error_details}</p>
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    {item.url ? (
                      <div className="text-xs text-slate-500">
                        Aufgetreten auf: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">{item.url}</span>
                      </div>
                    ) : <div />}
                    <div className="flex items-center gap-2">
                      {!item.error_details && (
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => copyToClipboard(item)}>
                          <Copy className="h-3.5 w-3.5 mr-1.5" />
                          Kopieren
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          variant={item.status === 'resolved' ? "outline" : "default"}
                          size="sm"
                          className={`h-8 text-xs ${item.status === 'resolved' ? '' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                          onClick={() => toggleStatus(item.id, item.status)}
                        >
                          {item.status === 'resolved' ? 'Wieder öffnen' : (
                            <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Als erledigt markieren</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
