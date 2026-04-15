import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Datenschutzerklärung</h1>
        <p className="text-muted-foreground text-sm mb-8">Stand: April 2026</p>

        <div className="space-y-8 text-muted-foreground text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Verantwortlicher</h2>
            <p>
              Verantwortlicher im Sinne der DSGVO für die Verarbeitung personenbezogener Daten auf dieser Plattform ist:
            </p>
            <p className="mt-2">
              Weserbergland Dienstleistungen<br />
              Inhaber: Özgür Tikiz<br />
              Chamissostraße 23, 31785 Hameln<br />
              E-Mail: <a href="mailto:info@weserbergland-dienstleistungen.de" className="text-primary hover:underline">info@weserbergland-dienstleistungen.de</a><br />
              Telefon: +49 5151 7103786
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Welche Daten wir verarbeiten</h2>
            <p>Im Rahmen der Nutzung von ImmoAkte verarbeiten wir folgende Kategorien personenbezogener Daten:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Kontodaten:</strong> Name, E-Mail-Adresse</li>
              <li><strong>Protokolldaten:</strong> Namen, Anschriften und Kontaktdaten von Mietern und Vermietern, Adresse der Immobilie</li>
              <li><strong>Dokumentationsdaten:</strong> Raumzustände, Zählerstände, Schlüsselübergaben, Fotos von Mängeln und Zählern</li>
              <li><strong>Unterschriften:</strong> Digitale Signaturen der beteiligten Parteien (als Bilddaten gespeichert)</li>
              <li><strong>Technische Daten:</strong> IP-Adresse, Browser-Typ, Zugriffszeiten (serverseitige Logs)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Rechtsgrundlagen der Verarbeitung</h2>
            <p>Wir verarbeiten personenbezogene Daten auf Basis folgender Rechtsgrundlagen gemäß DSGVO:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Art. 6 Abs. 1 lit. b DSGVO</strong> – Vertragserfüllung: Verarbeitung zur Bereitstellung der gebuchten Leistungen</li>
              <li><strong>Art. 6 Abs. 1 lit. a DSGVO</strong> – Einwilligung: z. B. bei der Registrierung per Google OAuth</li>
              <li><strong>Art. 6 Abs. 1 lit. c DSGVO</strong> – Rechtliche Verpflichtung: z. B. steuerrechtliche Aufbewahrungspflichten</li>
              <li><strong>Art. 6 Abs. 1 lit. f DSGVO</strong> – Berechtigte Interessen: Sicherheit und Missbrauchsschutz der Plattform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Eingesetzte Drittdienstleister</h2>

            <h3 className="font-semibold mt-4 mb-1">Supabase (Datenbank & Authentifizierung)</h3>
            <p>
              Wir nutzen Supabase (Supabase Inc., 970 Trestle Glen Rd, Oakland, CA 94610, USA) zur Speicherung von Nutzer-, Protokoll- und Dokumentdaten sowie zur Authentifizierung. Unsere Datenbank-Instanz ist in der Region <strong>Central EU (Frankfurt am Main)</strong> gehostet – sämtliche Inhaltsdaten verbleiben innerhalb der EU. Mit Supabase haben wir einen Auftragsverarbeitungsvertrag nach Art. 28 DSGVO geschlossen. Datenschutzerklärung: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">supabase.com/privacy</a>
            </p>

            <h3 className="font-semibold mt-4 mb-1">Vercel (Hosting)</h3>
            <p>
              Die Plattform wird bei Vercel Inc. (340 S Lemon Ave #4133, Walnut, CA 91789, USA) gehostet. Unsere Serverless-Funktionen sind auf die Region <strong>Frankfurt am Main (fra1)</strong> festgelegt – Anfragen und deren Verarbeitung erfolgen also innerhalb der EU. Vercel verarbeitet dabei technische Zugriffsdaten (IP-Adresse, Zeitstempel, User-Agent). Mit Vercel haben wir einen Auftragsverarbeitungsvertrag nach Art. 28 DSGVO geschlossen. Datenschutzerklärung: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">vercel.com/legal/privacy-policy</a>
            </p>

            <h3 className="font-semibold mt-4 mb-1">Stripe (Zahlungsabwicklung)</h3>
            <p>
              Zahlungen werden über Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Irland, abgewickelt. Stripe verarbeitet Zahlungsdaten eigenverantwortlich. Wir erhalten nur eine Bestätigung über erfolgreiche Zahlungen. Datenschutzerklärung: <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">stripe.com/de/privacy</a>
            </p>

            <h3 className="font-semibold mt-4 mb-1">Google OAuth (Anmeldung)</h3>
            <p>
              Alternativ zur E-Mail-Registrierung kann die Anmeldung per Google-Konto erfolgen. Dabei werden Name und E-Mail-Adresse von Google übermittelt. Anbieter: Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Datenschutzerklärung: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">policies.google.com/privacy</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Speicherdauer</h2>
            <p>
              Personenbezogene Daten werden nur so lange gespeichert, wie es für den jeweiligen Zweck erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen (z. B. 10 Jahre für steuerrelevante Unterlagen gemäß § 147 AO). Nutzer können ihr Konto jederzeit selbst über ihre Stammdaten dauerhaft löschen; dabei werden alle zugehörigen Mietverhältnisse, Dokumente und Protokolle unwiderruflich entfernt (Art. 17 DSGVO). Server-Logs (Zugriffsprotokolle mit IP und Zeitstempel) werden nach 30 Tagen automatisch verworfen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Ihre Rechte</h2>
            <p>Sie haben gemäß Art. 15–22 DSGVO folgende Rechte:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Auskunft</strong> (Art. 15) – Welche Daten wir über Sie verarbeiten</li>
              <li><strong>Berichtigung</strong> (Art. 16) – Korrektur unrichtiger Daten</li>
              <li><strong>Löschung</strong> (Art. 17) – „Recht auf Vergessenwerden"</li>
              <li><strong>Einschränkung</strong> (Art. 18) – Einschränkung der Verarbeitung</li>
              <li><strong>Datenübertragbarkeit</strong> (Art. 20) – Daten in maschinenlesbarem Format</li>
              <li><strong>Widerspruch</strong> (Art. 21) – Widerspruch gegen Verarbeitung</li>
            </ul>
            <p className="mt-3">
              Zur Ausübung Ihrer Rechte wenden Sie sich an: <a href="mailto:info@weserbergland-dienstleistungen.de" className="text-primary hover:underline">info@weserbergland-dienstleistungen.de</a>
            </p>
            <p className="mt-2">
              Sie haben außerdem das Recht, sich bei der zuständigen Datenschutzaufsichtsbehörde zu beschweren. In Niedersachsen: <a href="https://www.lfd.niedersachsen.de" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.lfd.niedersachsen.de</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Cookies & lokaler Speicher</h2>
            <p>
              ImmoAkte verwendet ausschließlich technisch notwendige Cookies und lokalen Browserspeicher für:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Nutzersitzung</strong> (Supabase-Auth-Cookies): Aufrechterhaltung der Anmeldung</li>
              <li><strong>Theme-Einstellung</strong> (LocalStorage): Hell-/Dunkelmodus-Präferenz</li>
            </ul>
            <p className="mt-3">
              Diese Cookies fallen unter die Ausnahme des § 25 Abs. 2 Nr. 2 TDDDG (unbedingt erforderlich) – eine Einwilligung ist nicht erforderlich. Wir setzen <strong>keine</strong> Tracking-, Analyse- oder Werbe-Cookies ein, insbesondere kein Google Analytics, keine Social-Media-Pixel und keine Drittanbieter-Reichweitenmessung.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Einwilligung bei Registrierung</h2>
            <p>
              Bei der Registrierung wird Ihre ausdrückliche Zustimmung zu unseren AGB und zur Kenntnisnahme dieser Datenschutzerklärung erfasst. Der Zeitpunkt der Zustimmung sowie die akzeptierte Version werden zum Nachweis nach Art. 7 DSGVO in Ihrem Benutzerprofil gespeichert.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Datensicherheit</h2>
            <p>
              Alle Datenübertragungen erfolgen verschlüsselt über HTTPS/TLS. Datenbankzugriffe sind durch Row-Level-Security (RLS) auf Supabase abgesichert – jeder Nutzer sieht ausschließlich eigene Daten. Zahlungsdaten werden nicht auf unseren Servern gespeichert.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  )
}
