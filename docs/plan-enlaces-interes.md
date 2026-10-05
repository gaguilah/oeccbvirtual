# Plan: enlaces de interés (construido el 2026-10-05)

Tres enlaces externos de la Rama Judicial que los ciudadanos usan junto con los servicios de la oficina:

| # | Nombre | URL | Para qué sirve (texto propuesto) |
| --- | --- | --- | --- |
| 1 | Rama Judicial | `https://www.ramajudicial.gov.co` | Portal oficial de la Rama Judicial de Colombia. |
| 2 | Publicaciones Procesales | `https://publicacionesprocesales.ramajudicial.gov.co/web/publicaciones-procesales/inicio` | Estados, traslados, edictos y demás publicaciones de los despachos. |
| 3 | Consulta de Procesos | `https://consultaprocesos.ramajudicial.gov.co/procesos/bienvenida` | Consulte el estado y las actuaciones de un proceso por número de radicación o por nombre. |

## Dónde ubicarlos

| Opción | Pros | Contras |
| --- | --- | --- |
| **A. Footer**, columna "Enlaces de interés" junto a "Servicios" | Visible en todas las páginas; es donde la gente busca enlaces externos; poco código | Discreto: quien no baja hasta el final no los ve |
| **B. Inicio**, sección "Enlaces de interés" debajo de "Servicios" | Muy visible; cabe una descripción por enlace | Solo en el inicio; compite con los servicios propios |
| C. Página propia `/enlaces` en el menú | Espacio para crecer | Tres enlaces no justifican una página ni un ítem más en un menú que ya solo cabe desde `xl` |
| D. Contacto | — | No tiene relación con contactar a la oficina |

**Recomendación: A + B.** El footer los deja a mano desde cualquier página y el inicio los presenta con su descripción. C y D se descartan.

## Decisiones

| Tema | Decisión |
| --- | --- |
| Título | "**Enlaces de interés**" |
| Datos | Fuente única nueva en `src/lib/externalLinks.ts`, como `contact.ts` y `courts.ts`. Footer e inicio leen de ahí |
| URL de publicaciones | No se repite: `courts.ts` exporta su `PUBLICATIONS_PAGE` y `externalLinks.ts` la reutiliza. Si el portal cambia, se corrige en un solo lugar |
| Esquema | Todas con `https://` (la 1 se dio sin esquema) |
| Pestaña | Todas abren en pestaña nueva (`target="_blank"`, `rel="noopener noreferrer"`), con ícono de enlace externo y texto oculto "(se abre en una pestaña nueva)", igual que los juzgados del footer |
| Menú principal | Sin cambios |

## 1. `src/lib/externalLinks.ts` (nuevo)

```ts
export type ExternalLink = {
  href: string
  title: string
  description: string
  icon: string[] // Heroicons outline, viewBox 24×24, como services/data.ts
}

export const INTEREST_LINKS: ExternalLink[] = [
  { href: 'https://www.ramajudicial.gov.co', title: 'Rama Judicial', … },          // ícono: building-library
  { href: PUBLICATIONS_PAGE, title: 'Publicaciones Procesales', … },               // ícono: newspaper
  { href: 'https://consultaprocesos.ramajudicial.gov.co/procesos/bienvenida', title: 'Consulta de Procesos', … }, // ícono: magnifying-glass / document-magnifying-glass
]
```

- El orden del arreglo es el orden en pantalla.
- En `courts.ts`: `const PUBLICATIONS_PAGE` pasa a `export const`.

## 2. Footer: columna "Enlaces de interés"

```
┌──────────────────────────────────────────────────────────────────────┐
│ OECCB                             SERVICIOS          ENLACES DE INTERÉS │
│ Oficina de Apoyo…                 Avisos de Remate   Rama Judicial ↗    │
│ Carrera 12 … · Bucaramanga        PQRS               Publicaciones… ↗   │
│ correo · horario                  Encuesta           Consulta de… ↗     │
│                                   Tutoriales                            │
│                                                                         │
│ PUBLICACIONES DE LOS JUZGADOS                                           │
│ Juzgado 1 Civil del Circuito… ↗                                         │
│ Juzgado 2 Civil del Circuito… ↗                                         │
├──────────────────────────────────────────────────────────────────────┤
│ © 2026 Oficina de Apoyo…                                                │
└──────────────────────────────────────────────────────────────────────┘
```

- **Fila 1:** la grilla pasa de `sm:grid-cols-[2fr_1fr]` a tres columnas. En celular, todo apilado; en `sm`, OECCB ocupa toda la fila y Servicios + Enlaces quedan lado a lado debajo; desde `lg`, las tres en una fila (`lg:grid-cols-[2fr_1fr_1fr]`). Revisar en 375, 640, 1024 y 1280 px.
- **Columna:** `<nav aria-label="Enlaces de interés">` con `ColumnTitle` y una lista con el mismo estilo de los enlaces de Servicios, más el ícono externo en línea.
- **Ícono externo:** hoy el SVG está escrito dentro del enlace de los juzgados. Se extrae a un componente pequeño (`ExternalLinkIcon` en `components/ui`) y lo usan las dos listas.
- **Sin cambios:** fila de juzgados, franja inferior y `FooterGlow`.

## 3. Inicio: sección "Enlaces de interés"

```
┌──────────────────────────────────────────────────────────────┐
│ SERVICIOS  (sección actual, fondo surface-container-low)      │
├──────────────────────────────────────────────────────────────┤
│ ENLACES DE INTERÉS  (fondo surface: cambio de tono, sin línea) │
│ Sitios oficiales de la Rama Judicial.                          │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│ │ [ícono]      │ │ [ícono]      │ │ [ícono]      │            │
│ │ Rama Judicial│ │ Publicaciones│ │ Consulta de  │            │
│ │ descripción  │ │ descripción  │ │ descripción  │            │
│ │ VISITAR ↗    │ │ VISITAR ↗    │ │ VISITAR ↗    │            │
│ └──────────────┘ └──────────────┘ └──────────────┘            │
└──────────────────────────────────────────────────────────────┘
```

- Va debajo de "Servicios", sobre `bg-surface` (el fondo alterna y separa las secciones, regla de `design.md`). Mismo encabezado que "Servicios" (`<h2>` pequeño en mayúsculas) y una línea de apoyo.
- Grilla: 1 columna en celular, 3 desde `md` (`md:grid-cols-3`).
- **Tarjeta:** `ExternalLinkCard` en `components/services/`, hermana de `ServiceCard` y con su misma forma (ícono en `primary-container`, título `font-display`, descripción), pero:
  - es un `<a>` externo, no un `Link`;
  - la etiqueta inferior dice "**Visitar**" con la flecha diagonal ↗ (no "Ingresar" →), para que se note que se sale del sitio;
  - fondo `surface-container-low` (la sección es `surface`), hover `primary-container/40` como `ServiceCard`;
  - texto oculto "(se abre en una pestaña nueva)".
- Se evalúa durante la construcción si conviene que `ServiceCard` y `ExternalLinkCard` compartan el cuerpo (ícono + título + descripción) en un componente interno para no duplicar el marcado.

## 4. Verificación

- Abrir las tres URL y confirmar HTTP 200 y que cargan la página esperada (anotar la fecha, como en `plan-footer.md`).
- `npm run lint`, `npm run build`, `npm run format:check`.
- Revisar footer e inicio en claro y oscuro, en 375 / 640 / 1024 / 1280 px, y navegar con teclado (foco visible, orden lógico).
- Actualizar `CLAUDE.md`: mencionar `lib/externalLinks.ts`, la columna del footer y la sección del inicio.

## Resultado

- Se construyeron A + B tal como se describen. Las tres URL responden (2026-10-05; `www.ramajudicial.gov.co` rechaza peticiones sin user-agent de navegador, pero abre normal).
- `ServiceCard` y `ExternalLinkCard` comparten `services/CardBody` (ícono + título + descripción).

## Preguntas abiertas (al proponer el plan)

1. ¿Footer + inicio (recomendado), o solo uno de los dos?
2. ¿Los textos de descripción propuestos sirven, o la oficina prefiere otros?
3. ¿Se espera agregar más enlaces después (p. ej. SIUGJ, Tutela en línea, Consejo Superior)? Si son más de 5–6, la opción C (página propia) vuelve a tener sentido.
