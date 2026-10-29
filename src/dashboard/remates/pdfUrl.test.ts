import { describe, expect, it } from 'vitest'
// Misma fórmula que el trigger auction_notices_before_write (20261002120000_create_auction_notices.sql).
import auctionNoticesSql from '../../../supabase/migrations/20261002120000_create_auction_notices.sql?raw'
import { bogotaParts, toScheduledAt } from './datetime'
import { folderFor, previewPdfUrl } from './pdfUrl'
import { caseNumberSchema, noticeSchema, pdfUrlSchema } from './schema'
import type { PdfFolder } from './types'

const folder = (valid_from: string, group_id = 10, folder_id = 20): PdfFolder => ({
  id: valid_from,
  group_id,
  folder_id,
  valid_from,
  created_at: `${valid_from}T08:00:00-05:00`,
})
const CASE = '68001310300520170012301'
const BASE = 'https://publicacionesprocesales.ramajudicial.gov.co/documents'

describe('previewPdfUrl', () => {
  it('fecha y hora de 12 h en Bogotá, con el juzgado', () => {
    expect(previewPdfUrl(folder('2026-01-01'), CASE, 1, '2026-11-12T09:00:00-05:00')).toBe(
      `${BASE}/10/20/${CASE}-2026111209-J01ECC.pdf`,
    )
    expect(previewPdfUrl(folder('2026-01-01'), CASE, 2, '2026-11-12T14:30:00-05:00')).toBe(
      `${BASE}/10/20/${CASE}-2026111202-J02ECC.pdf`,
    )
  })

  it('mediodía y medianoche son 12, como HH12 de Postgres', () => {
    expect(previewPdfUrl(folder('2026-01-01'), CASE, 1, '2026-11-12T12:00:00-05:00')).toContain('-2026111212-')
    expect(previewPdfUrl(folder('2026-01-01'), CASE, 1, '2026-11-12T00:15:00-05:00')).toContain('-2026111212-')
  })

  it('usa el día de Bogotá aunque en UTC ya sea el siguiente', () => {
    expect(previewPdfUrl(folder('2026-01-01'), CASE, 1, '2026-11-12T21:00:00-05:00')).toContain('-2026111209-')
  })

  it('la migración arma la URL igual', () => {
    expect(auctionNoticesSql).toContain(`'${BASE}/%s/%s/%s-%s-J0%sECC.pdf'`)
    expect(auctionNoticesSql).toContain("to_char(new.scheduled_at at time zone 'America/Bogota', 'YYYYMMDDHH12')")
    expect(auctionNoticesSql).toContain('where valid_from <= v_published_on')
  })
})

describe('folderFor', () => {
  // Llegan de la más nueva a la más vieja.
  const folders = [folder('2026-07-01', 1, 2), folder('2026-01-01', 3, 4)]

  it('la más reciente con valid_from <= fecha, incluido el mismo día', () => {
    expect(folderFor(folders, '2026-10-29')?.group_id).toBe(1)
    expect(folderFor(folders, '2026-07-01')?.group_id).toBe(1)
    expect(folderFor(folders, '2026-06-30')?.group_id).toBe(3)
  })

  it('sin carpeta vigente: null (la base responde no_pdf_folder)', () => {
    expect(folderFor(folders, '2025-12-31')).toBeNull()
    expect(folderFor([], '2026-10-29')).toBeNull()
  })
})

describe('datetime', () => {
  it('bogotaParts y toScheduledAt van y vuelven', () => {
    expect(bogotaParts('2026-10-29T22:05:00Z')).toEqual({ date: '2026-10-29', time: '17:05', hour: 17 })
    expect(toScheduledAt('2026-10-29', '09:00')).toBe('2026-10-29T14:00:00.000Z')
    const { date, time } = bogotaParts(toScheduledAt('2026-12-31', '23:45'))
    expect([date, time]).toEqual(['2026-12-31', '23:45'])
  })

  it('medianoche es 00, no 24', () => {
    expect(bogotaParts('2026-10-30T05:00:00Z')).toEqual({ date: '2026-10-30', time: '00:00', hour: 0 })
  })
})

describe('esquemas del aviso', () => {
  it('radicado con separadores queda en 23 dígitos', () => {
    expect(caseNumberSchema.parse('68001-31-03-005-2017-00123-01')).toBe(CASE)
    expect(caseNumberSchema.safeParse('6800131030052017001230').success).toBe(false)
  })

  it('juzgado, fecha y hora', () => {
    const valid = { caseNumber: CASE, court: '2', date: '2026-11-12', time: '09:00' }
    expect(noticeSchema.safeParse(valid).success).toBe(true)
    expect(noticeSchema.safeParse({ ...valid, court: '3' }).success).toBe(false)
    expect(noticeSchema.safeParse({ ...valid, date: '12/11/2026' }).success).toBe(false)
    expect(noticeSchema.safeParse({ ...valid, time: '9:00' }).success).toBe(false)
  })

  it('URL del PDF corregida: completa y con https, como auction_notices_pdf_url_chk', () => {
    expect(pdfUrlSchema.safeParse(` ${BASE}/1/2/x.pdf `).data).toBe(`${BASE}/1/2/x.pdf`)
    expect(pdfUrlSchema.safeParse('http://x.test/a.pdf').success).toBe(false)
    expect(pdfUrlSchema.safeParse('x.test/a.pdf').success).toBe(false)
    expect(auctionNoticesSql).toContain("pdf_url ~ '^https://'")
  })
})
