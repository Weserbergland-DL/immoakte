import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { ConsentControls } from '@/components/CookieConsent'

export const metadata = {
  title: 'Datenschutzerklärung — ImmoAkte',
}

export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Datenschutzerklärung</h1>
        <p className="text-muted-foreground text-sm mb-8">Stand: April 2026</p>

        <div className="space-y-8 text-muted-foreground text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              1. Verantwortlicher
            </h2>
            <p>
              Verantwortlicher im Sinne der DSGVO für diese Anwendung ist:
            </p>
            <p className="mt-2">
              Weserbergland Dienstleistungen<br />
              Inhaber: Özgür Tikiz<br />
              Chamissostraße 23, 31785 Hameln<br />
              E-Mail:{' '}
              <a
                href="mailto:info@weserbergland-dienstleistungen.de"
                className="text-primary hover:underline"
              >
                info@weserbergland-dienstleistungen.de
              </a>
              <br />
              Telefon: +49 5151 7103786
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              2. Wie ImmoAkte funktioniert (Kurzfassung)
            </h2>
            <p>
              ImmoAkte ist eine offene Test-Anwendung für Vermieter. Die App
              speichert <strong>alle inhaltlichen Daten ausschließlich lokal in
              deinem Browser</strong> (im sogenannten <em>localStorage</em>) —
              also Mietverhältnisse, Übergabeprotokolle, Mietverträge,
              Fotos, Unterschriften, Zählerstände und alle Stammdaten, die du
              eingibst.
            </p>
            <p className="mt-2">
              Es gibt <strong>kein Login</strong>, <strong>keine Cloud-Datenbank</strong>,
              <strong> keinen Server</strong>, der deine Inhalte sieht oder
              speichert. Wir können deine Daten weder lesen noch wiederherstellen
              — wenn du den Browser-Speicher löschst, sind sie weg.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              3. Hosting (Vercel)
            </h2>
            <p>
              Die App wird über{' '}
              <strong>Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA</strong>{' '}
              ausgeliefert. Beim Aufruf der Seite werden technisch
              unvermeidbare Server-Logs erfasst (IP-Adresse, User-Agent,
              Zeitstempel, angeforderte URL). Rechtsgrundlage:
              Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am sicheren
              Betrieb der Seite). Mit Vercel besteht ein
              Auftragsverarbeitungsvertrag inkl. EU-Standardvertragsklauseln.
              Datenschutz-Info:{' '}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                vercel.com/legal/privacy-policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              4. Google Analytics 4 (nur mit deiner Einwilligung)
            </h2>
            <p>
              Wir setzen <strong>Google Analytics 4</strong> ein, um zu
              verstehen, welche Funktionen genutzt werden und wo es Probleme
              gibt. Das geschieht <strong>ausschließlich, wenn du im
              Cookie-Banner aktiv zustimmst</strong>. Vor der Zustimmung wird
              kein Google-Skript geladen, kein Cookie gesetzt und kein Request
              an Google gesendet.
            </p>
            <p className="mt-2">
              Anbieter ist <strong>Google Ireland Limited, Gordon House,
              Barrow Street, Dublin 4, Irland</strong>. Daten werden an
              Google-Server (auch in den USA) übertragen. Bei zugestimmter
              Nutzung verarbeitet Google in unserem Auftrag aggregierte
              Nutzungsdaten:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Anonymisierte IP-Adresse (IP-Anonymisierung ist GA4-Default)</li>
              <li>Geräte- und Browser-Typ, Bildschirmgröße, Sprache</li>
              <li>Aufgerufene Seiten + Zeitpunkte</li>
              <li>Cookies wie <code>_ga</code> und <code>_ga_&lt;ID&gt;</code> zur
                Wiedererkennung wiederkehrender Besucher</li>
            </ul>
            <p className="mt-2">
              Wir haben <em>Google Signals</em> und Werbe-Personalisierung
              deaktiviert. Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO sowie
              § 25 Abs. 1 TTDSG (Einwilligung). Mit Google besteht ein
              Auftragsverarbeitungsvertrag mit EU-Standardvertragsklauseln.
              Mehr:{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                policies.google.com/privacy
              </a>
              .
            </p>

            <div className="mt-5">
              <p className="text-foreground font-medium text-sm mb-2">
                Deine Wahl jederzeit ändern
              </p>
              <ConsentControls />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              5. Speicherdauer
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Inhalte (Mietverhältnisse, Protokolle, Dokumente):</strong>{' '}
                bleiben so lange im Browser, bis du sie löschst oder den
                Browser-Speicher leerst.
              </li>
              <li>
                <strong>GA4-Daten:</strong> 14 Monate (Google-Default).
              </li>
              <li>
                <strong>Server-Logs (Vercel):</strong> bis zu 30 Tage.
              </li>
              <li>
                <strong>Consent-Wahl:</strong> bis du sie über die Schaltfläche
                oben oder per Browser-Daten-Löschen zurücksetzt.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              6. Deine Rechte
            </h2>
            <p>Nach DSGVO hast du jederzeit folgende Rechte:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Auskunft (Art. 15)</li>
              <li>Berichtigung (Art. 16)</li>
              <li>Löschung (Art. 17)</li>
              <li>Einschränkung der Verarbeitung (Art. 18)</li>
              <li>Datenübertragbarkeit (Art. 20)</li>
              <li>Widerspruch (Art. 21)</li>
              <li>Widerruf einer erteilten Einwilligung (Art. 7 Abs. 3) — z.&nbsp;B.
                  über die Schaltfläche oben</li>
              <li>
                Beschwerde bei einer Aufsichtsbehörde (Art. 77) — zuständig:{' '}
                <a
                  href="https://www.lfd.niedersachsen.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Landesbeauftragte für den Datenschutz Niedersachsen
                </a>
              </li>
            </ul>
            <p className="mt-2">
              Da deine Inhaltsdaten ausschließlich im eigenen Browser liegen,
              kannst du Auskunft und Löschung selbst herstellen — über den
              Datenexport im Dashboard und die Funktion „Lokale Daten
              zurücksetzen".
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              7. Keine automatisierte Entscheidung, kein Profiling
            </h2>
            <p>
              Es findet keine automatisierte Entscheidungsfindung im Sinne von
              Art. 22 DSGVO statt. Inhalte werden nicht ausgewertet, nicht an
              Dritte weitergegeben und nicht für Werbung genutzt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              8. Änderungen dieser Erklärung
            </h2>
            <p>
              Wir passen diese Datenschutzerklärung an, wenn sich die
              technischen Gegebenheiten oder die Rechtslage ändern. Die jeweils
              aktuelle Version findest du immer auf dieser Seite.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
