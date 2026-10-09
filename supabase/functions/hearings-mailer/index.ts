// Correos de Audiencias (docs/plan-audiencias.md, fase 4). La llaman las tareas de pg_cron con el
// encabezado x-cron-secret = HEARINGS_CRON_SECRET:
//   { "job": "weekly" }  cada día hábil 7:30 a. m.: listado de la semana si hoy es su primer día
//                        hábil y no se ha enviado (hearing_weekly_sends).
//   { "job": "tick" }    cada 5 minutos: avisos de cambio en cola y recordatorios (15 minutos antes).
//
// Destinatarios (hearing_recipients): usuarios activos con audiencias.ver en el juzgado, el
// superadmin y el buzón del juzgado (execution_courts.email).
//
// Despliegue sin verificación de JWT (la protege el secreto):
//   supabase functions deploy hearings-mailer --no-verify-jwt
// Secretos: RESEND_API_KEY, EMAIL_FROM, HEARINGS_CRON_SECRET y, en pruebas,
// HEARINGS_EMAIL_TEST_TO (todos los correos van solo ahí, con "[Prueba]" en el asunto).
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendAndLog, type Email } from '../_shared/email.ts'
import {
  COURT_NAMES,
  fromSnapshot,
  hearingChangeEmail,
  hearingReminderEmail,
  hearingsWeeklyEmail,
  type ChangeKind,
  type HearingEmailData,
  type HearingSnapshot,
} from '../_shared/emails/hearings.ts'

// Plan gratuito de Resend: 100 correos al día. Desde este número se dejan de enviar recordatorios.
const DAILY_REMINDER_LIMIT = 90

type Recipient = { email: string; name: string }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

const bogotaDate = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(date)
const startOfDay = (day: string) => new Date(`${day}T00:00:00-05:00`)
const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const mondayOf = (day: string) => {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay() || 7
  return addDays(day, 1 - weekday)
}

const dayMonth = new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' })
const yearOf = (day: string) => day.slice(0, 4)
// "del lunes 5 al viernes 9 de octubre de 2026"
function periodLabel(from: string, to: string) {
  const a = dayMonth.format(new Date(`${from}T00:00:00Z`))
  const b = dayMonth.format(new Date(`${to}T00:00:00Z`))
  const sameMonth = from.slice(5, 7) === to.slice(5, 7)
  const first = sameMonth ? a.replace(/ de [a-záéíóú]+$/, '') : a
  return `del ${first.replace(',', '')} al ${b.replace(',', '')} de ${yearOf(to)}`
}

function scopeLabel(courts: number[]) {
  return courts.length === 2 ? 'los Juzgados 1 y 2' : `el ${COURT_NAMES[courts[0]].short}`
}

// Destinatarios por juzgado (con modo de prueba: solo HEARINGS_EMAIL_TEST_TO).
async function recipientsFor(admin: SupabaseClient, court: number): Promise<Recipient[]> {
  const { data, error } = await admin.rpc('hearing_recipients', { p_court: court })
  if (error) throw error
  return (data ?? []) as Recipient[]
}

const testTo = () => Deno.env.get('HEARINGS_EMAIL_TEST_TO') || null

async function deliver(
  admin: SupabaseClient,
  kind: string,
  email: Email,
  realRecipients: string[],
  hearingId?: string,
) {
  const test = testTo()
  if (test) {
    email.to = test
    email.subject = `[Prueba] ${email.subject}`
    email.text += `\n\n(Prueba: en producción iría a ${realRecipients.join(', ') || 'nadie'})`
  }
  return sendAndLog(admin, {
    kind,
    email,
    reference: hearingId ? { table: 'hearings', id: hearingId } : undefined,
  })
}

// deno-lint-ignore no-explicit-any
function toEmailData(row: any): HearingEmailData {
  const court = COURT_NAMES[row.court_id]
  return {
    id: row.id,
    scheduledAt: row.scheduled_at,
    type: row.hearing_types.description,
    caseNumber: row.case_number,
    courtName: court.name,
    courtShort: court.short,
    connectionUrl: row.connection_url,
    requiresLink: row.hearing_types.requires_link,
  }
}

const HEARING_COLUMNS =
  'id, scheduled_at, case_number, court_id, connection_url, hearing_types(description, requires_link)'
const communicable = (h: HearingEmailData) => !h.requiresLink || Boolean(h.connectionUrl)

// ---------------------------------------------------------------------------------------------
// Listado semanal.
// ---------------------------------------------------------------------------------------------
// force (prueba manual): envía la semana de `date` (o la actual) sin revisar el día ni marcarla
// como enviada, para no impedir el envío real.
async function weekly(admin: SupabaseClient, force: boolean, date?: string) {
  const today = bogotaDate(new Date())
  const monday = mondayOf(force && date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today)
  const friday = addDays(monday, 4)

  if (!force) {
    // Primer día hábil de la semana: el primero de lunes a viernes que sea hábil.
    let first: string | null = null
    for (let day = monday; day <= friday; day = addDays(day, 1)) {
      const { data } = await admin.rpc('is_business_day', { p_day: day })
      if (data) {
        first = day
        break
      }
    }
    if (first !== today)
      return { skipped: `Hoy (${today}) no es el primer día hábil de la semana (${first ?? 'ninguno'})` }

    // Reserva la semana antes de enviar: si dos llamadas coinciden, solo una envía.
    const { data: claimed, error: claimError } = await admin
      .from('hearing_weekly_sends')
      .upsert({ week_start: monday }, { onConflict: 'week_start', ignoreDuplicates: true })
      .select('week_start')
    if (claimError) throw claimError
    if (!claimed?.length) return { skipped: `El listado de la semana ${monday} ya se envió` }
  }

  const { data, error } = await admin
    .from('hearings')
    .select(HEARING_COLUMNS)
    .eq('status_id', 1)
    .gte('scheduled_at', new Date(Math.max(Date.now(), startOfDay(monday).getTime())).toISOString())
    .lt('scheduled_at', startOfDay(addDays(friday, 1)).toISOString())
    .order('scheduled_at')
  if (error) throw error
  const rows = (data ?? [])
    .map((row) => ({ court: row.court_id as number, hearing: toEmailData(row) }))
    .filter((x) => communicable(x.hearing))
  const hearings = rows.map((x) => x.hearing)

  // Cada persona recibe las de sus juzgados.
  const byEmail = new Map<string, { courts: number[] }>()
  for (const court of [1, 2]) {
    for (const r of await recipientsFor(admin, court)) {
      const entry = byEmail.get(r.email) ?? { courts: [] }
      entry.courts.push(court)
      byEmail.set(r.email, entry)
    }
  }

  const period = periodLabel(monday, friday)
  const results = []
  if (testTo()) {
    // En pruebas: un solo correo con todo, para revisar.
    if (hearings.length) {
      const email = hearingsWeeklyEmail(hearings, period, scopeLabel([1, 2]), '')
      results.push(await deliver(admin, 'audiencias_semana', email, [...byEmail.keys()]))
    }
  } else {
    for (const [address, { courts }] of byEmail) {
      const mine = rows.filter((x) => courts.includes(x.court)).map((x) => x.hearing)
      if (!mine.length) continue
      results.push(
        await deliver(admin, 'audiencias_semana', hearingsWeeklyEmail(mine, period, scopeLabel(courts), address), [
          address,
        ]),
      )
    }
  }

  if (!force)
    await admin
      .from('hearing_weekly_sends')
      .update({ recipients: results.length, hearings: hearings.length, sent_at: new Date().toISOString() })
      .eq('week_start', monday)
  return {
    week: monday,
    // En una prueba forzada: a quién iría cada listado (correo y juzgados).
    recipients: force ? [...byEmail].map(([address, { courts }]) => `${address} (${courts.join(' y ')})`) : undefined,
    hearings: hearings.length,
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
  }
}

// ---------------------------------------------------------------------------------------------
// Avisos de cambio y recordatorios.
// ---------------------------------------------------------------------------------------------
async function changes(admin: SupabaseClient) {
  const { data, error } = await admin
    .from('hearing_notifications')
    .select('id, hearing_id, kind, before, after')
    .is('sent_at', null)
    .order('created_at')
    .limit(50)
  if (error) throw error
  let sent = 0
  for (const n of data ?? []) {
    // Reserva el aviso antes de enviarlo (evita duplicados si dos llamadas coinciden).
    const { data: claimed } = await admin
      .from('hearing_notifications')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', n.id)
      .is('sent_at', null)
      .select('id')
    if (!claimed?.length) continue
    const before = n.before ? fromSnapshot(n.hearing_id, n.before as HearingSnapshot) : null
    const after = n.after ? fromSnapshot(n.hearing_id, n.after as HearingSnapshot) : null
    const courts = [
      ...new Set([(n.before as HearingSnapshot | null)?.court_id, (n.after as HearingSnapshot | null)?.court_id]),
    ].filter((c): c is number => typeof c === 'number')
    const recipients = [
      ...new Set((await Promise.all(courts.map((c) => recipientsFor(admin, c)))).flat().map((r) => r.email)),
    ]
    if (testTo()) {
      const email = hearingChangeEmail(n.kind as ChangeKind, before, after, '')
      if ((await deliver(admin, 'audiencias_cambio', email, recipients, n.hearing_id)).ok) sent++
    } else {
      for (const address of recipients) {
        const email = hearingChangeEmail(n.kind as ChangeKind, before, after, address)
        if ((await deliver(admin, 'audiencias_cambio', email, [address], n.hearing_id)).ok) sent++
      }
    }
  }
  return { notifications: data?.length ?? 0, sent }
}

async function reminders(admin: SupabaseClient) {
  // Cupo diario: correos enviados hoy (hora de Colombia).
  const today = bogotaDate(new Date())
  const { count } = await admin
    .from('email_log')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'sent')
    .gte('created_at', startOfDay(today).toISOString())
  if ((count ?? 0) >= DAILY_REMINDER_LIMIT) {
    console.warn(`Recordatorios suspendidos: ${count} correos enviados hoy (límite ${DAILY_REMINDER_LIMIT}).`)
    return { skipped: 'daily_limit', sentToday: count }
  }

  const now = Date.now()
  const { data, error } = await admin
    .from('hearings')
    .select(HEARING_COLUMNS)
    .eq('status_id', 1)
    .is('reminder_sent_at', null)
    .gte('scheduled_at', new Date(now + 10 * 60_000).toISOString())
    .lt('scheduled_at', new Date(now + 20 * 60_000).toISOString())
  if (error) throw error
  let sent = 0
  for (const row of data ?? []) {
    const hearing = toEmailData(row)
    if (!communicable(hearing)) continue
    const { data: claimed } = await admin
      .from('hearings')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', hearing.id)
      .is('reminder_sent_at', null)
      .select('id')
    if (!claimed?.length) continue
    const recipients = (await recipientsFor(admin, row.court_id)).map((r) => r.email)
    if (testTo()) {
      if (
        (await deliver(admin, 'audiencias_recordatorio', hearingReminderEmail(hearing, ''), recipients, hearing.id)).ok
      )
        sent++
    } else {
      for (const address of recipients) {
        if (
          (
            await deliver(
              admin,
              'audiencias_recordatorio',
              hearingReminderEmail(hearing, address),
              [address],
              hearing.id,
            )
          ).ok
        )
          sent++
      }
    }
  }
  return { due: data?.length ?? 0, sent }
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('HEARINGS_CRON_SECRET')
  if (!secret || req.headers.get('x-cron-secret') !== secret) return json({ error: 'forbidden' }, 403)

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  try {
    const body = await req.json().catch(() => ({}))
    if (body.job === 'weekly') return json(await weekly(admin, body.force === true, body.date))
    if (body.job === 'tick') return json({ changes: await changes(admin), reminders: await reminders(admin) })
    return json({ error: 'job debe ser "weekly" o "tick"' }, 400)
  } catch (err) {
    console.error('hearings-mailer:', err)
    return json({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})
