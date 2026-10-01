# OECCB Virtual

Sitio web de servicios digitales para ciudadanos de la **Oficina de Apoyo para los Juzgados Civiles del Circuito de Ejecución de Sentencias de Bucaramanga (OECCB)**.

## Servicios

| Ruta | Descripción |
| --- | --- |
| `/` | Página de inicio con acceso a los servicios |
| `/remates` | Consulta de avisos de remate |
| `/pqrs` | Formulario de peticiones, quejas, reclamos, sugerencias y felicitaciones |
| `/encuesta` | Encuesta de satisfacción del servicio |
| `/tutoriales` | Guías de uso de los servicios digitales |
| `/contacto` | Datos de contacto de la oficina |
| `/login`, `/dashboard` | Acceso del personal (las cuentas no se crean desde el sitio) |

## Tecnologías

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (con modo claro y oscuro)
- React Router v7
- Zod para validar formularios
- Supabase (autenticación, Postgres y Edge Functions)
- Cloudflare Turnstile como captcha en PQRS y en la encuesta

## Requisitos

- Node.js 20 o superior
- Un proyecto de Supabase
- Un sitio de Cloudflare Turnstile
- [Supabase CLI](https://supabase.com/docs/guides/cli) para aplicar migraciones y desplegar funciones

## Instalación

```bash
npm install
```

Crea un archivo `.env.local` en la raíz (no se sube al repositorio):

```env
VITE_SUPABASE_URL=https://<proyecto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<clave publicable de Supabase>
VITE_TURNSTILE_SITE_KEY=<site key de Turnstile>
```

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Verifica tipos y genera la versión de producción en `dist/` |
| `npm run preview` | Sirve localmente la versión de producción |
| `npm run lint` | Revisa el código con ESLint |

## Backend (Supabase)

El sitio no tiene servidor propio. El navegador lee los datos públicos con el cliente de Supabase, y los formularios se envían a Edge Functions que verifican el captcha antes de guardar.

- **Migraciones** (`supabase/migrations/`): tablas de la encuesta y la función SQL `submit_survey_response`.
- **Edge Functions** (`supabase/functions/`):
  - `submit-request`: recibe las PQRS y las guarda en `customer_requests`.
  - `submit-survey`: recibe las respuestas de la encuesta.

Aplicar migraciones y desplegar:

```bash
supabase db push
supabase secrets set TURNSTILE_SECRET_KEY=<secret key de Turnstile>
supabase functions deploy submit-request --no-verify-jwt
supabase functions deploy submit-survey --no-verify-jwt
```

La clave secreta de Turnstile y la `service_role` de Supabase solo deben existir en el servidor, nunca en el frontend ni en `.env.local`.

## Documentación

- [`design.md`](design.md): guía visual (colores, tipografía, superficies).
- [`CLAUDE.md`](CLAUDE.md): arquitectura y convenciones del código.
