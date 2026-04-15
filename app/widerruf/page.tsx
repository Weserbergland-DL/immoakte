import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'

export default function Widerruf() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Widerrufsbelehrung</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Nur für Verbraucher im Sinne des § 13 BGB · Stand: April 2026
        </p>

        <div className="space-y-8 text-muted-foreground text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Widerrufsrecht</h2>
            <p>
              Sind Sie Verbraucher im Sinne des § 13 BGB (d. h. Sie schließen den
              Vertrag zu Zwecken ab, die überwiegend weder Ihrer gewerblichen noch
              Ihrer selbstständigen beruflichen Tätigkeit zugerechnet werden können),
              steht Ihnen bei Abschluss eines kostenpflichtigen Tarifs ein
              gesetzliches Widerrufsrecht zu.
            </p>
            <p className="mt-3">
              Sie haben das Recht, binnen <strong className="text-foreground">vierzehn Tagen</strong>{' '}
              ohne Angabe von Gründen diesen Vertrag zu widerrufen.
            </p>
            <p className="mt-3">
              Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.
            </p>
            <p className="mt-3">
              Um Ihr Widerrufsrecht auszuüben, müssen Sie uns
            </p>
            <p className="mt-2 pl-4 border-l-2 border-border">
              Weserbergland Dienstleistungen<br />
              Inhaber: Özgür Tikiz<br />
              Chamissostraße 23, 31785 Hameln<br />
              E-Mail: <a href="mailto:info@weserbergland-dienstleistungen.de" className="text-primary hover:underline">info@weserbergland-dienstleistungen.de</a><br />
              Telefon: +49 5151 7103786
            </p>
            <p className="mt-3">
              mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter
              Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu
              widerrufen, informieren. Sie können dafür das unten stehende
              Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.
            </p>
            <p className="mt-3">
              Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung
              über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist
              absenden.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Folgen des Widerrufs</h2>
            <p>
              Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die
              wir von Ihnen erhalten haben, unverzüglich und spätestens binnen
              vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über
              Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese
              Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der
              ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen
              wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden
              Ihnen wegen dieser Rückzahlung Entgelte berechnet.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Vorzeitiges Erlöschen des Widerrufsrechts
            </h2>
            <p>
              Das Widerrufsrecht erlischt bei Verträgen zur Lieferung von nicht auf
              einem körperlichen Datenträger befindlichen digitalen Inhalten
              (z. B. Freischaltung eines Online-Zugangs) gemäß § 356 Abs. 5 BGB
              vorzeitig, wenn
            </p>
            <ol className="list-decimal pl-5 mt-2 space-y-1">
              <li>wir mit der Ausführung des Vertrags begonnen haben,</li>
              <li>
                Sie ausdrücklich zugestimmt haben, dass wir mit der Ausführung des
                Vertrags vor Ablauf der Widerrufsfrist beginnen, und
              </li>
              <li>
                Sie Ihre Kenntnis davon bestätigt haben, dass Sie durch Ihre
                Zustimmung mit Beginn der Ausführung des Vertrags Ihr Widerrufsrecht
                verlieren.
              </li>
            </ol>
            <p className="mt-3">
              Diese Zustimmung und Kenntnisnahme holen wir von Ihnen im
              Checkout-Prozess explizit ein, bevor Sie einen kostenpflichtigen Tarif
              abschließen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Muster-Widerrufsformular
            </h2>
            <p className="mb-3 italic">
              (Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses
              Formular aus und senden es zurück.)
            </p>
            <div className="bg-muted/40 border border-border rounded-lg p-5 text-foreground/90 font-mono text-xs leading-relaxed whitespace-pre-wrap">
{`An:
Weserbergland Dienstleistungen
Inhaber: Özgür Tikiz
Chamissostraße 23
31785 Hameln
E-Mail: info@weserbergland-dienstleistungen.de

Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen
Vertrag über die Erbringung der folgenden Dienstleistung:

________________________________________________________________
(Tarifname, z. B. ImmoAkte Standard / Pro / Flex)

Bestellt am (*) / erhalten am (*): ______________________________

Name des/der Verbraucher(s): ____________________________________

Anschrift des/der Verbraucher(s): _______________________________

________________________________________________________________

Unterschrift des/der Verbraucher(s)        Datum
(nur bei Mitteilung auf Papier)

________________________________________________________________

(*) Unzutreffendes streichen.`}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Zurück zur Übersicht
            </h2>
            <p>
              Zurück zu unseren <Link href="/agb" className="text-primary hover:underline">AGB</Link>
              {' '}oder zur{' '}
              <Link href="/datenschutz" className="text-primary hover:underline">Datenschutzerklärung</Link>.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  )
}
