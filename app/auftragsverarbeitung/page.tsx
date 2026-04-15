import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function Auftragsverarbeitung() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Vereinbarung zur Auftragsverarbeitung
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Nach Art. 28 DSGVO · Stand: April 2026
        </p>

        <div className="space-y-8 text-muted-foreground text-sm leading-relaxed">

          <section className="rounded-lg border border-brass-300/60 bg-brass-50/50 dark:bg-brass-900/20 p-5">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Wichtig für Sie als Nutzer
            </h2>
            <p>
              Wenn Sie ImmoAkte für die Verarbeitung von Mieterdaten,
              Objektdaten oder anderer personenbezogener Daten Dritter nutzen,
              sind <strong className="text-foreground">Sie</strong> der
              datenschutzrechtlich Verantwortliche im Sinne der DSGVO. ImmoAkte
              (Weserbergland Dienstleistungen) handelt dabei ausschließlich als
              Auftragsverarbeiter.
            </p>
            <p className="mt-3">
              Mit Annahme unserer AGB schließen Sie zugleich diese Vereinbarung
              zur Auftragsverarbeitung ab. Sie erfüllt die Anforderungen des
              Art. 28 DSGVO und ersetzt die Notwendigkeit, einen separaten
              Vertrag zu unterzeichnen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              1. Vertragspartner
            </h2>
            <p>
              <strong className="text-foreground">Auftraggeber (Verantwortlicher):</strong>{' '}
              der registrierte Nutzer (im Folgenden „Kunde").
            </p>
            <p className="mt-2">
              <strong className="text-foreground">Auftragnehmer (Auftragsverarbeiter):</strong>
            </p>
            <p className="mt-2 pl-4 border-l-2 border-border">
              Weserbergland Dienstleistungen<br />
              Inhaber: Özgür Tikiz<br />
              Chamissostraße 23, 31785 Hameln<br />
              E-Mail: info@weserbergland-dienstleistungen.de
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              2. Gegenstand und Dauer
            </h2>
            <p>
              Gegenstand der Auftragsverarbeitung ist die Bereitstellung der
              SaaS-Plattform „ImmoAkte" zur Erstellung und Verwaltung von
              Mietverträgen, Übergabeprotokollen, Wohnungsgeberbestätigungen,
              Kautionsbescheinigungen und zugehörigen Dokumenten. Die
              Vereinbarung gilt für die gesamte Laufzeit des Nutzungsvertrags
              zwischen Kunde und ImmoAkte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              3. Art der verarbeiteten Daten und Kategorien betroffener Personen
            </h2>
            <p>Art der Daten:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Kontaktdaten (Name, Anschrift, E-Mail, Telefon)</li>
              <li>Vertragsdaten (Mietverhältnisse, Konditionen)</li>
              <li>Objektdaten (Adressen, Zimmer, Zustände)</li>
              <li>
                Dokumentationsdaten (Fotos, Zählerstände, Schlüsselübergaben,
                Mängel)
              </li>
              <li>Unterschriften in Form von Bilddaten</li>
            </ul>
            <p className="mt-3">Kategorien betroffener Personen:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Mieterinnen und Mieter</li>
              <li>ggf. Mitbewohner / Haushaltsmitglieder</li>
              <li>ggf. Vermieter / Verwalter Dritter</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              4. Weisungsrecht des Kunden
            </h2>
            <p>
              ImmoAkte verarbeitet personenbezogene Daten ausschließlich im
              Rahmen der getroffenen Vereinbarungen und nach dokumentierten
              Weisungen des Kunden. Der Kunde erteilt seine Weisungen in der
              Regel durch die Nutzung der Plattform (z. B. durch Anlegen eines
              Mietverhältnisses oder Hochladen eines Fotos). Zusätzliche
              Weisungen per E-Mail an{' '}
              <a
                href="mailto:info@weserbergland-dienstleistungen.de"
                className="text-primary hover:underline"
              >
                info@weserbergland-dienstleistungen.de
              </a>{' '}
              sind möglich.
            </p>
            <p className="mt-3">
              Sollte ImmoAkte der Auffassung sein, dass eine Weisung gegen
              datenschutzrechtliche Vorschriften verstößt, wird der Kunde
              unverzüglich darüber informiert (Art. 28 Abs. 3 S. 3 DSGVO).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              5. Vertraulichkeit
            </h2>
            <p>
              ImmoAkte verpflichtet alle mit der Auftragsverarbeitung befassten
              Personen schriftlich zur Vertraulichkeit, sofern sie nicht bereits
              einer angemessenen gesetzlichen Verschwiegenheitspflicht
              unterliegen (Art. 28 Abs. 3 lit. b DSGVO).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              6. Technische und organisatorische Maßnahmen (TOMs)
            </h2>
            <p>
              ImmoAkte trifft die folgenden Maßnahmen nach Art. 32 DSGVO zum
              Schutz der Daten. Details können jederzeit per E-Mail angefordert
              werden:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1.5">
              <li>
                <strong className="text-foreground">Zutrittskontrolle:</strong>{' '}
                Server betrieben durch zertifizierte Dienstleister (Supabase,
                Vercel) in EU-Rechenzentren (Frankfurt am Main). Keine
                physischen Datenträger bei ImmoAkte.
              </li>
              <li>
                <strong className="text-foreground">Zugangskontrolle:</strong>{' '}
                Starke Passwort-Hashing-Verfahren, optional Google-OAuth,
                E-Mail-Verifizierung, Zwei-Faktor-Authentifizierung für
                Administratoren.
              </li>
              <li>
                <strong className="text-foreground">Zugriffskontrolle:</strong>{' '}
                Row-Level-Security (RLS) in der Datenbank — jeder Nutzer sieht
                ausschließlich eigene Daten. Rollenbasiertes
                Berechtigungskonzept.
              </li>
              <li>
                <strong className="text-foreground">Weitergabekontrolle:</strong>{' '}
                Sämtliche Datenübertragungen erfolgen TLS-verschlüsselt (HTTPS,
                min. TLS 1.2).
              </li>
              <li>
                <strong className="text-foreground">Eingabekontrolle:</strong>{' '}
                Änderungen an Datensätzen werden mit Zeitstempel protokolliert.
                Abgeschlossene Dokumente sind unveränderbar.
              </li>
              <li>
                <strong className="text-foreground">Verfügbarkeitskontrolle:</strong>{' '}
                Tägliche Backups durch Supabase, georedundante Speicherung
                innerhalb der EU.
              </li>
              <li>
                <strong className="text-foreground">Trennungskontrolle:</strong>{' '}
                Mandantentrennung auf Datenbank-Ebene durch RLS.
              </li>
              <li>
                <strong className="text-foreground">Datenschutzfreundliche Voreinstellungen:</strong>{' '}
                Keine Tracking- oder Analytics-Tools, keine Werbe-Cookies.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              7. Unterauftragsverarbeiter
            </h2>
            <p>
              ImmoAkte nutzt folgende geprüfte Unterauftragsverarbeiter, die
              ihrerseits eine AVV nach Art. 28 DSGVO mit ImmoAkte geschlossen
              haben:
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-left text-foreground">
                    <th className="py-2 pr-4 font-semibold">Dienstleister</th>
                    <th className="py-2 pr-4 font-semibold">Zweck</th>
                    <th className="py-2 pr-4 font-semibold">Sitz / Region</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2 pr-4 text-foreground/90">Supabase Inc.</td>
                    <td className="py-2 pr-4">Datenbank &amp; Authentifizierung</td>
                    <td className="py-2 pr-4">USA / EU-Server Frankfurt</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-foreground/90">Vercel Inc.</td>
                    <td className="py-2 pr-4">Hosting / Serverless Functions</td>
                    <td className="py-2 pr-4">USA / EU-Server Frankfurt (fra1)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-foreground/90">Stripe Payments Europe Ltd.</td>
                    <td className="py-2 pr-4">Zahlungsabwicklung (Verantwortlicher)</td>
                    <td className="py-2 pr-4">Dublin, Irland</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-foreground/90">Google Ireland Ltd.</td>
                    <td className="py-2 pr-4">Optionale Google-OAuth-Anmeldung</td>
                    <td className="py-2 pr-4">Dublin, Irland</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              Ein Wechsel oder Hinzufügen weiterer Unterauftragsverarbeiter wird
              dem Kunden mindestens 30 Tage vorher per E-Mail angekündigt. Der
              Kunde hat das Recht, innerhalb dieser Frist zu widersprechen; in
              diesem Fall kann der Vertrag außerordentlich gekündigt werden.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              8. Unterstützung bei Betroffenenrechten
            </h2>
            <p>
              ImmoAkte unterstützt den Kunden bei der Bearbeitung von Anfragen
              betroffener Personen (Art. 15-22 DSGVO) durch geeignete
              technische und organisatorische Maßnahmen. Konkret bietet die
              Plattform:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Bearbeitungs- und Löschfunktionen direkt in der Oberfläche</li>
              <li>Datenexport als JSON (Art. 20 DSGVO)</li>
              <li>Komplette Konto-Löschung mit kaskadierender Entfernung aller Inhalte</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              9. Informationspflichten bei Datenpannen
            </h2>
            <p>
              ImmoAkte informiert den Kunden unverzüglich, wenn ihm eine
              Verletzung des Schutzes personenbezogener Daten bekannt wird
              (Art. 33 Abs. 2 DSGVO). Die Benachrichtigung erfolgt per E-Mail
              an die im Profil hinterlegte Adresse und enthält alle gemäß
              Art. 33 Abs. 3 DSGVO erforderlichen Informationen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              10. Löschung und Rückgabe nach Vertragsende
            </h2>
            <p>
              Nach Beendigung des Nutzungsvertrags werden die Daten des Kunden
              binnen 30 Tagen aus den Produktivsystemen entfernt.
              Backup-Systeme werden innerhalb des üblichen Rotationszyklus von
              90 Tagen überschrieben. Bei Self-Service-Kontolöschung erfolgt
              die Produktiv-Löschung sofort; Backup-Restbestände erlöschen
              ebenfalls im Rotationszyklus.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              11. Kontrollrechte des Kunden
            </h2>
            <p>
              Der Kunde hat das Recht, die Einhaltung dieser Vereinbarung durch
              ImmoAkte zu überprüfen. Dies geschieht regelmäßig durch Einsicht
              in diese Vereinbarung und die TOMs. Darüber hinausgehende
              Kontrollen können nach vorheriger Terminabstimmung und zu den
              üblichen Geschäftszeiten vor Ort oder remote durchgeführt werden.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              12. Schlussbestimmungen
            </h2>
            <p>
              Sollten einzelne Bestimmungen dieser Vereinbarung unwirksam sein,
              berührt dies die Wirksamkeit der übrigen Bestimmungen nicht. Es
              gilt deutsches Recht. Gerichtsstand ist Hameln.
            </p>
            <p className="mt-3">
              Diese AVV gilt mit Wirkung zum Datum des Vertragsschlusses über
              die Nutzung von ImmoAkte und ersetzt damit alle vorhergehenden
              Vereinbarungen zur Auftragsverarbeitung zwischen den Parteien.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  )
}
