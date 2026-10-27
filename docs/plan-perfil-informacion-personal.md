# Plan: Mi perfil con pestañas, información personal y contacto de emergencia (propuesta, 2026-10-27)

Hoy Mi perfil (`/dashboard/perfil`, ver [modulos/mi-perfil.md](modulos/mi-perfil.md)) muestra en una sola
columna el formulario de nombre y cargo (`ProfileNameForm`) y el de contraseña (`PasswordForm`). Con este
plan, la página se organiza en pestañas y suma dos secciones nuevas que cada funcionario llena sobre sí
mismo: **Información personal** y **Contacto de emergencia**. El Director de oficina y el Administrador de
Sistema pueden consultarlas, sin editarlas. Rama propuesta: `perfil-informacion-personal`.

## Decisiones tomadas (2026-10-27)

1. Solo el propio usuario ve y edita su información. El Director de oficina y el Administrador de Sistema
   solo la consultan. En código se verifica un permiso (`usuarios.datos_personales`), nunca el nombre del rol.
2. Tratamiento de datos: textos de ayuda junto a los campos (para qué se usa el dato y quién lo ve), sin
   casilla de aceptación.
3. Nada es obligatorio y no hay tarjeta ni aviso que recuerde completarlo. **Cada campo es opcional por
   separado**: el usuario registra solo los que quiera (ni siquiera la sección se exige completa).
4. Pestañas: **Cuenta** · **Información personal** · **Contacto de emergencia** · **Contraseña**.
5. Dirección en texto libre, un solo campo.

## Cómo lo vería el usuario

| Pestaña | Contenido | Estado |
|---|---|---|
| **Cuenta** | Nombre, cargo, correo de la cuenta (solo lectura) | Ya existe (`ProfileNameForm`) |
| **Información personal** | Dirección de residencia, celular, correo personal, EPS | Nueva |
| **Contacto de emergencia** | Nombre, parentesco, celular | Nueva |
| **Contraseña** | Contraseña actual y nueva | Ya existe (`PasswordForm`) |

- En celular la fila de pestañas se desplaza de lado, como en Ayuda.
- Cada pestaña tiene su propio botón **Guardar** y su mensaje de éxito o error; guardar una no toca las
  otras. Abajo de cada pestaña nueva: "Última actualización: <fecha>" cuando ya hay datos.
- La pestaña abierta queda en la dirección (`/dashboard/perfil?pestana=contacto-emergencia`); valor
  desconocido → **Cuenta**. "Atrás" del navegador funciona.
- Cambiar de pestaña con cambios sin guardar no los pierde: los paneles siguen montados y solo se ocultan.
- Primer ingreso (`must_change_password`): se abre **Cuenta** con el aviso actual (elegir cargo); al
  guardar el cargo pasa sola a **Contraseña**. Las pestañas nuevas se pueden abrir pero no se exigen.
- **Quitar estos datos**: botón secundario en cada pestaña nueva con datos guardados (confirmado con
  `ConfirmDialog`), que vacía la sección. Así el usuario puede retirar su información cuando quiera.

### Textos de ayuda

Con el `hint` que ya tienen `Input` y `Select`, y una línea al inicio de cada pestaña nueva:

- Información personal (inicio): "Estos datos son opcionales. Solo usted puede editarlos; el Director de
  oficina y el Administrador de Sistema pueden consultarlos para comunicarse con usted o atender una
  emergencia."
- Celular: "10 dígitos, por ejemplo 300 123 4567."
- Correo personal: "Distinto del correo con el que ingresa al dashboard."
- EPS: "Se usa solo para informar a los servicios de salud en caso de emergencia."
- Contacto de emergencia (inicio): "Persona a quien la oficina llamará si usted tiene una emergencia en el
  trabajo. Asegúrese de que esté de acuerdo en que registre su número."

El texto final lo aprueba la oficina; vive en `profile/personalData.ts` y se resume en la guía de Ayuda.

## Datos y reglas

Todos los campos son opcionales; las reglas se aplican solo al campo que tenga valor (vacío se guarda como
`null`). Si el contacto de emergencia tiene nombre pero no celular, se guarda igual, con un aviso (no bloqueo):
"Sin celular, no podremos llamar a su contacto".

| Campo | Regla |
|---|---|
| Dirección de residencia | Texto libre, 5 a 200 caracteres, sin saltos de línea |
| Celular | 10 dígitos que empiezan por 3. Se escribe con o sin espacios; se guardan solo los dígitos y se muestra `3XX XXX XXXX` |
| Correo personal | Formato de correo, máx. 254, en minúsculas. Aviso (no bloqueo) si es el de la cuenta |
| EPS | De la lista `eps_entities` (se administra en el SQL Editor, como `job_positions`) |
| Contacto: nombre | Misma regla del nombre del perfil (letras con tildes, 3 a 120) |
| Contacto: parentesco | Lista fija: Madre, Padre, Cónyuge o compañero(a) permanente, Hijo(a), Hermano(a), Otro familiar, Amigo(a), Otro |
| Contacto: celular | Misma regla del celular. Aviso (no bloqueo) si es igual al celular propio |

- Las reglas viven **en dos lugares que se cambian juntos**: el esquema zod (`profile/personalSchema.ts`) y
  las restricciones `check` de la tabla. La regla del nombre se extrae de `profile/schema.ts` para usarla
  en ambos esquemas.
- Parentesco: lista fija en código (`profile/personalData.ts`) + `check` en la base. EPS como catálogo
  porque las EPS se fusionan o cambian de nombre, y eso no debe requerir cambiar código.

## Consulta del Director de oficina y el Administrador de Sistema

- Permiso nuevo **`usuarios.datos_personales`** ("Ver información personal": "Consultar la información
  personal y el contacto de emergencia de los usuarios"), creado en la misma migración junto con la función
  que lo verifica. Se asigna a `director_oficina`; el superadmin lo tiene implícito. Después se puede dar a
  otro rol desde Roles, sin código.
- En **Usuarios**, menú ⋮ de cada fila: **Ver información personal** (solo con el permiso; en la fila
  propia no, porque ya la ve en Mi perfil). Abre un `Modal` de solo lectura con las dos secciones, "Sin
  registrar" cuando una está vacía, la fecha de última actualización, celulares como enlace `tel:` y el
  correo como `mailto:`.
- Se lee con la función `get_user_personal_info(p_user_id)` (`security definer`, `search_path` vacío), que
  rechaza sin `has_permission('usuarios.datos_personales')` y, para roles con alcance `court`, solo devuelve
  usuarios de su juzgado. No hay política de lectura para otros sobre la tabla: el permiso no da escritura
  por ningún camino.
- Usuarios se abre con `usuarios.ver`, que el Director de oficina ya tiene (confirmado en la base el
  2026-10-27), así que la migración no se lo asigna. El rol Oficina también tiene `usuarios.ver`, pero **no**
  recibe el permiso nuevo: ve la lista de usuarios sin la opción "Ver información personal".

## Base de datos (una migración)

`supabase/migrations/2026MMDDhhmmss_profile_personal_info.sql`:

1. **`eps_entities`** (`id` identity, `name` único, `is_active`): `grant select` a `authenticated` +
   política `using (true)`, igual que `job_positions`. Una inactiva no se ofrece en la lista pero se sigue
   mostrando a quien ya la tiene. Carga inicial (verificar contra el listado vigente del Ministerio de Salud
   antes de la migración; el Decreto 0182 de 2026 reorganizó qué EPS opera en cada municipio):
   - Contributivo: Aliansalud, Compensar, Coosalud, Famisanar, Mutual SER, Nueva EPS, Salud Mía, Salud
     Total, Sanitas, SOS (Servicio Occidental de Salud), Sura.
   - Subsidiado o movilidad, por si aplica: Asmet Salud, Cajacopi Atlántico, Capital Salud, Capresoca,
     Comfachocó, Comfaoriente, Emssanar, Familiar de Colombia, Savia Salud.
   - Régimen especial o de excepción: Fuerzas Militares, Policía Nacional, Magisterio (FOMAG), Ecopetrol,
     Universidades públicas.
   - **Otra** (siempre al final).
2. **`profile_personal_info`**, una fila por usuario (`user_id uuid primary key references
   public.profiles(id) on delete cascade`): `residence_address`, `mobile_phone`, `personal_email`, `eps_id`
   (FK a `eps_entities`), `emergency_name`, `emergency_relationship`, `emergency_phone`, `updated_at`.
   - Tabla aparte y no columnas en `profiles`: `profiles` la leen `list_users()`, `get_my_access()` y todo
     el dashboard; así los datos personales quedan aislados con su propio RLS.
   - Todas las columnas aceptan `null`. `check` de formato que solo se aplican con valor (celular
     `^3[0-9]{9}$`, nombre con la regla de `profiles_full_name_format`, parentesco en la lista, longitudes).
   - Trigger `before insert or update` que pone `updated_at = now()`.
3. **Grants y RLS** (regla de 2026-10: la tabla nueva no trae privilegios):
   - `authenticated`: `select`, `insert` y `update` solo de las columnas editables; sin `delete` (quitar
     = vaciar la sección). Nunca `grant all`. Nada a `anon`. Nada a `service_role` (ninguna Edge Function la
     usa).
   - Políticas `select` / `insert` / `update` solo con `user_id = (select auth.uid())`.
4. Permiso `usuarios.datos_personales` en `permissions`, asignado a `director_oficina` en
   `role_permissions`, y la función `get_user_personal_info` con `revoke` de
   `public`/`anon` y `grant execute` a `authenticated`.
5. El navegador guarda con `upsert` (`onConflict: 'user_id'`) solo las columnas de la pestaña.

## Código

- **`Tabs` en `components/ui`**, extraído de `ayuda/HelpPage.tsx` (subrayado, scroll lateral en celular, la
  pestaña abierta a la vista) con semántica de pestañas (`role="tablist"` / `tab` / `tabpanel`,
  `aria-selected`, flechas, Inicio/Fin). Ayuda pasa a usarlo.
- `pages/ProfilePage.tsx`: pestañas, `?pestana=`, avisos de primer ingreso arriba de las pestañas.
- `profile/`: `PersonalInfoForm.tsx`, `EmergencyContactForm.tsx` (mismo patrón de `ProfileNameForm`),
  `personalApi.ts` (leer, guardar cada sección, quitar, lista de EPS; errores en español: `23514` formato
  no permitido, `23503` EPS inexistente), `personalSchema.ts`, `personalData.ts` (parentescos, formato del
  celular, textos de ayuda). Se cargan solo en Mi perfil, no en `ProfileProvider`.
- `usuarios/`: acción del ⋮ y `PersonalInfoModal.tsx` (reutiliza el formato del celular y los nombres de
  parentesco de `profile/personalData.ts`).
- `permisos/data.ts`: nada nuevo (el módulo `usuarios` ya existe).

## Documentación (mismo commit, regla de CLAUDE.md)

- `docs/modulos/mi-perfil.md`: pestañas, campos y reglas, quién los ve, migración, preguntas frecuentes
  ("falta una EPS" → `eps_entities` en el SQL Editor).
- `docs/modulos/usuarios-roles-permisos.md`: permiso `usuarios.datos_personales`, acción del ⋮ y la tabla
  "Asignación vigente".
- Ayuda (`src/dashboard/ayuda/data.ts`): guía **Mi perfil** (pestañas y quién ve los datos) y guía de
  administración (Ver información personal).
- CLAUDE.md: viñetas de Mi perfil y Usuarios.

## Pruebas manuales

- Usuario A no lee ni escribe la fila de B consultando la API directamente con su token.
- Director de oficina: ve "Ver información personal" en Usuarios y no puede escribir la tabla de nadie
  más; un usuario sin el permiso recibe error al llamar `get_user_personal_info`.
- `anon` recibe "permission denied" en las dos tablas y la función.
- Guardar un solo campo de una sección: se acepta. Celular inválido: lo rechaza el formulario y, saltándolo,
  el `check`.
- Quitar datos de una sección y verificar que el Director ve "Sin registrar".
- Primer ingreso: cargo → contraseña sin exigir las pestañas nuevas.
- Pestañas con teclado y lector de pantalla, `?pestana=`, 360 px, tema oscuro.
- `npm run build`, `npm run lint`, `npm run format:check`.
