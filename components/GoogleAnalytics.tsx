'use client'

/**
 * Google Analytics 4 — consent-gated.
 *
 * Lädt `gtag.js` nur, wenn der Nutzer im Cookie-Banner aktiv zugestimmt hat
 * UND ein `NEXT_PUBLIC_GA_ID` (z.B. `G-XXXXXXXXXX`) gesetzt ist.
 *
 * Without consent → keine Script-Tags, keine Cookies, keine Requests.
 * Wir nutzen Next.js' `<Script strategy="afterInteractive">`, damit GA das
 * First Paint nicht blockiert.
 */

import Script from 'next/script'

interface Props {
  measurementId: string
}

export function GoogleAnalytics({ measurementId }: Props) {
  if (!measurementId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          // anonymize_ip ist seit GA4 Default — hier nur defensiv.
          gtag('config', '${measurementId}', {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
          });
        `}
      </Script>
    </>
  )
}
