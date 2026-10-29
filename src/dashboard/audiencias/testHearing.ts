import type { Hearing } from './types'

// Audiencia de prueba: Programada, Juzgado 1, jueves 29 de octubre de 2026 a las 9:00 a. m.
export function testHearing(overrides: Partial<Hearing> = {}): Hearing {
  return {
    id: 'h1',
    scheduled_at: '2026-10-29T09:00:00-05:00',
    hearing_type_id: 1,
    case_number: '68001310300520170012301',
    court_id: 1,
    connection_url: null,
    recording_url: null,
    status_id: 1,
    notes: null,
    auction_notice_id: null,
    auction_notice_deleted: false,
    recording_set_at: null,
    recording_set_by_name: null,
    recording_set_by_position: null,
    filed_at: null,
    filed_by_name: null,
    created_at: '2026-10-20T08:00:00-05:00',
    updated_at: null,
    ...overrides,
  }
}
