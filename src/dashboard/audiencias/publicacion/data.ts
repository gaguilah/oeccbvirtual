// Publicación semanal de audiencias de remate (docs/plan-audiencias-publicacion-semanal.md): qué
// audiencias entran y el bloque HTML que la oficina pega cada viernes en el portal. Puro: sin Supabase.
import { AUDIENCIAS_PATH } from '../../../components/audiencias/constants'
import { AVISOS_REMATES_PATH, COURTS } from '../../../components/remates/constants'
import { SITE_URL } from '../../../lib/contact'
import { timeLabel } from '../data'
import { addDays, bogotaParts, longWeekday, startOfDay, weekStart, weekTitle } from '../dates'
import type { Court, Hearing, HearingType } from '../types'

// Descripción del tipo de remate: la misma regla de create_auction_notice_with_hearing()
// (migración 20261009120000_hearings_auction_notices.sql). Si cambia allí, cambiarla aquí.
export const AUCTION_HEARING_TYPE = 'audiencia de remate'

export const isAuctionType = (type: Pick<HearingType, 'description'>) =>
  type.description.trim().toLowerCase() === AUCTION_HEARING_TYPE

// Ids de los tipos de remate (activos o no: una audiencia ya programada puede tener un tipo inactivo).
export const auctionTypeIds = (types: HearingType[]) => types.filter(isAuctionType).map((type) => type.id)

// Se publica el viernes para la semana siguiente: por defecto, el lunes de la semana que sigue.
export function defaultPublicationWeek(now: Date): string {
  return addDays(weekStart(bogotaParts(now).date), 7)
}

// Rango de la semana (lunes 00:00 a sábado 00:00, hora de Colombia) como instantes ISO.
export function weekRange(monday: string) {
  return { from: startOfDay(monday), to: startOfDay(addDays(monday, 5)) }
}

type PublicationHearing = Pick<
  Hearing,
  'id' | 'scheduled_at' | 'hearing_type_id' | 'case_number' | 'court_id' | 'connection_url' | 'status_id'
> &
  Partial<Pick<Hearing, 'auction_notice_deleted'>>

// Audiencias que entran: del juzgado, de remate, Programadas y de lunes a viernes de esa semana,
// por fecha y hora (y radicado si coinciden).
export function selectWeeklyAuctionHearings<T extends PublicationHearing>(
  hearings: T[],
  typeIds: number[],
  court: Court,
  monday: string,
): T[] {
  const { from, to } = weekRange(monday)
  const [start, end] = [new Date(from).getTime(), new Date(to).getTime()]
  return hearings
    .filter((hearing) => {
      const at = new Date(hearing.scheduled_at).getTime()
      return (
        hearing.court_id === court &&
        hearing.status_id === 1 &&
        typeIds.includes(hearing.hearing_type_id) &&
        at >= start &&
        at < end
      )
    })
    .sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime() ||
        a.case_number.localeCompare(b.case_number),
    )
}

// Sin enlace de conexión no se publica: bloquean la copia.
export const missingLinks = <T extends PublicationHearing>(hearings: T[]) =>
  hearings.filter((hearing) => !hearing.connection_url)

// Días con audiencias, en orden ('YYYY-MM-DD' de Colombia). Los días sin audiencias no aparecen.
export function groupByDay<T extends PublicationHearing>(hearings: T[]): { day: string; hearings: T[] }[] {
  const days: { day: string; hearings: T[] }[] = []
  for (const hearing of hearings) {
    const day = bogotaParts(hearing.scheduled_at).date
    const last = days.at(-1)
    if (last?.day === day) last.hearings.push(hearing)
    else days.push({ day, hearings: [hearing] })
  }
  return days
}

// "Miércoles, 11 de noviembre"
export const dayLabel = longWeekday

// "8:30 a. m."
export const hearingTime = (iso: string) => timeLabel(bogotaParts(iso).time)

// "20/11/2026"
export function publishedLabel(now: Date) {
  const [year, month, day] = bogotaParts(now).date.split('-')
  return `Publicado el ${day}/${month}/${year}`
}

// Avisos de Remate pública filtrada por juzgado (y por radicado, para "Ver aviso").
export function noticesUrl(court: Court, caseNumber?: string) {
  const params = new URLSearchParams({ juzgado: String(court) })
  if (caseNumber) params.set('q', caseNumber)
  return `${SITE_URL}${AVISOS_REMATES_PATH}?${params}`
}

export const hearingsUrl = (court: Court) => `${SITE_URL}${AUDIENCIAS_PATH}?juzgado=${court}`

export const EMPTY_WEEK = 'No hay audiencias de remate programadas para esta semana.'

// "audiencias-remate-juzgado-1-2026-11-23.html"
export const publicationFileName = (court: Court, monday: string) => `audiencias-remate-juzgado-${court}-${monday}.html`

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
export const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => ESCAPES[char])

// Estilos del bloque (opción A del plan): clases con prefijo propio para no chocar con las del portal,
// CSS plano y adaptable al ancho de la sección (@container), sin fuentes externas ni JavaScript.
const STYLE = `.oeccb-pa { container-type: inline-size; font-family: Arial, Helvetica, sans-serif; color: #0f172a; font-size: 15px; line-height: 1.5; }
.oeccb-pa * { box-sizing: border-box; }
.oeccb-pa__box { max-width: 60rem; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden; }
.oeccb-pa__head { background: #eaf1ff; padding: 20px 24px; }
.oeccb-pa__eyebrow { margin: 0; font-size: 12px; font-weight: bold; letter-spacing: .08em; text-transform: uppercase; color: #193cb8; }
.oeccb-pa__title { margin: 4px 0 2px; font-size: 19px; line-height: 1.3; color: #0f172a; }
.oeccb-pa__week { margin: 0; font-size: 15px; color: #334155; }
.oeccb-pa__date { margin: 8px 0 0; font-size: 13px; color: #475569; }
.oeccb-pa__day { margin: 0; padding: 14px 24px 8px; font-size: 14px; font-weight: bold; color: #193cb8; text-transform: uppercase; letter-spacing: .04em; }
.oeccb-pa__list { list-style: none; margin: 0; padding: 0 12px 8px; }
.oeccb-pa__item { display: grid; grid-template-columns: 7.5rem 1fr auto; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; background: #ffffff; margin: 0 0 6px; }
.oeccb-pa__time { font-size: 17px; font-weight: bold; color: #0f172a; white-space: nowrap; }
.oeccb-pa__case { font-family: Consolas, 'Courier New', monospace; font-size: 14px; color: #334155; white-space: nowrap; }
.oeccb-pa__label { display: block; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #475569; }
.oeccb-pa__actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
.oeccb-pa__btn { display: inline-block; padding: 8px 14px; border-radius: 8px; font-size: 14px; font-weight: bold; text-decoration: none; white-space: nowrap; }
.oeccb-pa__btn--main { background: #193cb8; color: #ffffff; }
.oeccb-pa__btn--main:hover { background: #142f91; color: #ffffff; }
.oeccb-pa__btn--alt { background: #dbeafe; color: #193cb8; }
.oeccb-pa__btn--alt:hover { background: #c7dbfd; color: #193cb8; }
.oeccb-pa__btn:focus-visible, .oeccb-pa__foot a:focus-visible { outline: 3px solid #f59e0b; outline-offset: 2px; }
.oeccb-pa__empty { margin: 0; padding: 20px 24px; color: #334155; }
.oeccb-pa__foot { display: flex; flex-wrap: wrap; gap: 8px 20px; padding: 14px 24px 18px; font-size: 14px; }
.oeccb-pa__foot a { color: #193cb8; font-weight: bold; text-decoration: underline; text-underline-offset: 3px; }
.oeccb-pa__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@container (max-width: 560px) {
  .oeccb-pa__head { padding: 16px; }
  .oeccb-pa__day { padding: 12px 16px 6px; }
  .oeccb-pa__list { padding: 0 8px 6px; }
  .oeccb-pa__item { grid-template-columns: 1fr; gap: 6px; }
  .oeccb-pa__btn { flex: 1; text-align: center; }
  .oeccb-pa__empty { padding: 16px; }
  .oeccb-pa__foot { padding: 12px 16px 16px; flex-direction: column; }
}`

const NEW_TAB = '(se abre en una pestaña nueva)'

function link(href: string, className: string, text: string, hidden: string) {
  const attr = className ? ` class="${className}"` : ''
  return `<a${attr} href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}<span class="oeccb-pa__sr">${escapeHtml(hidden)}</span></a>`
}

export type PublicationInput = {
  court: Court
  monday: string
  now: Date
  // Ya filtradas con selectWeeklyAuctionHearings y todas con enlace (missingLinks vacío).
  hearings: PublicationHearing[]
}

// El bloque que se pega en la sección del portal que acepta código.
export function weeklyPublicationHtml({ court, monday, now, hearings }: PublicationInput): string {
  const days = groupByDay(hearings)
  const body = days.length
    ? days
        .map(
          ({ day, hearings: list }) => `    <h4 class="oeccb-pa__day">${escapeHtml(dayLabel(day))}</h4>
    <ul class="oeccb-pa__list">
${list
  .map((hearing) => {
    const caseNumber = hearing.case_number
    return `      <li class="oeccb-pa__item">
        <span class="oeccb-pa__time">${escapeHtml(hearingTime(hearing.scheduled_at))}</span>
        <span class="oeccb-pa__case"><span class="oeccb-pa__label">Radicado</span>${escapeHtml(caseNumber)}</span>
        <span class="oeccb-pa__actions">
          ${link(hearing.connection_url ?? '', 'oeccb-pa__btn oeccb-pa__btn--main', 'Ingresar a Teams', `, radicado ${caseNumber} ${NEW_TAB}`)}
          ${link(noticesUrl(court, caseNumber), 'oeccb-pa__btn oeccb-pa__btn--alt', 'Ver aviso', ` del radicado ${caseNumber} ${NEW_TAB}`)}
        </span>
      </li>`
  })
  .join('\n')}
    </ul>`,
        )
        .join('\n')
    : `    <p class="oeccb-pa__empty">${escapeHtml(EMPTY_WEEK)}</p>`

  return `<style>
${STYLE}
</style>
<div class="oeccb-pa">
  <div class="oeccb-pa__box">
    <div class="oeccb-pa__head">
      <p class="oeccb-pa__eyebrow">Audiencias de remate</p>
      <h3 class="oeccb-pa__title">${escapeHtml(COURTS[court].name)}</h3>
      <p class="oeccb-pa__week">${escapeHtml(weekTitle(monday))}</p>
      <p class="oeccb-pa__date">${escapeHtml(publishedLabel(now))}</p>
    </div>
${body}
    <div class="oeccb-pa__foot">
      ${link(noticesUrl(court), '', 'Todos los avisos de remate', ` ${NEW_TAB}`)}
      ${link(hearingsUrl(court), '', 'Consultar audiencias', ` ${NEW_TAB}`)}
    </div>
  </div>
</div>
`
}

// Archivo descargable: el mismo bloque dentro de una página completa (con charset, para que las
// tildes se vean bien al abrirlo en el navegador).
export function publicationDocument(input: PublicationInput): string {
  const title = `Audiencias de remate · ${COURTS[input.court].short} · ${weekTitle(input.monday)}`
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body>
${weeklyPublicationHtml(input)}</body>
</html>
`
}
