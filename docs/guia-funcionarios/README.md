# Guía para funcionarios

La guía para funcionarios está en el dashboard: página **Ayuda** (`/dashboard/ayuda`), una pestaña por
guía, que **todos los usuarios ven completa**. Se abre con el botón de ayuda (?) de la barra superior,
que lleva a la guía de la sección en la que está el usuario, y también se puede abrir durante el
primer ingreso.

- **Texto:** [src/dashboard/ayuda/data.ts](../../src/dashboard/ayuda/data.ts). Lenguaje sencillo, sin
  nombres de tablas ni de código; el superadmin se llama "Administrador de Sistema".
- **Pestañas y secciones que explica cada guía:** [src/dashboard/ayuda/guides.ts](../../src/dashboard/ayuda/guides.ts).
- **Cifras** (60 minutos, 7:00 a 5:00 p. m., 15 días hábiles…): se toman de las constantes del código.
- **"Quién puede hacer qué":** tabla en vivo con los permisos configurados hoy en Roles. Los permisos
  son dinámicos (los define el Director de oficina o se acuerdan con los funcionarios), así que no se
  escriben a mano.

Plan en [../plan-ayuda.md](../plan-ayuda.md). La documentación técnica de cada sección está en
[../modulos/](../modulos/). Si cambia una regla, se actualizan el módulo y `data.ts` en el mismo cambio.

| Guía (`?guia=`) | Qué cubre |
|---|---|
| `mi-perfil` | Primer ingreso, contraseña, cargo y lo que ve cada usuario |
| `audiencias` | Programar, cerrar, formato, expediente, página pública y correos |
| `avisos-remates` | Crear, publicar y consultar avisos de remate |
| `pqrs` | Estados, plazo y respuesta de las PQRS |
| `encuestas` | Resultados y administración de encuestas |
| `administracion` | Usuarios, roles, permisos y días no hábiles |
