'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/75 backdrop-blur-xl border-b border-border/60 shadow-sm'
          : 'bg-transparent border-b border-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="shrink-0 -ml-0.5" aria-label="ImmoAkte Startseite">
          <Logo size={26} />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle compact className="hidden sm:inline-flex" />
          <Link href="/dashboard" className="ml-1">
            <Button size="sm">Dashboard</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
