# Plan: correos con Resend (propuesta del 2026-10-06)

Correos automáticos del sitio con [Resend](https://resend.com): acuse de recibo y respuesta de las PQRS (ahora) y, cuando exista la sección Audiencias, el listado semanal y los recordatorios (futuro). Este documento es solo el plan; los pasos para configurar Resend están al final.

## Correos previstos

| # | Correo | Para quién | Cuándo | Fase |
| --- | --- | --- | --- | --- |
| 1 | Acuse de recibo de la PQRS | El ciudadano que la envió | Al enviar el formulario de `/pqrs` | 1 |
| 2 | Aviso de PQRS nueva (opcional) | El buzón de la oficina | Al mismo tiempo que el 1 | 1 |
| 3 | Respuesta a la PQRS | El ciudadano | Cuando un usuario del dashboard la responde | 2 (con la sección PQRS) |
| 4 | Audiencias de la semana | Usuarios internos | Lunes 7:30 a. m. (hora de Colombia) | 3 (con la sección Audiencias) |
| 5 | Recordatorio de audiencia | Por definir (internos y/o partes) | 15 minutos antes de cada audiencia | 3 (con la sección Audiencias) |

## Principios

- **Nunca desde el navegador.** La API key de Resend es secreta: solo vive como secreto de Supabase (`RESEND_API_KEY`) y la usan las Edge Functions, igual que `TURNSTILE_SECRET_KEY` y la service role key.
- **Un solo módulo de envío:** `supabase/functions/_shared/email.ts` con `sendEmail({ to, subject, html, text, replyTo })` (llama a `POST https://api.resend.com/emails`) y las plantillas en `_shared/emails/`. Todas las funciones lo usan; si algún día se cambia de proveedor, se cambia solo ahí.
- **El correo no bloquea la acción.** Si Resend falla, la PQRS igual se guarda (y la respuesta igual queda registrada): el error se anota en un registro de envíos y se puede reintentar. Al ciudadano no se le muestra un error por el correo.
- **Registro de envíos:** tabla `email_log` (tipo, destinatario, asunto, id de Resend, estado, error, fecha, referencia al registro que lo originó). Sirve para saber qué se envió, reintentar y no enviar dos veces el mismo recordatorio. RLS sin políticas (solo la leen y escriben las funciones); más adelante, una vista en el dashboard si hace falta.
- **Remitente y respuestas:** se envía desde una dirección del dominio verificado (p. ej. `notificaciones@<dominio>`) con `reply_to` al correo de la oficina (`CONTACT_EMAIL` de `src/lib/contact.ts`), para que si el ciudadano responde, le llegue a la oficina.
- **Plantillas:** HTML sencillo y legible en cualquier cliente (tablas, estilos en línea, sin imágenes externas pesadas), siempre con versión en texto plano, en español, con `OFFICE_NAME`, y sin datos sensibles de más.
- **Datos personales (Ley 1581 de 2012):** el formulario de PQRS debe avisar que el correo se usará para enviar el acuse y la respuesta. Se agrega ese texto en el paso de contacto.

## Fase 0: configuración (una vez)

Ver "Pasos para configurar Resend" al final. Resultado: dominio verificado en Resend, API key guardada como secreto en Supabase y una prueba de envío exitosa.

## Fase 1: acuse de recibo de la PQRS

### Base de datos

- `customer_requests` recibe un **número de radicado** legible para el ciudadano, p. ej. `PQRS-2026-000123` (secuencia por año), generado por la base de datos al insertar. Hoy solo tiene el `id` (uuid), que no sirve para citar en un correo o una llamada.
- Tabla `email_log` (ver Principios).

### Edge Function `submit-request`

Después de insertar la PQRS (sin cambiar lo que ya hace):

1. Envía al ciudadano el correo 1: "Recibimos su PQRS". Contenido: radicado, tipo, fecha, el resumen que escribió, plazo de respuesta y datos de contacto de la oficina.
2. (Opcional) Envía al buzón de la oficina el correo 2 con los mismos datos y un enlace al dashboard.
3. Anota cada envío en `email_log`. Si falla, la respuesta al formulario sigue siendo exitosa.
4. La pantalla de "Solicitud enviada" del sitio muestra el radicado y dice que se envió una copia al correo.

### Formulario `/pqrs`

- Aviso de tratamiento de datos en el paso de contacto.
- `RequestSent` muestra el número de radicado (lo devuelve la función).

## Fase 2: respuesta de la PQRS (con la sección PQRS del dashboard)

La sección PQRS del dashboard tendrá su propio plan; aquí solo la parte del correo.

- Permisos: `pqrs.ver` y `pqrs.responder` (por juzgado si las PQRS se asignan a un juzgado; si no, de alcance general; se decide en ese plan).
- `customer_requests` suma `responded_at` y `responded_by`; `status` pasa a tener valores claros (recibida, en trámite, respondida).
- Edge Function nueva `respond-request` (con verificación de JWT, como `manage-users`):
  1. Comprueba `pqrs.responder` con `has_permission`.
  2. Guarda la respuesta, `responded_by`, `responded_at` y el estado.
  3. Envía al ciudadano el correo 3: radicado, su solicitud original y la respuesta, con `reply_to` a la oficina.
  4. Anota el envío. Si el correo falla, la respuesta queda guardada y el dashboard muestra "Respondida, pero el correo no se pudo enviar" con un botón "Reenviar".
- En el dashboard, antes de enviar: vista previa del correo y el `ConfirmDialog` ("¿Enviar la respuesta?").
- Adjuntos (p. ej. un PDF con la respuesta formal): fuera de la primera versión; Resend los admite si después hacen falta.

## Fase 3: Audiencias (futuro, con la sección Audiencias)

### Listado semanal: lunes 7:30 a. m.

- Colombia está siempre en UTC−5: lunes 7:30 a. m. = **lunes 12:30 UTC**. Cron: `30 12 * * 1`.
- Programación con **`pg_cron` + `pg_net`** en Supabase: el cron llama a la Edge Function `send-weekly-hearings` con un secreto propio en la cabecera (no la abre al público).
- La función reúne las audiencias de lunes a domingo de esa semana y envía a cada usuario con `audiencias.ver` el listado que le corresponde según su alcance: un usuario de juzgado, solo las de su juzgado; Oficina, las de los dos.
- Un solo correo por persona, con la tabla de audiencias (día, hora, radicado, juzgado, sala o enlace). Si no hay audiencias, se envía "No hay audiencias programadas esta semana" o no se envía (se decide en ese plan).
- `email_log` con la semana como referencia evita duplicados si el cron se ejecuta dos veces.

### Recordatorio 15 minutos antes

- Cron cada 5 minutos (`*/5 * * * *`) que llama a `send-hearing-reminders`.
- La función busca audiencias que empiezan entre 10 y 20 minutos después y que aún no tienen recordatorio (`reminder_sent_at` vacío), envía el correo y marca `reminder_sent_at`. Con esa marca nunca se envía dos veces, aunque el cron se solape.
- Destinatarios por definir en el plan de Audiencias: usuarios internos asignados y/o correos de las partes (si se registran).
- Una audiencia reprogramada vuelve a quedar con `reminder_sent_at` vacío.

## Pruebas

- En desarrollo, los envíos van a las direcciones de prueba de Resend (`delivered@resend.dev`, `bounced@resend.dev`) o a correos propios, nunca a ciudadanos reales.
- Cada plantilla se revisa en Gmail y Outlook (escritorio y celular) y en modo oscuro.
- El panel de Resend (Logs / Emails) muestra cada envío, su estado (entregado, rebotado) y el contenido.

## Límites y costos (verificar en resend.com/pricing antes de empezar)

- El plan gratuito de Resend permite un número limitado de correos al día y al mes y un solo dominio. Para el volumen de PQRS de una oficina suele bastar; las audiencias (listados + recordatorios) suman más, así que se revisa cuando llegue la fase 3.
- Si se supera, el envío falla con un error que queda en `email_log`, sin afectar la PQRS.

## Dominio (decidido el 2026-10-06)

- Dominio propio: **`oeccbvirtual.app`** (Namecheap). El DNS se queda en Namecheap: ahí van los registros de Netlify (sitio) y de Resend (correo).
- En Resend se verifica el dominio raíz; sus registros van en `send` y `resend._domainkey`, así que no chocan con el reenvío de correo de Namecheap.
- Remitente: `OECCB Virtual <notificaciones@oeccbvirtual.app>` (`EMAIL_FROM`).
- `.app` exige HTTPS en los navegadores: Netlify emite el certificado.
- Al pasar al dominio: agregarlo en Cloudflare Turnstile (hostnames del widget) y en Supabase Auth (Site URL y Redirect URLs).

## Preguntas abiertas

1. ~~**Dominio para enviar.**~~ Resuelto arriba. Contexto original: Resend exige enviar desde un dominio propio verificado con registros DNS. El dominio de la Rama Judicial (`cendoj.ramajudicial.gov.co`) no lo administra la oficina, así que normalmente no se puede usar. ¿El sitio tiene o tendrá un dominio propio (p. ej. el que se use con Netlify)? Sin dominio, Resend solo deja enviar correos de prueba a la dirección de la cuenta.
2. **Aviso a la oficina (correo 2):** ¿se quiere que el buzón de la oficina reciba cada PQRS nueva, o basta con verla en el dashboard?
3. **Plazo de respuesta** que se menciona en el acuse (p. ej. 15 días hábiles para peticiones, según la Ley 1755 de 2015): ¿qué texto usa la oficina?

---

## Pasos para configurar Resend

1. **Crear la cuenta** en [resend.com](https://resend.com) (con el correo de quien administrará el envío).
2. **Agregar el dominio:** en Resend, *Domains → Add Domain*, escribir el dominio (recomendado un subdominio, p. ej. `notificaciones.<dominio>`, para no afectar el correo principal del dominio) y elegir la región.
3. **Publicar los registros DNS** que Resend muestra (un registro TXT/MX para SPF y uno o varios para DKIM; DMARC recomendado) en el proveedor donde se administra el dominio (p. ej. Netlify DNS o el registrador). Esperar a que Resend marque el dominio como **Verified** (de minutos a unas horas).
4. **Crear la API key:** *API Keys → Create API Key*, con permiso **Sending access** y limitada a ese dominio. Copiarla: solo se muestra una vez.
5. **Guardarla en Supabase como secreto** (nunca en `.env` del frontend ni en el repo):
   ```
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxx
   supabase secrets set EMAIL_FROM="OECCB Virtual <notificaciones@notificaciones.<dominio>>"
   ```
   También se puede hacer en el panel de Supabase: *Edge Functions → Secrets*.
6. **Prueba rápida** (desde una terminal, con la API key) para confirmar que el dominio envía:
   ```
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer re_xxxxxxxxx" \
     -H "Content-Type: application/json" \
     -d '{"from":"OECCB Virtual <notificaciones@notificaciones.<dominio>>","to":"su-correo@ejemplo.com","subject":"Prueba","text":"Hola desde Resend"}'
   ```
7. Con eso listo, se construye la fase 1 (módulo de envío, acuse de la PQRS y registro de envíos) y se despliega `submit-request` de nuevo con `--no-verify-jwt`, como hoy.
