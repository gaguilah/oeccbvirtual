# Usuarios, roles y permisos

Documento vivo: describe cómo funciona **hoy** el acceso al dashboard. Si un cambio modifica una regla,
este archivo se actualiza en el mismo commit. La historia está en los planes enlazados al final.

## Qué es

Quién entra al dashboard y qué puede hacer en cada sección. **Qué** puede hacer lo dice su rol
(permisos); **sobre qué juzgado** lo dicen el alcance del rol y el juzgado del usuario.

| Sección | Ruta | Ver | Gestionar |
|---|---|---|---|
| Usuarios | `/dashboard/usuarios` | `usuarios.ver` | `usuarios.gestionar` |
| Roles | `/dashboard/roles`, `/nuevo`, `/:id` | `roles.ver` | `roles.gestionar` |
| Permisos | `/dashboard/permisos` | `permisos.ver` | `permisos.gestionar` |

Asignación vigente (2026-10-15): `usuarios.ver` para oficina y director_oficina (solo consulta); los
demás, solo superadmin.

## Modelo

- **Un rol por usuario** (`profiles.role_id`).
- `roles.scope`: `all` (los dos juzgados) o `court` (solo `profiles.court`, 1 o 2).
- `permissions`: códigos `<módulo>.<acción>`, enlazados a roles en `role_permissions`.
- `superadmin` (`is_system`): tiene todos los permisos de forma implícita, incluidos los futuros.

### Roles actuales (consultados en la base el 2026-10-15)

| Rol | Alcance | Permisos |
|---|---|---|
| `superadmin` | Todos | Todos (implícito) |
| `juzgado` | Su juzgado | `audiencias.ver`, `remates.ver`, `calendario.ver` |
| `oficina` | Todos | `audiencias.ver`, `remates.ver`, `pqrs.ver`, `encuestas.ver`, `usuarios.ver`, `calendario.ver` |
| `director_oficina` | Todos | `audiencias.ver/crear/editar/eliminar`, `remates.ver`, `pqrs.ver/gestionar/responder`, `encuestas.ver`, `usuarios.ver` |

En la práctica: juzgado y oficina solo consultan; el director gestiona Audiencias y PQRS; Avisos de
Remate, Encuestas, Días no hábiles y la administración los gestiona solo el superadmin.

Si cambian en Roles, actualizar esta tabla y la de cada módulo. Para consultarlos:

```sql
select r.name, r.scope, string_agg(rp.permission_code, ', ' order by rp.permission_code)
from public.roles r left join public.role_permissions rp on rp.role_id = r.id
group by r.name, r.scope order by r.name;
```

## Reglas

- RLS: toda política usa `public.has_permission('<código>', court)`; con datos de un juzgado, siempre se
  pasa el juzgado de la fila. `useAccess().can()` repite la regla **solo para mostrar u ocultar**.
- Cada sección crea sus permisos en su propia migración, junto con las políticas que los revisan.
  **Nunca** se crean permisos desde la interfaz (no estarían conectados a nada). En Permisos solo se
  editan nombre y descripción.
- Nombres de los módulos: `MODULE_LABELS` en `dashboard/permisos/data.ts` (agregar cada módulo nuevo).
- Protegido en la base: juzgado obligatorio según el alcance, no quitar ni desactivar al último
  superadmin activo, solo un superadmin asigna superadmin, roles del sistema intocables, rol con usuarios
  no se borra.
- `role_id`, `court`, `active` y `must_change_password` nunca se escriben desde el navegador: solo la
  Edge Function `manage-users`.
- Códigos de rol: salen del nombre (`roleCode`) y no cambian. El alcance se bloquea si el rol tiene
  usuarios.

## Cuentas (Edge Function `manage-users`, **con** verificación de JWT)

- Acciones: `create`, `update`, `set-active`, `reset-password`. Revisa `usuarios.gestionar` con el JWT
  de quien llama y escribe con la service role.
- No hay registro público: las cuentas y las contraseñas temporales las da el administrador. Quien
  olvida su contraseña la recupera desde `/login` (ver [mi-perfil.md](mi-perfil.md)); "Restablecer
  contraseña" queda para quien no tenga acceso a su correo.
- Contraseña temporal: 14 caracteres aleatorios, se muestra **una vez** en `PasswordNoticeCard` y no se
  guarda. Deja `must_change_password = true`.
- Desactivar también bloquea el inicio de sesión en Auth (`ban_duration`).
- Nadie se gestiona a sí mismo en Usuarios: su fila solo ofrece "Ir a Mi perfil".
- Estados en la lista: Activo, Contraseña temporal, Desactivado, Sin rol (cuenta de Auth sin perfil).
- `list_users()` incluye cuentas sin perfil. `useUsers` recarga al volver a la pestaña, cada 60 s y con
  "Actualizar", porque los cambios de otros no se notifican.

## Acceso en el dashboard

- `AccessProvider` carga `get_my_access()`. El menú, las tarjetas de Inicio y `RequirePermission` se
  filtran por el `permission` de cada entrada de `navigation/links.ts`.
- Sin rol o desactivado → `NoAccess`. Con `must_change_password` → todo lleva a Mi perfil con el menú
  deshabilitado (ver [mi-perfil.md](mi-perfil.md)).

## Archivos y migraciones

- `src/dashboard/access/`, `usuarios/`, `roles/`, `permisos/`; `supabase/functions/manage-users`.
- Migraciones: `20261005150000_roles_permissions`, `20261005160000_list_users`,
  `20261005170000_roles_admin` y los permisos de cada sección en su migración.

## Preguntas frecuentes (desarrollo)

- **Un usuario dice que no ve una sección.** Revisar su rol, el permiso `.ver` del módulo y, si es de
  juzgado, su `court`.
- **Le di un permiso y no cambia nada.** El permiso solo funciona si alguna política o pantalla lo
  revisa; además el usuario debe recargar para que `get_my_access()` se vuelva a leer.
- **No puedo borrar un rol.** Tiene usuarios o es del sistema.

## Historial

[plan-usuarios](../plan-usuarios.md) · [plan-dashboard](../plan-dashboard.md)
