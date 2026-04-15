// ─── Sections-v1 types & helpers ──────────────────────────────────────────────

export interface ContractSection {
  id: string
  title: string
  content: string
}

export interface SectionsContent {
  format: 'sections-v1'
  header: {
    vermieterName: string
    vermieterFirma: string
    vermieterAdresse: string
    vermieterTelefon: string
    vermieterEmail: string
    mieterAnrede: string
    mieterName: string
    mieterAdresse: string
    datum: string
  }
  sections: ContractSection[]
  /** Optional footer data — both fields may be empty; display falls back to
   *  a blank underline so the contract can be signed by hand. */
  footer?: {
    ort?: string
    datum?: string
  }
}

export function isSectionsContent(content: string): boolean {
  try {
    const p = JSON.parse(content)
    return p?.format === 'sections-v1'
  } catch { return false }
}

export function parseSectionsContent(content: string): SectionsContent {
  return JSON.parse(content) as SectionsContent
}

/**
 * Strip any leading "§ N" prefix from a section title so the stored title only
 * holds the semantic label (e.g. "Mietobjekt"). §-numbering is computed from
 * position at render time — never persisted.
 * Handles: "§ 1 Mietobjekt", "§1  Foo", "§ 10\u00a0Bar" and plain "Foo".
 */
export function stripSectionNumber(title: string): string {
  return title.replace(/^\s*§\s*\d+[\s\u00a0]+/u, '').trim()
}

/** Build display title from a clean label + position index (0-based). */
export function buildSectionTitle(label: string, index: number): string {
  return `§ ${index + 1}\u00a0\u00a0${stripSectionNumber(label)}`
}

/** A blank underline used when optional Ort/Datum footer fields are empty. */
function blankLine(minWidth: string): string {
  return `<span style="display:inline-block;border-bottom:1px solid #222;min-width:${minWidth};height:1em;vertical-align:baseline;"></span>`
}

/** Pull the first top-level block element off an HTML string, so it can be
 *  grouped with the section title in a "keep-together" wrapper. Falls back to
 *  the full content if no top-level block tag is found. */
function splitFirstBlock(html: string): { first: string; rest: string } {
  const m = html.match(/^\s*<(p|table|ul|ol|h[1-6]|blockquote|figure|div)\b[^>]*>[\s\S]*?<\/\1>/i)
  if (!m) return { first: html, rest: '' }
  return { first: m[0], rest: html.slice(m[0].length) }
}

/** Convert sections JSON → full HTML string (for PDF and signing).
 *  Every §-card is wrapped in a uniform shell so spacing is identical between
 *  sections regardless of what the user typed in the rich-text editor. */
export function sectionsToHtml(parsed: SectionsContent): string {
  const h = parsed.header
  const headerHtml = `
<section class="contract-header">
<h1 class="contract-title">Mietvertrag über Wohnraum</h1>
<p class="contract-party-label">Zwischen</p>
<div class="contract-party">
<p><strong>${h.vermieterName}</strong>${h.vermieterFirma ? `, ${h.vermieterFirma}` : ''}</p>
${h.vermieterAdresse ? `<p>${h.vermieterAdresse}</p>` : ''}
${(h.vermieterTelefon || h.vermieterEmail) ? `<p class="contract-party-meta">${[h.vermieterTelefon ? `Tel: ${h.vermieterTelefon}` : '', h.vermieterEmail ? `E-Mail: ${h.vermieterEmail}` : ''].filter(Boolean).join(' &nbsp;·&nbsp; ')}</p>` : ''}
</div>
<p class="contract-party-tag">— nachstehend „Vermieter" genannt —</p>
<p class="contract-party-label">und</p>
<div class="contract-party">
<p><strong>${h.mieterAnrede ? h.mieterAnrede + ' ' : ''}${h.mieterName}</strong></p>
${h.mieterAdresse ? `<p>${h.mieterAdresse}</p>` : ''}
</div>
<p class="contract-party-tag">— nachstehend „Mieter" genannt —</p>
<p class="contract-intro">wird folgender Mietvertrag geschlossen:</p>
</section>`

  const sectionsHtml = parsed.sections.map((s, i) => {
    // Title + first paragraph form a "keep-together" head so a heading is never
    // orphaned at the bottom of a page. Subsequent paragraphs may flow naturally.
    const { first, rest } = splitFirstBlock(s.content)
    return `
<section class="contract-section">
<div class="contract-section-head">
<h2 class="contract-section-title">${buildSectionTitle(s.title, i)}</h2>
<div class="contract-section-body">
${first}
</div>
</div>${rest ? `
<div class="contract-section-body">
${rest}
</div>` : ''}
</section>`
  }).join('\n')

  const ort = parsed.footer?.ort?.trim() ?? ''
  const datum = (parsed.footer?.datum ?? h.datum ?? '').trim()

  const footerHtml = `
<section class="contract-footer">
<p class="contract-date-line">Ort, Datum:&nbsp;&nbsp;${ort ? `<strong>${ort}</strong>` : blankLine('10rem')}<span class="contract-date-sep">,</span>&nbsp;${datum ? `<strong>${datum}</strong>` : blankLine('6rem')}</p>
<table class="contract-signatures"><tbody><tr>
<td class="contract-signature-cell">
<div data-signature="vermieter" class="contract-signature-pad"></div>
<div class="contract-signature-line">
<p class="contract-signature-role">Vermieter</p>
<p class="contract-signature-name">${h.vermieterName}</p>
</div>
</td>
<td class="contract-signature-cell">
<div data-signature="mieter" class="contract-signature-pad"></div>
<div class="contract-signature-line">
<p class="contract-signature-role">Mieter</p>
<p class="contract-signature-name">${h.mieterAnrede ? h.mieterAnrede + ' ' : ''}${h.mieterName}</p>
</div>
</td>
</tr></tbody></table>
</section>`

  return headerHtml + '\n' + sectionsHtml + '\n' + footerHtml
}

// Titles are CLEAN labels only (no "§ N" prefix) — numbering is computed from
// position at render time, so drag&drop reorders update §-numbers automatically.
export const DEFAULT_MIETVERTRAG_SECTIONS: Omit<ContractSection, 'id'>[] = [
  {
    title: 'Mietobjekt',
    content: `<p>Vermietet wird die Wohnung in:</p>
<p style="margin-left:24px;"><strong>{{adresse}}</strong>{{lage_block}}</p>
<p>Die Wohnung besteht aus <strong>{{zimmer}} Zimmern</strong> mit einer Wohnfläche von ca. <strong>{{wohnflaeche}} m²</strong>, nebst Küche, Bad/WC, Flur sowie den mitvermieteten Nebenräumen.</p>`,
  },
  {
    title: 'Mietzeit',
    content: `<p>Das Mietverhältnis beginnt am <strong>{{mietbeginn}}</strong>{{vertragsdauer_block}}</p>`,
  },
  {
    title: 'Miete und Nebenkosten',
    content: `<table style="width:100%;border-collapse:collapse;margin:12px 0;">
<tbody>
<tr><td style="padding:6px 0;">Grundmiete (kalt)</td><td style="padding:6px 0;text-align:right;"><strong>{{kaltmiete}} €</strong></td></tr>
<tr><td style="padding:6px 0;">Vorauszahlung für Betriebs- und Heizkosten</td><td style="padding:6px 0;text-align:right;"><strong>{{nebenkosten}} €</strong></td></tr>
<tr><td style="padding:6px 0;border-top:1px solid #E6E6E6;"><strong>Gesamtmiete monatlich</strong></td><td style="padding:6px 0;text-align:right;border-top:1px solid #E6E6E6;"><strong>{{gesamtmiete}} €</strong></td></tr>
</tbody></table>
<p>Die Miete ist monatlich im Voraus, spätestens am <strong>{{faelligkeitstag}}. Werktag</strong> eines jeden Monats, kostenfrei für den Vermieter auf folgendes Konto zu zahlen:</p>
<p style="margin-left:24px;">Kontoinhaber: <strong>{{vermieter_name}}</strong><br>IBAN: {{vermieter_iban}}<br>Bank: {{vermieter_bank}}</p>
<p>Die Betriebskostenvorauszahlung wird jährlich abgerechnet (§§ 556 ff. BGB).</p>`,
  },
  {
    title: 'Kaution',
    content: `<p>Der Mieter leistet zur Sicherung aller Ansprüche des Vermieters eine Barkaution in Höhe von <strong>{{kaution}} €</strong>.</p>
<p>Die Kaution ist gemäß § 551 BGB in drei gleichen Raten zulässig; die erste Rate wird zu Mietbeginn fällig. Der Vermieter legt die Kaution insolvenzsicher und getrennt von seinem Vermögen zu einem für Spareinlagen üblichen Zinssatz an. Zinsen stehen dem Mieter zu.</p>`,
  },
  {
    title: 'Übergabe und Zustand der Mietsache',
    content: `<p>Die Wohnung wird im beiderseits besichtigten Zustand übergeben. Über den Zustand zum Zeitpunkt der Übergabe wird ein gesondertes <strong>Übergabeprotokoll</strong> angefertigt, das Bestandteil dieses Vertrages ist.</p>`,
  },
  {
    title: 'Nutzung der Mietsache',
    content: `<p>(1) Die Wohnung darf ausschließlich zu Wohnzwecken genutzt werden. Eine gewerbliche oder freiberufliche Nutzung bedarf der schriftlichen Zustimmung des Vermieters.</p>
<p>(2) Die Untervermietung oder sonstige Gebrauchsüberlassung an Dritte bedarf der vorherigen schriftlichen Zustimmung des Vermieters. Auf § 553 BGB wird hingewiesen.</p>
<p>(3) Die Tierhaltung richtet sich nach den gesetzlichen Bestimmungen; die Haltung größerer Tiere (insb. Hunde, Katzen) bedarf der schriftlichen Zustimmung des Vermieters.</p>`,
  },
  {
    title: 'Instandhaltung, Schönheitsreparaturen',
    content: `<p>(1) Der Mieter verpflichtet sich, die Mietsache pfleglich zu behandeln und kleine Instandhaltungen bis zu einer Höhe von 100 € je Einzelfall, höchstens jedoch 8 % der Jahreskaltmiete, zu übernehmen.</p>
<p>(2) Schönheitsreparaturen während der Mietzeit werden nicht übertragen. Maßgeblich ist die aktuelle Rechtsprechung des BGH.</p>`,
  },
  {
    title: 'Kündigung',
    content: `<p>(1) Das Mietverhältnis kann unter Einhaltung der gesetzlichen Kündigungsfristen (§ 573c BGB) ordentlich gekündigt werden. Für den Mieter beträgt die Kündigungsfrist <strong>{{kuendigungsfrist}}</strong>.</p>
<p>(2) Die Kündigung bedarf der Schriftform.</p>
<p>(3) Das Recht zur außerordentlichen Kündigung bleibt unberührt.</p>`,
  },
  {
    title: 'Hausordnung',
    content: `<p>Der Mieter verpflichtet sich, die Hausordnung einzuhalten, soweit sie diesem Vertrag beigefügt oder im Hause ausgehängt ist. Rücksichtnahme auf Mitbewohner, insbesondere während der gesetzlichen Ruhezeiten, ist selbstverständlich.</p>`,
  },
  {
    title: 'Sonstige Vereinbarungen',
    content: `<p style="color:#888;"><em>Platz für individuelle Abreden:</em></p>
<p>_________________________________________________________________</p>
<p>_________________________________________________________________</p>`,
  },
  {
    title: 'Schlussbestimmungen',
    content: `<p>(1) Mündliche Nebenabreden wurden nicht getroffen. Änderungen und Ergänzungen dieses Vertrages bedürfen der Schriftform.</p>
<p>(2) Sollte eine Bestimmung dieses Vertrages ganz oder teilweise unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.</p>
<p>(3) Gerichtsstand ist der Sitz der Mietsache.</p>`,
  },
]

// ─── Default document templates with {{placeholders}} ─────────────────────────
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
  '{{nebenkosten}}':        'Nebenkosten (€)',
  '{{gesamtmiete}}':        'Gesamtmiete (€)',
  '{{kaution}}':            'Kautionsbetrag (€)',
  '{{mietbeginn}}':         'Mietbeginn',
  '{{wohnflaeche}}':        'Wohnfläche (m²)',
  '{{zimmer}}':             'Anzahl Zimmer',
  '{{stockwerk}}':          'Stockwerk / Lage',
  '{{vertragsart}}':        'Vertragsart',
  '{{vertragsende}}':       'Vertragsende',
  '{{kuendigungsfrist}}':   'Kündigungsfrist',
  '{{faelligkeitstag}}':    'Fälligkeitstag Miete',
}

/** Replace {{placeholders}} with values. For empty values we render either an
 *  empty string (for structural *_block placeholders that are designed to be
 *  optional full sentences) or a short underline — so the printed document has
 *  a proper blank to sign instead of raw "{{mietbeginn}}" text. */
export function fillPlaceholders(content: string, data: Record<string, string>): string {
  let result = content
  const blankInline = '<span style="display:inline-block;border-bottom:1px solid #222;min-width:4rem;height:1em;vertical-align:baseline;"></span>'
  Object.entries(data).forEach(([key, value]) => {
    if (value) {
      result = result.replaceAll(key, value)
    } else if (/_block\}\}$/.test(key)) {
      // Structural sentence fragment — empty is intentional (e.g. befristet/unbefristet block)
      result = result.replaceAll(key, '')
    } else {
      // Value field left unset — show a blank line the user can fill by hand
      result = result.replaceAll(key, blankInline)
    }
  })
  return result
}

export const DEFAULT_TEMPLATES: Record<string, { name: string; type: string; content: string }> = {
  sonstiges: {
    name: 'Neues Dokument',
    type: 'sonstiges',
    content: `<h1>Neues Dokument</h1>
<p>Erstellt am {{datum_heute}}</p>
<hr>
<p>Mietobjekt: {{adresse}}</p>
<p>Mieter: {{mieter_name}}</p>
<hr>
<p></p>`,
  },

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
<p>Hiermit bestätige ich, dass folgende Person am <strong>{{einzugsdatum}}</strong> in die oben genannte Wohnung eingezogen ist:</p>

<p><strong>{{mieter_anrede}} {{mieter_vorname}} {{mieter_nachname}}</strong></p>

<p>Diese Bestätigung wird zum Zweck der An- bzw. Ummeldung beim zuständigen Einwohnermeldeamt ausgestellt.</p>

<hr>
<p>Ort, Datum: _________________________, {{datum_heute}}</p>
<br>
<div data-signature="vermieter" style="min-height:48px;margin-bottom:-2px;"></div>
<p style="border-top:1px solid #222;padding-top:6px;margin-top:0;max-width:320px;">
<strong>Unterschrift Wohnungsgeber</strong><br>
<span style="color:#666;">{{vermieter_name}}</span>
</p>`,
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
<div data-signature="vermieter" style="min-height:48px;margin-bottom:-2px;"></div>
<p style="border-top:1px solid #222;padding-top:6px;margin-top:0;max-width:320px;">
<strong>Unterschrift Vermieter</strong><br>
<span style="color:#666;">{{vermieter_name}}</span>
</p>`,
  },

  mietvertrag: {
    name: 'Mietvertrag',
    type: 'mietvertrag' as const,
    content: `<h1>Mietvertrag über Wohnraum</h1>

<h2>Zwischen</h2>
<p><strong>{{vermieter_name}}</strong>{{vermieter_firma_block}}<br>
{{vermieter_adresse}}<br>
Telefon: {{vermieter_telefon}} &nbsp;·&nbsp; E-Mail: {{vermieter_email}}</p>
<p style="text-align:center;"><em>— nachstehend "Vermieter" genannt —</em></p>

<h2>und</h2>
<p><strong>{{mieter_anrede}} {{mieter_vorname}} {{mieter_nachname}}</strong><br>
{{mieter_adresse}}</p>
<p style="text-align:center;"><em>— nachstehend "Mieter" genannt —</em></p>

<p>wird folgender Mietvertrag geschlossen:</p>

<hr>

<h2>§ 1 &nbsp; Mietobjekt</h2>
<p>Vermietet wird die Wohnung in:</p>
<p style="margin-left:24px;"><strong>{{adresse}}</strong>{{lage_block}}</p>
<p>Die Wohnung besteht aus <strong>{{zimmer}} Zimmern</strong> mit einer Wohnfläche von ca. <strong>{{wohnflaeche}} m²</strong>, nebst Küche, Bad/WC, Flur sowie den mitvermieteten Nebenräumen.</p>

<h2>§ 2 &nbsp; Mietzeit</h2>
<p>Das Mietverhältnis beginnt am <strong>{{mietbeginn}}</strong>{{vertragsdauer_block}}</p>

<h2>§ 3 &nbsp; Miete und Nebenkosten</h2>
<table style="width:100%;border-collapse:collapse;margin:12px 0;">
<tbody>
<tr><td style="padding:6px 0;">Grundmiete (kalt)</td><td style="padding:6px 0;text-align:right;"><strong>{{kaltmiete}} €</strong></td></tr>
<tr><td style="padding:6px 0;">Vorauszahlung für Betriebs- und Heizkosten</td><td style="padding:6px 0;text-align:right;"><strong>{{nebenkosten}} €</strong></td></tr>
<tr><td style="padding:6px 0;border-top:1px solid #E6E6E6;"><strong>Gesamtmiete monatlich</strong></td><td style="padding:6px 0;text-align:right;border-top:1px solid #E6E6E6;"><strong>{{gesamtmiete}} €</strong></td></tr>
</tbody>
</table>
<p>Die Miete ist monatlich im Voraus, spätestens am <strong>{{faelligkeitstag}}. Werktag</strong> eines jeden Monats, kostenfrei für den Vermieter auf folgendes Konto zu zahlen:</p>
<p style="margin-left:24px;">Kontoinhaber: <strong>{{vermieter_name}}</strong><br>
IBAN: {{vermieter_iban}}<br>
Bank: {{vermieter_bank}}</p>
<p>Die Betriebskostenvorauszahlung wird jährlich abgerechnet (§§ 556 ff. BGB).</p>

<h2>§ 4 &nbsp; Kaution</h2>
<p>Der Mieter leistet zur Sicherung aller Ansprüche des Vermieters eine Barkaution in Höhe von <strong>{{kaution}} €</strong>.</p>
<p>Die Kaution ist gemäß § 551 BGB in drei gleichen Raten zulässig; die erste Rate wird zu Mietbeginn fällig. Der Vermieter legt die Kaution insolvenzsicher und getrennt von seinem Vermögen zu einem für Spareinlagen üblichen Zinssatz an. Zinsen stehen dem Mieter zu.</p>

<h2>§ 5 &nbsp; Übergabe und Zustand der Mietsache</h2>
<p>Die Wohnung wird im beiderseits besichtigten Zustand übergeben. Über den Zustand zum Zeitpunkt der Übergabe wird ein gesondertes <strong>Übergabeprotokoll</strong> angefertigt, das Bestandteil dieses Vertrages ist.</p>

<h2>§ 6 &nbsp; Nutzung der Mietsache</h2>
<p>(1) Die Wohnung darf ausschließlich zu Wohnzwecken genutzt werden. Eine gewerbliche oder freiberufliche Nutzung bedarf der schriftlichen Zustimmung des Vermieters.</p>
<p>(2) Die Untervermietung oder sonstige Gebrauchsüberlassung an Dritte bedarf der vorherigen schriftlichen Zustimmung des Vermieters. Auf § 553 BGB wird hingewiesen.</p>
<p>(3) Die Tierhaltung richtet sich nach den gesetzlichen Bestimmungen; die Haltung größerer Tiere (insb. Hunde, Katzen) bedarf der schriftlichen Zustimmung des Vermieters.</p>

<h2>§ 7 &nbsp; Instandhaltung, Schönheitsreparaturen</h2>
<p>(1) Der Mieter verpflichtet sich, die Mietsache pfleglich zu behandeln und kleine Instandhaltungen bis zu einer Höhe von 100 € je Einzelfall, höchstens jedoch 8 % der Jahreskaltmiete, zu übernehmen.</p>
<p>(2) Schönheitsreparaturen während der Mietzeit werden nicht übertragen. Maßgeblich ist die aktuelle Rechtsprechung des BGH.</p>

<h2>§ 8 &nbsp; Kündigung</h2>
<p>(1) Das Mietverhältnis kann unter Einhaltung der gesetzlichen Kündigungsfristen (§ 573c BGB) ordentlich gekündigt werden. Für den Mieter beträgt die Kündigungsfrist <strong>{{kuendigungsfrist}}</strong>.</p>
<p>(2) Die Kündigung bedarf der Schriftform.</p>
<p>(3) Das Recht zur außerordentlichen Kündigung bleibt unberührt.</p>

<h2>§ 9 &nbsp; Hausordnung</h2>
<p>Der Mieter verpflichtet sich, die Hausordnung einzuhalten, soweit sie diesem Vertrag beigefügt oder im Hause ausgehängt ist. Rücksichtnahme auf Mitbewohner, insbesondere während der gesetzlichen Ruhezeiten, ist selbstverständlich.</p>

<h2>§ 10 &nbsp; Sonstige Vereinbarungen</h2>
<p style="color:#888;"><em>Platz für individuelle Abreden:</em></p>
<p>_________________________________________________________________</p>
<p>_________________________________________________________________</p>
<p>_________________________________________________________________</p>

<h2>§ 11 &nbsp; Schlussbestimmungen</h2>
<p>(1) Mündliche Nebenabreden wurden nicht getroffen. Änderungen und Ergänzungen dieses Vertrages bedürfen der Schriftform.</p>
<p>(2) Sollte eine Bestimmung dieses Vertrages ganz oder teilweise unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. An die Stelle der unwirksamen Bestimmung tritt die gesetzliche Regelung.</p>
<p>(3) Gerichtsstand ist der Sitz der Mietsache.</p>

<hr>

<p style="margin-top:24px;">Ort, Datum: _________________________, {{datum_heute}}</p>

<table style="width:100%;margin-top:48px;border-collapse:collapse;">
<tbody>
<tr>
<td style="width:50%;padding:0 12px 0 0;vertical-align:top;">
<div data-signature="vermieter" style="min-height:48px;margin-bottom:-2px;"></div>
<p style="border-top:1px solid #222;padding-top:6px;margin-top:0;">
<strong>Vermieter</strong><br>
<span style="color:#666;">{{vermieter_name}}</span>
</p>
</td>
<td style="width:50%;padding:0 0 0 12px;vertical-align:top;">
<div data-signature="mieter" style="min-height:48px;margin-bottom:-2px;"></div>
<p style="border-top:1px solid #222;padding-top:6px;margin-top:0;">
<strong>Mieter</strong><br>
<span style="color:#666;">{{mieter_name}}</span>
</p>
</td>
</tr>
</tbody>
</table>`,
  },
}
