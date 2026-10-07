# Guía de despliegue

Cómo poner en marcha una copia de OECCB Virtual desde cero: base de datos (Supabase), captcha (Cloudflare Turnstile), sitio (Netlify), dominio propio y correos (Resend). Los pasos están en el orden que evita esperas y errores: cada uno deja listo lo que necesita el siguiente.

Tiempo estimado: 2 a 3 horas, más la espera de la verificación del dominio y del certificado (de minutos a una hora).

## 0. Requisitos

**Cuentas** (todas tienen plan gratuito suficiente para empezar):

| Servicio | Para qué |
| --- | --- |
| GitHub | Código fuente; Netlify despliega desde aquí |
| Supabase | Base de datos, inicio de sesión y Edge Functions |
| Cloudflare | Turnstile (captcha de PQRS y Encuesta) |
| Netlify | Publicación del sitio |
| Registrador de dominios (p. ej. Namecheap) | Dominio propio (necesario para Resend) |
| Resend | Envío de correos |

**En el equipo:**

- Git y Node.js 22 (Vite 8 necesita Node 20.19+ o 22.12+).
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`supabase --version`).

> **Red institucional:** si se trabaja desde una red con filtro web (p. ej. Fortinet), un dominio recién comprado puede salir bloqueado como "Unrated" (sin categoría) aunque esté bien configurado. Ver "Problemas comunes".

---

## 1. Código

```bash
git clone https://github.com/<usuario>/oeccbvirtual.git
cd oeccbvirtual
npm install
```

Si es un sitio nuevo (no una copia de prueba), revisar y cambiar los datos propios de la oficina:

- `src/lib/contact.ts`: nombre oficial, correo, dirección, horario, ciudad, enlace a Google Maps.
- `src/lib/courts.ts`: juzgados y su código de despacho en el portal de publicaciones.
- Favicon y textos de `index.html`.

## 2. Supabase: proyecto y primer usuario

1. En [supabase.com](https://supabase.com), **New project**. Guardar la contraseña de la base de datos.
2. **Authentication → Sign In / Providers → Email:**
   - Desactivar **Allow new users to sign up** (las cuentas solo se crean desde el dashboard).
   - Activar **Secure password change**.
3. **Authentication → Users → Add user → Create new user:** crear la cuenta del **primer superadmin** (correo y contraseña), marcando *Auto Confirm User*.
4. **Antes de aplicar las migraciones**, poner ese correo en `supabase/migrations/20261005150000_roles_permissions.sql` (busca `gaguilah@gmail.com`; aparece dos veces). La migración le asigna el rol `superadmin` y **falla si el correo no existe** en Auth.

## 3. Supabase: base de datos

```bash
supabase login
supabase link --project-ref <ref-del-proyecto>     # el ref sale en la URL del proyecto
supabase db push                                    # aplica supabase/migrations en orden
```

Si el equipo está en una red que bloquea el puerto de Postgres (la CLI se queda en "Initialising login role…" y falla por timeout), aplicar cada archivo de `supabase/migrations/` en orden en **SQL Editor** del panel, y registrarlos después con `supabase migration repair --status applied <timestamp>`.

**Datos que las migraciones no crean** (se cargan a mano, una vez):

- **Encuesta:** una fila en `surveys` con `code = 'satisfaccion-oeccb'` e `is_active = true`, y sus preguntas en `survey_questions`. Sin ella, `/encuesta` muestra que no hay encuesta disponible. Ejemplo:
  ```sql
  with s as (
    insert into public.surveys (code, title) values ('satisfaccion-oeccb', 'Encuesta de satisfacción')
    returning id
  )
  insert into public.survey_questions (survey_id, code, position, text, type, scale_min, scale_max, min_label, max_label)
  select id, 'atencion', 1, '¿Cómo califica la atención recibida?', 'scale', 1, 5, 'Mala', 'Excelente' from s
  union all
  select id, 'resuelto', 2, '¿Se resolvió su solicitud?', 'yes_no', null, null, null, null from s;
  ```
  Tipos: `yes_no` (sí / no) y `scale` (con `scale_min`, `scale_max` y sus etiquetas).
- **Carpeta de publicación de los avisos de remate:** se puede agregar después desde el dashboard (*Avisos de Remate → Carpetas*), o por SQL:
  ```sql
  insert into public.pdf_folders (group_id, folder_id, valid_from)
  values (6098902, 210268129, '2026-01-01');   -- los dos números de la URL de los PDF del portal
  ```
  Sin carpeta vigente no se pueden crear avisos (`no_pdf_folder`).

**Comprobar:**

```sql
select r.code from public.profiles p join public.roles r on r.id = p.role_id
join auth.users u on u.id = p.id where u.email = '<correo-del-superadmin>';   -- superadmin
```

## 4. Cloudflare Turnstile (captcha)

1. En [dash.cloudflare.com](https://dash.cloudflare.com), menú **Turnstile** (o buscar "Turnstile") → **Add widget**.
2. **Hostnames:** `localhost` por ahora. Se agregan los demás en los pasos 7 y 8.
3. Modo **Managed**. Guardar.
4. Copiar el **Site Key** (público) y el **Secret Key** (secreto).

## 5. Secretos y Edge Functions

Los secretos viven solo en Supabase; nunca en el repo ni en las variables `VITE_*`.

```bash
supabase secrets set TURNSTILE_SECRET_KEY=<secret-key-de-turnstile>
```

(`RESEND_API_KEY` y `EMAIL_FROM` se agregan en el paso 9.)

Desplegar las funciones:

```bash
supabase functions deploy submit-request --no-verify-jwt   # PQRS (la llama el sitio público)
supabase functions deploy submit-survey --no-verify-jwt    # Encuesta (ídem)
supabase functions deploy manage-users                     # Usuarios del dashboard: CON verificación de JWT
```

Comprobar con `supabase functions list`: las tres en `ACTIVE`; `manage-users` con `verify_jwt: true` y las otras dos con `false`.

## 6. Prueba local

Crear dos archivos en la raíz (ambos están en `.gitignore`):

`.env`

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>       # Project Settings → API Keys
```

`.env.local`

```
VITE_TURNSTILE_SITE_KEY=<site-key-de-turnstile>
```

```bash
npm run dev
```

Probar: el inicio, Avisos de Remate, una PQRS (el captcha debe pasar), y `/login` con el superadmin → el dashboard debe mostrar "Superadmin" bajo el nombre.

## 7. Netlify (sitio publicado)

1. Subir el código a GitHub (si es un repo nuevo).
2. En [app.netlify.com](https://app.netlify.com): **Add new site → Import an existing project → GitHub** → el repositorio, rama `main`. La compilación la toma de `netlify.toml` (`npm run build`, carpeta `dist`, Node 22).
3. **Antes de desplegar**, en *Add environment variables* (o después en *Site configuration → Environment variables*), las tres variables del paso 6, con alcance **Builds** y contexto **All**:
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_TURNSTILE_SITE_KEY`.
4. **Deploy.** Luego *Site configuration → Change site name* (p. ej. `oeccbvirtual` → `oeccbvirtual.netlify.app`).
5. Si el equipo de Netlify protege los sitios: *Site configuration → Access & security → Visitor access* → sin protección (si no, todo responde "401 Login Redirect").
6. **Turnstile:** agregar el hostname `<nombre>.netlify.app`.
7. **Supabase → Authentication → URL Configuration → Redirect URLs:** agregar `https://<nombre>.netlify.app`.

**Si se cambian las variables `VITE_*` después**, hay que volver a compilar: *Deploys → Trigger deploy → Clear cache and deploy site* (Vite las escribe dentro del código al compilar).

Las rutas de la app (`/tutoriales`, `/dashboard`…) funcionan gracias a `public/_redirects`.

## 8. Dominio propio (ejemplo: Namecheap)

El DNS se deja en el registrador; ahí se agregan los registros de Netlify y, en el paso 9, los de Resend.

1. **Netlify:** *Domain management → Add a domain* → `<dominio>` → configurar el DNS **externamente**. Netlify agrega también `www.<dominio>`.
2. **Namecheap → Domain List → Manage → Advanced DNS:**
   - Borrar los registros de "dominio estacionado": CNAME `www → parkingpage.namecheap.com` y el *URL Redirect Record* de `@`.
   - Agregar:

     | Tipo | Host | Valor |
     | --- | --- | --- |
     | A Record | `@` | `75.2.60.5` (o el que indique Netlify) |
     | CNAME Record | `www` | `<nombre>.netlify.app` |

   - En **Host** va solo la parte antes del dominio (`@`, `www`): Namecheap agrega el dominio solo.
   - No tocar los MX ni el TXT `v=spf1 include:spf.efwd…` si se usa el reenvío de correo de Namecheap.
3. Esperar a que el DNS se propague (los registros anteriores pueden quedar en caché hasta ~1 hora).
4. **Netlify → Domain management → HTTPS:** *Verify DNS configuration* → **Provision certificate** (Let's Encrypt). **No** usar *Provide your own certificate*.
5. Elegir el dominio principal (p. ej. `<dominio>`; `www` redirige a él).
6. **Turnstile:** agregar `<dominio>` y `www.<dominio>`.
7. **Supabase → Authentication → URL Configuration:** **Site URL** = `https://<dominio>`; en **Redirect URLs**, el dominio y la dirección `.netlify.app`.

Los dominios `.app` solo funcionan con HTTPS (lo exigen los navegadores): no abren hasta que el certificado esté emitido.

## 9. Resend (correos)

1. En [resend.com](https://resend.com): **Domains → Add Domain** → `<dominio>` (el raíz; los registros de Resend van en subdominios y no chocan con el correo del dominio).
2. Resend muestra los registros a crear. **Copiarlos exactamente desde Resend** (los valores cambian por cuenta y región). Al momento de escribir esta guía eran:

   | Tipo | Host | Valor |
   | --- | --- | --- |
   | TXT Record | `resend._domainkey` | `p=MIGf…` (llave DKIM completa, sin comillas) |
   | CNAME Record | `send` | el que indique Resend (p. ej. `send.forge.rmta.net`) |
   | CNAME Record | `rsend` | el que indique Resend (p. ej. `rsend-sae1.forge.rmta.net`) |

   Recomendado, aunque Resend no lo pida: TXT `_dmarc` = `v=DMARC1; p=none;` (ayuda a no caer en spam).
3. Agregarlos en **Namecheap → Advanced DNS** (Host: solo la parte antes del dominio).
4. En Resend, abrir el dominio y pulsar **Verify DNS Records**. El estado pasa de **Not Started** a *Pending* y a **Verified**. (Mientras no se pulse, se queda en "Not Started" aunque los registros ya estén publicados.)
5. **API Keys → Create API Key:** permiso **Sending access**, solo para ese dominio. Se muestra una sola vez.
6. Guardar en Supabase:

   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxx
   supabase secrets set EMAIL_FROM="OECCB Virtual <notificaciones@<dominio>>"
   ```

   Comprobar con `supabase secrets list` (muestra el nombre y una huella, nunca el valor).

## 10. Comprobación final

En `https://<dominio>` (desde una red sin filtro web, p. ej. datos móviles):

- [ ] El inicio carga con el candado de HTTPS; `www.<dominio>` redirige al principal.
- [ ] `/avisos-remates` muestra los avisos publicados; una ruta inexistente muestra "Página no encontrada".
- [ ] Una PQRS de prueba se envía (el captcha pasa).
- [ ] La encuesta carga y se puede responder.
- [ ] `/login` con el superadmin → dashboard con "Superadmin"; crear un usuario de prueba en *Usuarios* (muestra la contraseña temporal) e iniciar sesión con él (debe pedir cambiarla).
- [ ] En Resend, *Logs* muestra los envíos (cuando estén construidos los correos).

## Problemas comunes

| Síntoma | Causa | Solución |
| --- | --- | --- |
| Página en blanco o "supabaseUrl is required" en la consola | Faltan las variables `VITE_*` en la compilación de Netlify | Agregarlas (alcance *Builds*) y *Clear cache and deploy site* |
| Todo responde **401 "Login Redirect"** | Netlify protege el sitio | *Visitor access* → sin protección |
| El captcha falla en un dominio | El hostname no está en Turnstile | Agregarlo en el widget |
| "We could not provision a Let's Encrypt certificate" | El DNS aún no se propagaba | Esperar ~1 hora, *Verify DNS configuration*, *Provision certificate* |
| "certificate parameter is required when updating an existing certificate" | Ya hay un certificado emitido (el botón intenta actualizarlo) o se usó *Provide your own certificate* | Cancelar: comprobar que el dominio ya abre con HTTPS |
| El dominio responde **403 "Acceso Web Bloqueado… Unrated"** | Filtro web de la red institucional (dominio nuevo sin categoría) | Pedir reclasificación (enlace en la página de bloqueo / FortiGuard) o que la mesa de servicio lo permita; mientras tanto, usar la dirección `.netlify.app` |
| Un registro DNS no aparece con su nombre | Se escribió el dominio completo en *Host* y quedó duplicado (`send.<dominio>.<dominio>`) | En *Host* va solo `send`, `www`, `@`… |
| Resend sigue en "Not Started" | No se pulsó *Verify DNS Records* | Abrir el dominio en Resend y verificar |
| `supabase db push` se queda en "Initialising login role…" | La red bloquea el puerto de Postgres | Aplicar las migraciones en SQL Editor (paso 3) |
| La migración de roles falla con "No existe en auth.users la cuenta del primer superadmin" | El correo de la migración no existe en Auth | Crear el usuario (paso 2.3) y poner su correo en la migración (2.4) |
