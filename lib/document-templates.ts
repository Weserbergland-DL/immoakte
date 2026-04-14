// Default document templates with {{placeholders}}
// Placeholders: {{vermieter_name}}, {{vermieter_firma}}, {{vermieter_adresse}},
// {{vermieter_strasse}}, {{vermieter_plz_ort}}, {{vermieter_telefon}}, {{vermieter_email}},
// {{vermieter_iban}}, {{vermieter_bank}},
// {{mieter_anrede}}, {{mieter_vorname}}, {{mieter_nachname}}, {{mieter_name}},
// {{adresse}}, {{strasse}}, {{plz_ort}}, {{einzugsdatum}}, {{datum_heute}},
// {{kaltmiete}}, {{kaution}}, {{mietbeginn}}

export const PLACEHOLDER_LABELS: Record<string, string> = {
  '{{vermieter_name}}':     'Vermieter Name',
  '{{vermieter_firma}}':    'Vermieter Firma',
  '{{vermieter_adresse}}':  'Vermieter Adresse',
  '{{vermieter_strasse}}':  'Vermieter Straße + Nr.',
  '{{vermieter_plz_ort}}':  'Vermieter PLZ + Ort',
  '{{vermieter_telefon}}':  'Vermieter Telefon',
  '{{vermieter_email}}':    'Vermieter E-Mail',
  '{{vermieter_iban}}':     'Vermieter IBAN',
  '{{vermieter_bank}}':     'Vermieter Bank',
  '{{mieter_anrede}}':      'Mieter Anrede',
  '{{mieter_vorname}}':     'Mieter Vorname',
  '{{mieter_nachname}}':    'Mieter Nachname',
  '{{mieter_name}}':        'Mieter vollständiger Name',
  '{{mieter_adresse}}':     'Mieter aktuelle Adresse',
  '{{mieter_strasse}}':     'Mieter Straße + Nr.',
  '{{mieter_plz_ort}}':     'Mieter PLZ + Ort',
  '{{adresse}}':            'Wohnungs-Adresse',
  '{{strasse}}':            'Straße + Hausnummer',
  '{{plz_ort}}':            'PLZ + Ort',
  '{{einzugsdatum}}':       'Einzugsdatum',
  '{{datum_heute}}':        'Heutiges Datum',
  '{{kaltmiete}}':          'Kaltmiete (€)',
  '{{kaution}}':            'Kautionsbetrag (€)',
  '{{mietbeginn}}':         'Mietbeginn',
}

export function fillPlaceholders(content: string, data: Record<string, string>): string {
  let result = content
  Object.entries(data).forEach(([key, value]) => {
    result = result.replaceAll(key, value || key)
  })
  return result
}

export const DEFAULT_TEMPLATES = {
  wohnungsgeberbestaetigung: {
    name: 'Wohnungsgeberbestätigung',
    type: 'wohnungsgeberbestaetigung' as const,
    content: `<h1>Wohnungsgeberbestätigung</h1>
<p>gemäß § 19 Bundesmeldegesetz (BMG)</p>
<hr>
<h2>Wohnungsgeber</h2>
<p><strong>Name:</strong> {{vermieter_name}}<br>
<strong>Firma:</strong> {{vermieter_firma}}<br>
<strong>Adresse:</strong> {{vermieter_adresse}}<br>
<strong>Telefon:</strong> {{vermieter_telefon}}</p>

<h2>Mietobjekt</h2>
<p><strong>Adresse:</strong> {{adresse}}</p>

<h2>Bestätigung</h2>
<p>Hiermit bestätige ich, dass folgende Person(en) am <strong>{{einzugsdatum}}</strong> in die oben genannte Wohnung eingezogen ist/sind:</p>

<p><strong>{{mieter_anrede}} {{mieter_vorname}} {{mieter_nachname}}</strong></p>

<p>Diese Bestätigung wird zum Zweck der An- bzw. Ummeldung beim zuständigen Einwohnermeldeamt ausgestellt.</p>

<hr>
<p>Ort, Datum: _________________________, {{datum_heute}}</p>
<br>
<p>_________________________________<br>
Unterschrift Wohnungsgeber<br>
{{vermieter_name}}</p>`,
  },

  kautionsbescheinigung: {
    name: 'Kautionsbescheinigung',
    type: 'kautionsbescheinigung' as const,
    content: `<h1>Bescheinigung über die Anlage der Mietkaution</h1>
<hr>
<p>Hiermit bestätige ich, <strong>{{vermieter_name}}</strong> ({{vermieter_firma}}), wohnhaft {{vermieter_adresse}}, als Vermieter der Wohnung</p>
<p><strong>{{adresse}}</strong></p>
<p>dass die von <strong>{{mieter_anrede}} {{mieter_vorname}} {{mieter_nachname}}</strong> geleistete Mietkaution in Höhe von</p>
<p style="text-align: center;"><strong>{{kaution}} Euro</strong></p>
<p>gemäß § 551 BGB insolvenzsicher und getrennt vom Vermögen des Vermieters angelegt wurde.</p>
<p>Die Kaution wurde angelegt als:</p>
<p>☐ Sparbuch auf den Namen des Mieters<br>
☐ Mietkautionskonto<br>
☐ Sonstige insolvenzsichere Anlage: ________________________</p>
<p>Kontonummer / IBAN: _________________________________</p>
<p>Kreditinstitut: _________________________________</p>
<hr>
<p>Ort, Datum: _________________________, {{datum_heute}}</p>
<br>
<p>_________________________________<br>
Unterschrift Vermieter<br>
{{vermieter_name}}</p>`,
  },

  mietvertrag: {
    name: 'Mietvertrag (Vorlage)',
    type: 'mietvertrag' as const,
    content: `<h1>Mietvertrag</h1>
<p><em>⚠️ Hinweis: Dies ist eine vereinfachte Vorlage. Bitte lassen Sie diesen Vertrag vor der Unterzeichnung rechtlich prüfen.</em></p>
<hr>

<h2>§ 1 Vertragsparteien</h2>
<p><strong>Vermieter:</strong><br>
{{vermieter_name}}<br>
{{vermieter_firma}}<br>
{{vermieter_adresse}}<br>
Telefon: {{vermieter_telefon}}<br>
E-Mail: {{vermieter_email}}</p>
<p><strong>Mieter:</strong><br>
{{mieter_anrede}} {{mieter_vorname}} {{mieter_nachname}}<br>
{{mieter_adresse}}</p>

<h2>§ 2 Mietobjekt</h2>
<p>Vermietet wird die Wohnung in: <strong>{{adresse}}</strong></p>

<h2>§ 3 Mietdauer</h2>
<p>Das Mietverhältnis beginnt am <strong>{{mietbeginn}}</strong> und wird auf unbestimmte Zeit geschlossen.</p>

<h2>§ 4 Miete und Zahlungsmodalitäten</h2>
<p>Die monatliche Kaltmiete beträgt: <strong>{{kaltmiete}} Euro</strong><br>
Zuzüglich Betriebskostenvorauszahlung: ________ Euro<br>
<strong>Gesamtmiete: ________ Euro</strong></p>
<p>Die Miete ist monatlich im Voraus, spätestens am 3. Werktag eines jeden Monats zu überweisen auf:</p>
<p>Kontoinhaber: {{vermieter_name}}<br>
IBAN: {{vermieter_iban}}<br>
Bank: {{vermieter_bank}}</p>

<h2>§ 5 Kaution</h2>
<p>Der Mieter hinterlegt eine Kaution von <strong>{{kaution}} Euro</strong>. Die Kaution ist zu Beginn des Mietverhältnisses zu zahlen auf:</p>
<p>Kontoinhaber: {{vermieter_name}}<br>
IBAN: {{vermieter_iban}}<br>
Bank: {{vermieter_bank}}</p>

<h2>§ 6 Schönheitsreparaturen</h2>
<p>Der Mieter ist nicht verpflichtet, während der Mietzeit Schönheitsreparaturen durchzuführen.</p>

<h2>§ 7 Kündigung</h2>
<p>Das Mietverhältnis kann von beiden Seiten mit einer Frist von 3 Monaten zum Monatsende gekündigt werden.</p>

<h2>§ 8 Hausordnung</h2>
<p>Der Mieter verpflichtet sich, die beigefügte Hausordnung einzuhalten.</p>

<h2>§ 9 Sonstiges</h2>
<p>_________________________________________________</p>
<p>_________________________________________________</p>

<hr>
<p>Ort, Datum: _________________________, {{datum_heute}}</p>
<br>
<p>_________________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_________________________________<br>
Unterschrift Vermieter&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Unterschrift Mieter<br>
{{vermieter_name}}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{mieter_name}}</p>`,
  },
}
