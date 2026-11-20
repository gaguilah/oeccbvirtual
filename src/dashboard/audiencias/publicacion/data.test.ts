import { describe, expect, it } from 'vitest'
import remateSql from '../../../../supabase/migrations/20261009120000_hearings_auction_notices.sql?raw'
import { INJECTED_MARKUP, INJECTION_PAYLOADS } from '../../../lib/testInjection'
import type { HearingType } from '../types'
import {
  AUCTION_HEARING_TYPE,
  auctionTypeIds,
  defaultPublicationWeek,
  EMPTY_WEEK,
  escapeHtml,
  groupByDay,
  hearingTime,
  missingLinks,
  noticesUrl,
  publicationDocument,
  publicationFileName,
  publishedLabel,
  selectWeeklyAuctionHearings,
  weeklyPublicationHtml,
} from './data'

// ICU puede poner un espacio de no separación antes de "a. m." / "p. m.".
const NBSP = new RegExp(`[${String.fromCharCode(0xa0, 0x202f)}]`, 'g')
const space = (text: string) => text.replace(NBSP, ' ')

const type = (id: number, description: string, is_active = true): HearingType => ({
  id,
  description,
  requires_link: true,
  is_active,
  created_at: '2026-10-01T08:00:00-05:00',
})

const TYPES = [type(1, 'Audiencia inicial'), type(4, 'Audiencia de Remate'), type(9, 'audiencia de remate ', false)]
const REMATE = [4, 9]

let n = 0
const hearing = (scheduledAt: string, changes: Record<string, unknown> = {}) => ({
  id: `h${++n}`,
  scheduled_at: new Date(scheduledAt).toISOString(),
  hearing_type_id: 4,
  case_number: '68001310300220210015601',
  court_id: 1 as const,
  connection_url: 'https://teams.microsoft.com/l/meetup-join/abc?context=%7b%22Tid%22%7d&x=1',
  status_id: 1 as const,
  auction_notice_deleted: false,
  ...changes,
})

const NOW = new Date('2026-11-20T16:15:00-05:00')

describe('tipo de remate', () => {
  it('se reconoce sin importar mayúsculas ni espacios, activo o no', () => {
    expect(auctionTypeIds(TYPES)).toEqual(REMATE)
  })

  it('usa la misma descripción que create_auction_notice_with_hearing()', () => {
    expect(remateSql).toContain(`lower(t.description) = '${AUCTION_HEARING_TYPE}'`)
  })
})

describe('defaultPublicationWeek', () => {
  it.each([
    ['viernes', '2026-11-20T16:00:00-05:00', '2026-11-23'],
    ['viernes en la noche (ya sábado en UTC)', '2026-11-20T21:30:00-05:00', '2026-11-23'],
    ['sábado', '2026-11-21T10:00:00-05:00', '2026-11-23'],
    ['domingo', '2026-11-22T10:00:00-05:00', '2026-11-23'],
    ['lunes', '2026-11-23T08:00:00-05:00', '2026-11-30'],
  ])('%s → lunes de la semana siguiente', (_, now, monday) => {
    expect(defaultPublicationWeek(new Date(now))).toBe(monday)
  })
})

describe('selectWeeklyAuctionHearings', () => {
  const week = '2026-11-09'

  it('solo remates Programadas del juzgado de lunes a viernes, en orden', () => {
    const late = hearing('2026-11-11T14:30:00-05:00', { case_number: '68001310300219980063601' })
    const early = hearing('2026-11-11T08:30:00-05:00')
    const friday = hearing('2026-11-13T23:59:00-05:00', { case_number: '68001310300920160020001' })
    const rows = [
      friday,
      late,
      early,
      hearing('2026-11-10T09:00:00-05:00', { hearing_type_id: 1 }),
      hearing('2026-11-10T09:00:00-05:00', { court_id: 2 }),
      hearing('2026-11-10T09:00:00-05:00', { status_id: 3 }),
      hearing('2026-11-10T09:00:00-05:00', { status_id: 2 }),
      hearing('2026-11-08T23:59:00-05:00'),
      hearing('2026-11-14T00:00:00-05:00'),
      hearing('2026-11-16T08:00:00-05:00'),
    ]
    expect(selectWeeklyAuctionHearings(rows, REMATE, 1, week)).toEqual([early, late, friday])
  })

  it('a la misma hora, por radicado', () => {
    const b = hearing('2026-11-12T09:00:00-05:00', { case_number: '2' })
    const a = hearing('2026-11-12T09:00:00-05:00', { case_number: '1' })
    expect(selectWeeklyAuctionHearings([b, a], REMATE, 1, week)).toEqual([a, b])
  })

  it('incluye el tipo de remate inactivo', () => {
    const old = hearing('2026-11-12T09:00:00-05:00', { hearing_type_id: 9 })
    expect(selectWeeklyAuctionHearings([old], REMATE, 1, week)).toEqual([old])
  })
})

describe('missingLinks y groupByDay', () => {
  it('las que no tienen enlace bloquean la publicación', () => {
    const without = hearing('2026-11-12T09:00:00-05:00', { connection_url: null })
    expect(missingLinks([hearing('2026-11-12T08:00:00-05:00'), without])).toEqual([without])
  })

  it('agrupa por día de Colombia y omite los días sin audiencias', () => {
    const rows = [
      hearing('2026-11-11T08:30:00-05:00'),
      hearing('2026-11-11T14:30:00-05:00'),
      hearing('2026-11-13T08:30:00-05:00'),
    ]
    expect(groupByDay(rows).map((d) => [d.day, d.hearings.length])).toEqual([
      ['2026-11-11', 2],
      ['2026-11-13', 1],
    ])
  })
})

describe('textos', () => {
  it('hora, fecha de publicación (sin hora) y nombre del archivo', () => {
    expect(space(hearingTime('2026-11-11T14:30:00-05:00'))).toBe('2:30 p. m.')
    expect(publishedLabel(NOW)).toBe('Publicado el 20/11/2026')
    expect(publicationFileName(2, '2026-11-23')).toBe('audiencias-remate-juzgado-2-2026-11-23.html')
  })

  it('"Ver aviso" lleva a Avisos de Remate filtrada por juzgado y radicado', () => {
    expect(noticesUrl(1, '68001310300220210015601')).toBe(
      'https://oeccbvirtual.app/avisos-remates?juzgado=1&q=68001310300220210015601',
    )
    expect(noticesUrl(2)).toBe('https://oeccbvirtual.app/avisos-remates?juzgado=2')
  })
})

describe('weeklyPublicationHtml', () => {
  const rows = [
    hearing('2026-11-11T08:30:00-05:00'),
    hearing('2026-11-11T14:30:00-05:00', { case_number: '68001310300219980063601' }),
    hearing('2026-11-13T08:30:00-05:00', { case_number: '68001310300920160020001' }),
  ]
  const html = space(weeklyPublicationHtml({ court: 1, monday: '2026-11-09', now: NOW, hearings: rows }))

  it('encabezado con juzgado, semana y fecha de publicación', () => {
    expect(html).toContain('Juzgado 1 Civil del Circuito de Ejecución de Sentencias de Bucaramanga')
    expect(html).toContain('Semana del 9 al 13 de noviembre de 2026')
    expect(html).toContain('Publicado el 20/11/2026')
  })

  it('un subtítulo por día y una fila por audiencia', () => {
    expect(html.match(/oeccb-pa__day"/g)).toHaveLength(2)
    expect(html.match(/<li class="oeccb-pa__item">/g)).toHaveLength(3)
    expect(html).toMatch(/Miércoles, 11 de noviembre/)
    expect(html).toMatch(/Viernes, 13 de noviembre/)
    expect(html).toContain('8:30 a. m.')
    expect(html).toContain('2:30 p. m.')
  })

  it('enlaces escapados y todos con rel="noopener noreferrer"', () => {
    expect(html).toContain('href="https://teams.microsoft.com/l/meetup-join/abc?context=%7b%22Tid%22%7d&amp;x=1"')
    expect(html).toContain('avisos-remates?juzgado=1&amp;q=68001310300920160020001')
    const links = html.match(/<a\b[^>]*>/g) ?? []
    expect(links).toHaveLength(8)
    for (const tag of links) expect(tag).toContain('target="_blank" rel="noopener noreferrer"')
  })

  it('semana vacía: mensaje único', () => {
    const empty = weeklyPublicationHtml({ court: 2, monday: '2026-11-23', now: NOW, hearings: [] })
    expect(empty).toContain(EMPTY_WEEK)
    expect(empty).not.toContain('<li')
    expect(empty).toContain('Juzgado 2 Civil')
  })

  it('sin JavaScript ni recursos externos', () => {
    expect(html).not.toMatch(/<script|@import|url\(|<link/i)
  })

  it('el archivo descargable es una página completa con charset', () => {
    const doc = publicationDocument({ court: 1, monday: '2026-11-09', now: NOW, hearings: rows })
    expect(doc).toMatch(/^<!doctype html>/)
    expect(doc).toContain('<meta charset="utf-8">')
    expect(doc).toContain('<div class="oeccb-pa">')
  })
})

describe('inyección de código', () => {
  it.each(INJECTION_PAYLOADS)('escapa %s en radicado y enlace', (payload) => {
    const html = weeklyPublicationHtml({
      court: 1,
      monday: '2026-11-09',
      now: NOW,
      hearings: [hearing('2026-11-11T08:30:00-05:00', { case_number: payload, connection_url: payload })],
    })
    expect(html).not.toMatch(INJECTED_MARKUP)
  })

  it('escapeHtml', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;')
  })
})
