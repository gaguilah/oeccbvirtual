# Módulos: documentación para desarrollo

Un documento vivo por sección: describe cómo funciona **hoy**. Los `docs/plan-*.md` son el historial
de decisiones; si un plan y un módulo no coinciden, vale el módulo.

| Módulo | Qué cubre |
|---|---|
| [audiencias.md](audiencias.md) | Programación, cierre, formato, expediente, sitio público y correos |
| [avisos-remates.md](avisos-remates.md) | Avisos, URL del PDF, publicación y carpetas |
| [pqrs.md](pqrs.md) | Formulario público, estados, plazo y respuesta por correo |
| [encuestas.md](encuestas.md) | Encuesta pública, gestión y resultados |
| [dias-no-habiles.md](dias-no-habiles.md) | Calendario de festivos y cierres usado por los plazos |
| [usuarios-roles-permisos.md](usuarios-roles-permisos.md) | Acceso, roles, permisos y cuentas |
| [mi-perfil.md](mi-perfil.md) | Ingreso, primer ingreso y perfil propio |

La guía para funcionarios es la página **Ayuda** del dashboard (texto en
[src/dashboard/ayuda/data.ts](../../src/dashboard/ayuda/data.ts); ver
[../guia-funcionarios/README.md](../guia-funcionarios/README.md)).

## Permisos dinámicos

Las asignaciones de permisos a roles cambian con frecuencia: las decide el Director de oficina o se
acuerdan con los funcionarios en reuniones, y el superadmin las aplica en Roles sin tocar código. Las
tablas "Asignación vigente" de cada módulo son una foto con fecha; la fuente de verdad es la base
(consulta en [usuarios-roles-permisos.md](usuarios-roles-permisos.md)). Por eso el código nunca decide
por el nombre del rol: siempre por permiso (`has_permission` / `can()`).

## Regla

Si un cambio modifica una regla, un plazo o un permiso, en el mismo commit se actualizan el módulo y el
texto de esa sección en la Ayuda (`src/dashboard/ayuda/data.ts`).
