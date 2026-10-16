# Plan: página Ayuda en el dashboard (construido el 2026-10-15)

Llevar la guía para funcionarios (`docs/guia-funcionarios/`) al dashboard: una página **Ayuda** con una
pestaña por guía, que todos los usuarios ven completa. Rama propuesta: `ayuda`, desde `main`.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Dónde | Una sola página `/dashboard/ayuda`, con pestañas |
| Quién la ve | **Todos** los usuarios con acceso al dashboard, y **todas** las guías, sin filtrar por permiso |
| Contenido | Datos en el código, como Tutoriales (`dashboard/ayuda/data.ts`); se despliega con la app |
| Nombre del superadmin | "Administrador de Sistema" |
| Permisos | Dinámicos: los textos no los presentan como fijos |

## Propuestas para aprobar

1. **Tabla "Quién puede hacer qué" en vivo** (recomendado): en lugar de escribir a mano qué puede cada
   rol, cada pestaña la arma con los permisos reales de la base. `roles`, `permissions` y
   `role_permissions` ya se pueden leer por cualquier usuario autenticado (migración
   `20261005150000`), así que **no hace falta migración**. Cuando se cambien permisos en Roles después
   de una reunión, la Ayuda queda al día sola. Alternativa: tablas escritas a mano, que hay que
   actualizar cada vez.
2. **Disponible en el primer ingreso**: mientras el usuario debe cambiar la contraseña temporal, hoy toda
   ruta lleva a Mi perfil. Se propone dejar entrar también a Ayuda (útil justo para alguien nuevo).
3. **Nombre en pantalla**: "Ayuda".

## Ubicación y acceso

- **Topbar:** botón de ícono "Ayuda" (signo de interrogación) entre el selector de tema y Mi perfil, con
  `aria-label` y `Tooltip`, como los demás.
- **Enlace en cada sección:** "¿Cómo funciona?" en el encabezado de Avisos de Remate, Audiencias, PQRS,
  Encuestas, Usuarios, Roles, Permisos y Días no hábiles, que abre la pestaña de esa sección.
- **Menú lateral:** no va (es una página de cuenta, como Mi perfil: `group: 'account'`).
- `useDocumentMeta({ title: 'Ayuda · Dashboard', noindex: true })`.

## Página

```
Ayuda
Guías de uso del dashboard. Los permisos de cada rol pueden cambiar; las tablas muestran los de hoy.

[Mi perfil] [Audiencias] [Avisos de Remate] [PQRS] [Encuestas] [Administración]

┌ En esta guía ─────────────────┐
│ ¿Para qué sirve?               │   ## ¿Para qué sirve?
│ Los estados                    │   …texto…
│ Programar una audiencia        │
│ …                              │   ## Quién puede hacer qué (en vivo)
│ Preguntas frecuentes           │   Rol            Puede
└────────────────────────────────┘   Juzgado        Ver audiencias
                                     Director…      Ver, crear, editar, eliminar
                                     ▸ ¿Por qué la audiencia de las 10:00 sigue en Próximas?
```

- **Pestañas:** mismo aspecto que las de las listas (Próximas / Por cerrar…). La pestaña abierta va en la
  URL (`/dashboard/ayuda?guia=audiencias`): los enlaces "¿Cómo funciona?" abren la correcta y se puede
  compartir. Sin parámetro o con uno desconocido: Mi perfil. En celular, la fila de pestañas se desplaza
  de lado.
- **Índice "En esta guía":** a la izquierda desde `lg` (fijo al bajar), arriba y plegable en celular;
  cada entrada salta a su sección (anclas `#id`, con `scroll-mt` para no quedar bajo la Topbar).
- **Preguntas frecuentes:** plegables (`<details>` / `<summary>` nativo: accesible con teclado y sin
  código extra), al final de cada guía.
- **Notas** (como la de permisos dinámicos): `Alert` con `live={false}` e ícono SVG, como Tutoriales.
- **Abrir una sección desde la guía:** cuando el texto menciona una sección (p. ej. "Días no hábiles"),
  enlace a ella si el usuario tiene permiso; si no, texto normal.

## Contenido como datos (`src/dashboard/ayuda/`)

```
data.ts            guías (orden = orden de las pestañas)
types.ts           Guide, GuideSection, Block, Faq
HelpPage.tsx       pestañas + guía activa
GuideView.tsx      índice, secciones y preguntas
blocks/            Paragraph, List, Steps, Table, Note
RolesTable.tsx     "Quién puede hacer qué" en vivo
useRolesMatrix.ts  roles + permisos de un módulo
```

Forma de una guía (sin Markdown ni librería nueva):

- `slug` (`audiencias`), `title`, `summary`, `module` (código del módulo de permisos, para la tabla en
  vivo; `null` en Mi perfil), `sections: { id, title, blocks }[]`, `faq: { q, a }[]`.
- `Block`: `paragraph` | `list` | `steps` (numerada) | `table` (encabezados + filas) | `note` | `roles`
  (dónde va la tabla en vivo).
- Texto con negrita mínima: `**así**`, convertido por un helper pequeño (solo negrita, nada de HTML).

**Cifras desde el código, no escritas a mano**, para que la guía no se desactualice: 60 minutos
(`REALIZADO_DESPUES_DE_MIN`, `CLOSE_AFTER_MINUTES`), 7:00 a 5:00 p. m. (`FIRST_HOUR` / `LAST_HOUR`), 15
días hábiles (`RESPONSE_BUSINESS_DAYS`), 2.000 caracteres (`SUMMARY_MAX_CHARS`), etc. Las que hoy solo
existen en SQL o en Edge Functions (5.000 caracteres de respuesta, recordatorio ≈ 15 min, 90 correos) se
escriben en el texto con un comentario que señala dónde viven.

`docs/guia-funcionarios/*.md` deja de ser la fuente: se reemplaza por una nota que apunta a `data.ts`
(el contenido se pasa tal cual, ya revisado). `docs/modulos/` sigue igual.

## Tabla en vivo

- `useRolesMatrix(module)`: lee una vez por visita `roles` (sin superadmin), `role_permissions` y
  `permissions` del módulo.
- Muestra una fila por rol con los **nombres** de sus permisos de ese módulo (los que se editan en
  Permisos, p. ej. "Ver audiencias", "Crear audiencias"); "Solo consulta" si solo tiene `.ver`; "Sin
  acceso" si no tiene ninguno. Última fila fija: "Administrador de Sistema · Todo".
- Debajo, siempre: "Los permisos de cada rol los define el Director de oficina o se acuerdan con los
  funcionarios, y pueden cambiar. Esta tabla muestra los de hoy."
- Si la consulta falla: la guía se muestra igual, con un aviso en lugar de la tabla.
- Para que se lea bien, se revisan los nombres de los permisos en Permisos (sin código).

## Fases

1. **Página y contenido:** ruta, botón en la Topbar, pestañas con la URL, índice, bloques, preguntas y
   las seis guías pasadas a datos con las cifras desde el código.
2. **Tabla en vivo** de roles por módulo.
3. **Enlaces "¿Cómo funciona?"** en cada sección y acceso durante el primer ingreso (si se aprueba).
4. **Documentación:** `CLAUDE.md`, `docs/modulos/README.md` y la nota en `docs/guia-funcionarios/`.

## Verificación

- Un usuario de juzgado ve las seis pestañas; la tabla en vivo coincide con lo que muestra Roles.
- Cambiar un permiso en Roles y recargar Ayuda: la tabla cambia sin desplegar.
- `?guia=pqrs` abre PQRS; un valor desconocido abre Mi perfil; el botón atrás del navegador vuelve a la
  pestaña anterior.
- Índice y anclas no quedan bajo la Topbar; preguntas plegables con teclado; lector de pantalla
  (pestañas, tabla con encabezados, notas no "en vivo").
- 375 a 1536 px, claro y oscuro, menú lateral expandido y comprimido.
- Primer ingreso: entra a Ayuda y Mi perfil, nada más.
- Lint, build, sin dependencias nuevas.
