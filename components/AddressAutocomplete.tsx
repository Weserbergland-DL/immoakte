'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MapPin, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AddressData {
  street: string
  houseNumber: string
  zipCode: string
  city: string
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: AddressData) => void
}

export function AddressAutocomplete({ onAddressSelect }: AddressAutocompleteProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query && query.length >= 3) {
        searchAddress(query)
      }
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [query])

  const searchAddress = async (searchTerm: string) => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&addressdetails=1&limit=5&countrycodes=de,at,ch`
      )
      const data = await response.json()
      setSuggestions(data)
      setShowSuggestions(true)
    } catch (error) {
      console.error('Error fetching address:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (item: any) => {
    const address = item.address
    const newData: AddressData = {
      street: address.road || address.pedestrian || address.street || '',
      houseNumber: address.house_number || '',
      zipCode: address.postcode || '',
      city: address.city || address.town || address.village || address.county || '',
    }
    setQuery(item.display_name)
    setShowSuggestions(false)
    onAddressSelect(newData)
  }

  const locateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolokalisierung wird von Ihrem Browser nicht unterstützt')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          )
          const data = await response.json()
          if (data?.address) {
            handleSelect(data)
            toast.success('Standort erfolgreich ermittelt')
          } else {
            toast.error('Standort konnte nicht aufgelöst werden')
          }
        } catch {
          toast.error('Fehler bei der Standortabfrage')
        } finally {
          setLocating(false)
        }
      },
      () => {
        toast.error('Standort konnte nicht abgerufen werden. Bitte Berechtigungen prüfen.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Adresse suchen (z.B. Musterstraße 1, Berlin)..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true) }}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          )}
        </div>
        <Button type="button" variant="outline" onClick={locateMe} disabled={locating} title="Aktuellen Standort verwenden">
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
        </Button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
          <ul className="max-h-60 overflow-auto py-1 text-sm">
            {suggestions.map((item, index) => (
              <li
                key={index}
                className="cursor-pointer px-4 py-2 hover:bg-slate-100"
                onClick={() => handleSelect(item)}
              >
                {item.display_name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
