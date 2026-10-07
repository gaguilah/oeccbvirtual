import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { requestTypes } from '../../components/pqrs/data'
import { formatDate, formatTime } from '../../components/remates'
import { Alert, Badge, Button, ButtonLink, CopyButton, EmptyState, Spinner, Textarea } from '../../components/ui'
import { cn } from '../../lib/cn'
import { NOTIFICATIONS_EMAIL } from '../../lib/contact'
import { useDocumentMeta } from '../../lib/useDocumentMeta'
import { useAccess } from '../access'
import { ActionMenu, ConfirmDialog, Icon, icons, type ActionMenuItem } from '../ui'
import { fetchRequest, fetchRequestAudit, fetchRequestEmails, resendResponse, respondRequest } from './api'
import { EMAIL_KINDS, isPending, PQRS_ADMIN_PATH, RESPONSE_MAX_CHARS, RESPONSE_MIN_CHARS } from './data'
import { DeadlineBadge, StatusBadge } from './RequestBadges'
import StatusDialog, { type StatusAction } from './StatusDialog'
import type { RequestAudit, RequestEmail, RequestRow } from './types'

type Loaded = { row: RequestRow | null; emails: RequestEmail[]; audit: RequestAudit | null; now: Date }

// Los id de PQRS son uuid: uno con otro formato (inventado o mal copiado) no se consulta.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
type Flash = { variant: 'success' | 'warning'; text: string }

const at = (iso: string) => `${formatDate(iso)}, ${formatTime(iso)}`
// 'YYYY-MM-DD' → "28 de oct de 2026" (mediodía de Colombia, para no cambiar de día).
const dayLabel = (date: string) => formatDate(`${date}T12:00:00-05:00`)

function useRequestDetail(id: string) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    // Formato inválido: se trata como inexistente, sin preguntar a la base de datos.
    const load = UUID.test(id)
      ? Promise.all([fetchRequest(id), fetchRequestEmails(id), fetchRequestAudit(id)])
      : Promise.resolve([null, [], null] as const)
    load
      .then(([row, emails, audit]) => {
        if (active) setLoaded({ row, emails: [...emails], audit, now: new Date() })
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'No se pudo cargar la PQRS.')
      })
    return () => {
      active = false
    }
  }, [id, version])

  return { loaded, error, reload: useCallback(() => setVersion((v) => v + 1), []) }
}

function Section({
  title,
  id,
  children,
  className,
}: {
  title: string
  id?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={cn('scroll-mt-24 space-y-3', className)}
    >
      <h3 id={id ? `${id}-title` : undefined} className="text-lg font-bold">
        {title}
      </h3>
      {children}
    </section>
  )
}

// Detalle de una PQRS (/dashboard/pqrs/:id): datos, solicitud, respuesta (escribirla y enviarla una
// sola vez, con vista previa del correo) e historial de correos.
export default function RequestDetailPage() {
  const { id = '' } = useParams()
  const { hash } = useLocation()
  const { can } = useAccess()
  const { loaded, error, reload } = useRequestDetail(id)
  const [response, setResponse] = useState('')
  const [responseError, setResponseError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<'respond' | 'resend' | null>(null)
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null)
  const [flash, setFlash] = useState<Flash | null>(null)
  const responseRef = useRef<HTMLTextAreaElement>(null)
  const row = loaded?.row ?? null
  useDocumentMeta({ title: `${row?.request_number ?? 'PQRS'} · PQRS · Dashboard`, noindex: true })

  // Desde "Responder" en la lista (#responder): llevar al campo de la respuesta.
  useEffect(() => {
    if (hash === '#responder' && row) {
      document.getElementById('responder')?.scrollIntoView({ block: 'start' })
      responseRef.current?.focus({ preventScroll: true })
    }
  }, [hash, row])

  if (error) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Alert variant="error">{error}</Alert>
      </div>
    )
  }
  if (!loaded) {
    return (
      <div className="flex justify-center py-16 text-primary">
        <Spinner size="lg" label="Cargando PQRS..." />
      </div>
    )
  }
  // Id inventado, mal copiado o de una PQRS que no existe (o que el usuario no puede ver): un aviso
  // claro y el camino de vuelta, en vez de redirigir sin explicar qué pasó.
  if (!row) {
    return (
      <div className="space-y-4">
        <BackLink />
        <EmptyState
          icon={<Icon paths={icons.question} />}
          title="Esta PQRS no existe"
          description="Revise el enlace o búsquela por su radicado en el listado."
          action={
            <ButtonLink to={PQRS_ADMIN_PATH} variant="secondary">
              Volver a PQRS
            </ButtonLink>
          }
        />
      </div>
    )
  }

  const pending = isPending(row.status)
  const canRespond = pending && can('pqrs.responder')
  const type = requestTypes[row.type]?.label ?? row.type
  const responseEmails = loaded.emails.filter((email) => email.kind.startsWith('pqrs_respuesta'))
  const lastResponseEmail = responseEmails.at(-1)

  const statusItems: ActionMenuItem[] = []
  if (can('pqrs.gestionar')) {
    if (row.status === 'recibida') {
      statusItems.push({
        label: 'Marcar en trámite',
        icon: icons.refresh,
        onSelect: () => setStatusAction('en_tramite'),
      })
    }
    if (pending)
      statusItems.push({ label: 'Cerrar sin respuesta', icon: icons.lock, onSelect: () => setStatusAction('cerrar') })
    if (row.status === 'cerrada')
      statusItems.push({ label: 'Reabrir', icon: icons.unlock, onSelect: () => setStatusAction('reabrir') })
  }

  function validateResponse() {
    const clean = response.trim()
    if (clean.length < RESPONSE_MIN_CHARS) {
      setResponseError(`La respuesta debe tener al menos ${RESPONSE_MIN_CHARS} caracteres.`)
      responseRef.current?.focus()
      return false
    }
    setResponseError(null)
    return true
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="space-y-4">
        <BackLink />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h2 className="font-mono text-2xl font-extrabold">{row.request_number}</h2>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={row.status} />
              <DeadlineBadge row={row} />
              <Badge>{type}</Badge>
            </div>
          </div>
          <ActionMenu label={`Opciones de la PQRS ${row.request_number}`} items={statusItems} />
        </div>
        {flash && (
          <Alert variant={flash.variant} onClose={() => setFlash(null)}>
            {flash.text}
          </Alert>
        )}
      </div>

      <dl className="grid gap-4 rounded-lg bg-surface-container-low p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-on-surface-variant">Ciudadano</dt>
          <dd className="font-medium text-on-surface">{row.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-on-surface-variant">Correo</dt>
          <dd className="flex flex-wrap items-center gap-2">
            <span className="break-all text-on-surface">{row.email}</span>
            <CopyButton value={row.email} label="Copiar" />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-on-surface-variant">Radicada</dt>
          <dd className="text-on-surface">{at(row.created_at)}</dd>
        </div>
        <div>
          <dt className="text-xs text-on-surface-variant">Plazo de respuesta</dt>
          <dd className="text-on-surface">{dayLabel(row.due_date)} (15 días hábiles, sin días no hábiles)</dd>
        </div>
      </dl>

      <Section title="Solicitud">
        <p className="rounded-lg bg-surface-container-lowest p-5 text-sm leading-relaxed whitespace-pre-wrap text-on-surface">
          {row.summary}
        </p>
      </Section>

      <Section title="Respuesta" id="responder">
        {row.status === 'respondida' && row.response && (
          <>
            <p className="rounded-lg bg-primary-container/40 p-5 text-sm leading-relaxed whitespace-pre-wrap text-on-surface">
              {row.response}
            </p>
            <p className="text-xs text-on-surface-variant">
              Respondida{loaded.audit?.responded_by_name ? ` por ${loaded.audit.responded_by_name}` : ''}
              {row.responded_at ? ` el ${at(row.responded_at)}` : ''}. La respuesta enviada no se puede modificar.
            </p>
          </>
        )}

        {row.status === 'cerrada' && (
          <Alert variant="info" live={false} title="Cerrada sin respuesta">
            {row.closed_reason}
            {row.closed_at && (
              <span className="mt-1 block text-xs">
                {loaded.audit?.updated_by_name ? `Por ${loaded.audit.updated_by_name}, el ` : 'El '}
                {at(row.closed_at)}.
              </span>
            )}
          </Alert>
        )}

        {pending && !canRespond && (
          <Alert variant="info" live={false}>
            Esta PQRS está pendiente. La respuesta la envía quien tiene el permiso de responder PQRS.
          </Alert>
        )}

        {canRespond && (
          <div className="space-y-4">
            <Textarea
              ref={responseRef}
              label="Escriba la respuesta"
              value={response}
              onChange={(e) => {
                setResponse(e.target.value)
                setResponseError(null)
              }}
              rows={10}
              maxLength={RESPONSE_MAX_CHARS}
              showCount
              error={responseError ?? undefined}
              hint={`Se enviará a ${row.email} desde ${NOTIFICATIONS_EMAIL}. Se envía una sola vez y no se puede modificar después.`}
            />
            {response.trim() && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-on-surface-variant">Vista previa del correo</p>
                <div className="space-y-3 rounded-lg bg-surface-container-low p-5 text-sm">
                  <p className="text-xs text-on-surface-variant">
                    Asunto:{' '}
                    <span className="font-semibold text-on-surface">
                      Respuesta a su PQRS – Radicado {row.request_number}
                    </span>
                  </p>
                  <p>Hola, {row.name}.</p>
                  <p>Esta es la respuesta a su {type.toLowerCase()}.</p>
                  <p className="border-l-4 border-primary bg-surface-container-lowest p-3 whitespace-pre-wrap">
                    {response.trim()}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Debajo va su solicitud original y el pie: "Este es un mensaje automático. Por favor, no conteste…".
                  </p>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => validateResponse() && setConfirming('respond')}>Enviar respuesta</Button>
            </div>
          </div>
        )}
      </Section>

      <Section title="Historial de correos">
        {loaded.emails.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Todavía no hay correos registrados para esta PQRS.</p>
        ) : (
          <ul className="space-y-2">
            {loaded.emails.map((email) => (
              <li
                key={`${email.kind}-${email.created_at}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-container-low px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-on-surface">{EMAIL_KINDS[email.kind] ?? email.kind}</p>
                  <p className="text-xs break-all text-on-surface-variant">
                    {email.recipient} · {at(email.created_at)}
                  </p>
                  {email.error && <p className="text-xs text-red-700 dark:text-red-400">{email.error}</p>}
                </div>
                <Badge variant={email.status === 'sent' ? 'success' : 'danger'}>
                  {email.status === 'sent' ? 'Enviado' : 'Falló'}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        {row.status === 'respondida' && can('pqrs.responder') && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-on-surface-variant">
              {lastResponseEmail?.status === 'failed'
                ? 'El último envío de la respuesta falló.'
                : 'Si el ciudadano no recibió la respuesta, puede reenviarla.'}
            </p>
            <Button variant="secondary" size="sm" onClick={() => setConfirming('resend')}>
              Reenviar respuesta
            </Button>
          </div>
        )}
      </Section>

      {confirming === 'respond' && (
        <ConfirmDialog
          open
          title="¿Enviar la respuesta?"
          confirmLabel="Enviar"
          icon={icons.pencil}
          onClose={() => setConfirming(null)}
          onConfirm={async () => {
            const { emailSent } = await respondRequest(row.id, response.trim())
            setConfirming(null)
            setResponse('')
            setFlash(
              emailSent
                ? { variant: 'success', text: `Respuesta enviada a ${row.email}.` }
                : {
                    variant: 'warning',
                    text: 'La respuesta quedó guardada, pero el correo no se pudo enviar. Use "Reenviar respuesta".',
                  },
            )
            reload()
          }}
        >
          <p>
            Se enviará a <strong className="break-all text-on-surface">{row.email}</strong> y la PQRS quedará como
            respondida. La respuesta no se puede modificar después.
          </p>
        </ConfirmDialog>
      )}

      {confirming === 'resend' && (
        <ConfirmDialog
          open
          title="¿Reenviar la respuesta?"
          confirmLabel="Reenviar"
          icon={icons.refresh}
          onClose={() => setConfirming(null)}
          onConfirm={async () => {
            await resendResponse(row.id)
            setConfirming(null)
            setFlash({ variant: 'success', text: `Respuesta reenviada a ${row.email}.` })
            reload()
          }}
        >
          <p>
            Se enviará otra vez la misma respuesta a <strong className="break-all text-on-surface">{row.email}</strong>.
          </p>
        </ConfirmDialog>
      )}

      {statusAction && (
        <StatusDialog
          action={statusAction}
          row={row}
          onClose={() => setStatusAction(null)}
          onDone={(message) => {
            setStatusAction(null)
            setFlash({ variant: 'success', text: message })
            reload()
          }}
        />
      )}
    </div>
  )
}

function BackLink() {
  return (
    <Link to={PQRS_ADMIN_PATH} className="inline-flex text-sm font-medium text-primary hover:underline">
      ← Volver a PQRS
    </Link>
  )
}
