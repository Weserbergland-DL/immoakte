import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function Impressum() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">Impressum</h1>

        <div className="prose prose-stone dark:prose-invert max-w-none space-y-8 text-muted-foreground">

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Angaben gemäß § 5 TMG</h2>
            <p>
              Weserbergland Dienstleistungen<br />
              Inhaber: Özgür Tikiz<br />
              Chamissostraße 23<br />
              31785 Hameln<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Kontakt</h2>
            <p>
              Telefon: +49 5151 7103786<br />
              Mobil: +49 176 84423764<br />
              E-Mail: <a href="mailto:info@weserbergland-dienstleistungen.de" className="text-primary hover:underline">info@weserbergland-dienstleistungen.de</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Umsatzsteuer-ID</h2>
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
              DE322581796
            </p>
            <p className="mt-2">
              Steuernummer: 22/144/16255
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
            <p>
              Özgür Tikiz<br />
              Chamissostraße 23<br />
              31785 Hameln
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p className="mt-2">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Haftungsausschluss</h2>
            <h3 className="font-semibold mt-4 mb-2">Haftung für Inhalte</h3>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.
            </p>
            <h3 className="font-semibold mt-4 mb-2">Haftung für Links</h3>
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
            </p>
            <h3 className="font-semibold mt-4 mb-2">Urheberrecht</h3>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  )
}
