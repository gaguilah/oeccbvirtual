# Plan: recuperar contraseña desde el inicio de sesión (construido el 2026-10-16, pendiente de desplegar)

Hoy, quien olvida su contraseña depende del Administrador de Sistema ("Restablecer contraseña" en
Usuarios, que genera una temporal). Con este plan, el usuario la recupera solo desde `/login`: pide un
enlace a su correo y elige una contraseña nueva. Rama propuesta: `recuperar-contrasena`.

## Cómo lo vería el usuario

1. En **Iniciar sesión**, enlace **"¿Olvidó su contraseña?"**.
2. Página **Recuperar contraseña**: escribe su correo, pasa el captcha y pulsa **Enviar enlace**.
   Siempre ve el mismo mensaje: "Si el correo está registrado, le enviamos un enlace para crear una
   contraseña nueva. Revise también el correo no deseado."
3. Recibe un correo de OECCB Virtual con el botón **Crear contraseña nueva** (válido 1 hora, se usa una
   vez).
4. Página **Crear contraseña nueva**: escribe la nueva dos veces (mismas reglas de Mi perfil: 8 a 72
   caracteres) y pulsa **Guardar**.
5. Entra al dashboard con la sesión iniciada. Recibe un segundo correo: "Su contraseña se cambió" (si
   no fue usted, avise al Administrador de Sistema).

Si el enlace venció o ya se usó: "Este enlace ya no es válido" con el botón **Pedir otro enlace**.

## Dos formas de hacerlo

| | A. Recuperación nativa de Supabase | B. Función propia con Resend (recomendada) |
|---|---|---|
| Cómo | `resetPasswordForEmail()` desde el navegador; Supabase envía el correo | Edge Function `password-reset` genera el enlace (`auth.admin.generateLink`, tipo `recovery`) y lo envía con `sendAndLog` |
| Correo | Plantilla en el panel de Supabase (fuera del repositorio) y SMTP propio obligatorio: el SMTP incluido de Supabase permite muy pocos correos por hora | Plantilla en el repositorio (`_shared/emails/`), con el mismo diseño y pie de los demás correos |
| Registro | No queda en `email_log` | Cada intento queda en `email_log`, como PQRS y Audiencias |
| Quién recibe | Cualquier cuenta de Auth, también desactivadas o sin rol | Solo usuarios **activos y con rol**; a los demás no se les envía nada |
| Captcha y límites | Los de Supabase | Turnstile (el mismo de PQRS y Encuesta) y límite propio por correo |
| Trabajo | Menos código, más configuración en el panel | Un poco más de código, todo en el repositorio |

Se recomienda **B**: sigue el patrón de los correos que ya existen, queda registrado y controla a quién
se le envía.

## Decisiones propuestas

| Tema | Propuesta |
|---|---|
| Respuesta al pedir el enlace | Siempre la misma, exista o no el correo (no revela qué correos tienen cuenta) |
| Quién puede recuperar | Usuarios activos y con rol. Desactivados o sin rol: no se envía nada (la respuesta es la misma) |
| Vigencia del enlace | 1 hora, un solo uso (configuración de Auth) |
| Límite | 1 enlace cada 5 minutos por correo y 5 al día, contados en `email_log` |
| Contraseña temporal pendiente | Si el usuario tenía la marca de cambio obligatorio, recuperar cuenta como cambio: se quita la marca (si no tiene cargo, Mi perfil se lo pide, como hoy) |
| Otras sesiones abiertas | Se cierran al guardar la contraseña nueva (en otros equipos deberá volver a entrar) |
| Aviso de cambio | Correo "Su contraseña se cambió" después de guardar |
| Restablecer desde Usuarios | Se mantiene, para quien no tenga acceso a su correo |

## Piezas

### Edge Function `password-reset` (sin verificación de JWT, como `submit-request`; acciones `request` y `notify-changed`)

1. Valida el correo y verifica Turnstile (`TURNSTILE_SECRET_KEY`).
2. Busca la cuenta: perfil activo y con rol. Si no cumple, responde el mensaje general y no envía.
3. Revisa el límite en `email_log` (tipo `password_reset`).
4. Genera el enlace de recuperación con la service role y arma la URL propia:
   `https://<sitio>/restablecer-contrasena?token_hash=…&type=recovery`.
5. Envía el correo con `sendAndLog` (plantilla nueva `passwordResetEmail`, en español, pie de siempre:
   mensaje automático, no responder).
6. Responde siempre `{ ok: true }` (salvo captcha inválido).

Una segunda acción, `notify-changed` (con el JWT del usuario), envía el aviso "Su contraseña se cambió"
y lo registra.

### Sitio

- `/recuperar-contrasena` y `/restablecer-contrasena`: en el mismo grupo de rutas que `/login` (encabezado
  del sitio, sin pie), con `noindex`.
- **Restablecer:** al abrir, valida el enlace con `verifyOtp({ token_hash, type: 'recovery' })`, que
  inicia la sesión; quita el token de la dirección (`history.replaceState`) para que no quede en el
  historial. Luego el formulario de contraseña nueva (`updateUser`), el cierre de otras sesiones, quitar
  la marca de cambio obligatorio si la tenía (`complete_password_change()`) y el aviso por correo.
- El formulario reutiliza las reglas de contraseña de `profile/schema.ts` y los mensajes de error de Auth
  en español de `profile/api.ts`.

### Configuración (sin código)

- Supabase → Authentication → URL Configuration: agregar la URL de `/restablecer-contrasena` del sitio
  en producción a las direcciones de redirección permitidas.
- Vigencia del enlace: 1 hora (valor actual de Auth; confirmar en el panel).
- Despliegue: `supabase functions deploy password-reset --no-verify-jwt`.

## Seguridad

- No revela qué correos tienen cuenta (respuesta única y tiempos similares).
- Captcha y límite por correo contra abuso.
- El token viaja en la dirección solo una vez: se valida y se quita de inmediato; la página no carga
  recursos de terceros que puedan recibirlo.
- El navegador nunca usa la service role: solo la Edge Function.
- Desactivar a un usuario sigue bloqueándolo: no recibe enlaces y no puede iniciar sesión.

## Riesgo a confirmar

Los correos de los usuarios son, en su mayoría, buzones institucionales. El buzón de la oficina ya
recibe correos de `oeccbvirtual.app` (confirmado el 2026-10-12), pero conviene probar con el buzón de
un usuario de cada juzgado antes de anunciarlo, por si algún filtro lo marca como no deseado.

## Fases

1. Edge Function, plantillas de correo y límite.
2. Páginas Recuperar y Crear contraseña nueva, enlace en Iniciar sesión.
3. Configuración de Auth y despliegue.
4. Documentación: `docs/modulos/mi-perfil.md`, `docs/modulos/usuarios-roles-permisos.md`, la guía Mi
   perfil de la Ayuda ("Olvidé mi contraseña") y `CLAUDE.md`.

## Verificación

- Correo registrado y activo: llega el enlace; crea la contraseña; entra; llega el aviso de cambio; la
  sesión de otro navegador se cierra.
- Correo no registrado, desactivado o sin rol: mismo mensaje en pantalla y no se envía nada (revisar
  `email_log`).
- Enlace vencido y enlace usado dos veces: "Este enlace ya no es válido".
- Límite: el segundo pedido antes de 5 minutos no envía otro correo.
- Usuario con contraseña temporal que recupera: queda sin la marca (o en Mi perfil si le falta el cargo).
- Captcha inválido: error en pantalla.
- Celular y escritorio, claro y oscuro; lint y build.

## Decisiones (2026-10-16)

1. Opción **B** (función propia con Resend).
2. Límite: 1 enlace cada 5 minutos y 5 al día por correo.
3. Se cierran las sesiones de otros equipos al guardar la contraseña nueva.
4. Se envía el correo "Su contraseña se cambió".
5. Pruebas con la cuenta `gaguilah@cendoj.ramajudicial.gov.co` (buzón institucional).

## Puesta en marcha

1. `supabase functions deploy password-reset --no-verify-jwt` (usa los secretos que ya existen:
   `RESEND_API_KEY`, `EMAIL_FROM`, `TURNSTILE_SECRET_KEY`).
2. Supabase → Authentication → URL Configuration → Redirect URLs: agregar
   `https://oeccbvirtual.app/restablecer-contrasena` (y `http://localhost:5173/restablecer-contrasena`
   para probar en local).
3. Confirmar en Authentication que la vigencia del enlace (Email OTP expiration) es 3600 segundos.
4. Publicar el sitio (las páginas nuevas) y probar con la cuenta de prueba.
