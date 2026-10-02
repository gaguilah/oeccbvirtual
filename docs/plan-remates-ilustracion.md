# Plan: ilustración de Avisos de Remate (construida el 2026-10-02)

Ilustración decorativa para el encabezado de `/avisos-remates`, inspirada en otra composición de Laravel Cloud (paneles "Database" y "Cache" con fondo rayado de acento). Usa las piezas comunes de `components/illustration/` y sigue `design.md`: solo tokens, sin bordes para separar secciones y con movimiento solo bajo `motion-safe:`.

## Decisiones

| Tema | Decisión |
| --- | --- |
| Celular | Oculta. Se muestra desde tableta (`md`) |
| Inclinación | La misma del inicio y Contacto (`matrix(.996, .087, -.174, .985)`) |
| Guía rápida en la columna izquierda | No: solo título y descripción |
| Calendario | Decorativo, sin datos reales |

## Composición (512 × 400 unidades)

### Panel principal (derecha): "Juzgados de Ejecución · Bucaramanga"

**1. Tarjeta "Agenda de remates" (principal):**
- **Mini calendario:** encabezado L M M J V S D y una cuadrícula de 30 días, sin nombre de mes ni año.
- **Días con remate:** un punto `primary` en algunos martes y jueves, como en la agenda habitual.
- **Día seleccionado:** relleno en degradado `primary` → `primary-dim` y un pulso suave. Encima, un globo `inverse-surface` con "Remate · 08:30 a. m.".
- **Acento:** fondo rayado `primary` desplazado detrás de la tarjeta.

**2. Tarjeta "Aviso de remate" (debajo):** imita el modal de detalle.
- **Ficha del archivo:** ícono de PDF y "Aviso de remate · PDF".
- **Botones simulados:** "Ver aviso" (secundario) y "Descargar PDF" (primario).
- **Barra de descarga:** se llena una vez (0 → 100 %) y termina en "✓ Descargado".
- **Acento:** fondo rayado `on-surface` (neutro) desplazado detrás de la tarjeta.

### Panel izquierdo: "Estado" (sale por el borde izquierdo, desvanecido)
- **Tarjeta "Próximos":** "08:30 a. m." y "10:00 a. m.", cada una con la etiqueta **Agendado** (`primary`, como `RemateStatusBadge`).
- **Tarjeta "Pasados":** dos filas con **Realizado** (neutro).

### Conexión
Una línea del panel "Estado" a la tarjeta de agenda.

Sin radicados, fechas con año ni nombres de mes, para que nadie la confunda con la programación oficial.

## Animación (todo con `motion-safe:`)

- **Entrada escalonada:** Estado (0 ms) → Agenda (150 ms) → globo (300 ms) → Aviso (300 ms).
- **Calendario:** los puntos aparecen uno tras otro y el día seleccionado pulsa.
- **Barra de descarga:** animación nueva `illustration-fill` (ancho de 0 a 100 %), que empieza después de la entrada de su tarjeta. Con "reducir movimiento" se ve llena desde el inicio.
- **Elevación:** las tarjetas suben al pasar el mouse (`lift`).

## Técnica

### Piezas comunes (`components/illustration/`)

| Pieza | Cambio |
| --- | --- |
| `IllustrationCanvas` | Prop nueva `fade`: `'right'` (actual, la usan el inicio y Contacto) o `'left'` (desvanece izquierda, arriba y abajo, para el panel que sale por la izquierda) |
| `IllustrationHatch` (nueva) | Fondo rayado de acento: `repeating-linear-gradient` a 52° en un color de token, desplazado detrás de una tarjeta y con su mismo radio |
| `IllustrationButton` (nueva) | Botón simulado (`div`, no enfocable) en variante primaria (degradado `primary`) o secundaria (borde fantasma) |

### Propias de la sección (`components/remates/`)
- **`RematesIllustration.tsx`:** la composición.
- **`MiniCalendar.tsx`:** la cuadrícula de días con puntos y el día seleccionado.
- **`illustrationData.ts`:** los días con punto, el día seleccionado y los textos.

### Estilos (`index.css`)
- **Animación `illustration-fill`:** en `@theme`, junto a `illustration-in`.

### Colores
Solo tokens:
- **Tarjetas y paneles:** `surface-container-lowest` para las tarjetas y `surface-container-low` para los paneles.
- **Acentos:** `primary` y `on-surface` para los rayados, en lugar del naranja y el morado de la referencia.
- **Globo:** `inverse-surface`.

Funciona en modo claro y oscuro sin `dark:`.

## Página `/avisos-remates`

**Encabezado como el de Contacto:**

| Pantalla | Diseño |
| --- | --- |
| Escritorio (`lg`+) | Dos columnas: título y descripción a la izquierda (centrados verticalmente), ilustración a la derecha |
| Tableta (`md`–`lg`) | Título y descripción; debajo, la ilustración centrada al 90 % (máx. `max-w-lg`) |
| Celular | Solo título y descripción (`hidden md:block` en la ilustración) |

Los filtros, la tabla, la paginación y el modal de detalle no cambian.

## Archivos

**Nuevos:**
- `components/illustration/IllustrationHatch.tsx`
- `components/illustration/IllustrationButton.tsx`
- `components/remates/RematesIllustration.tsx`
- `components/remates/MiniCalendar.tsx`
- `components/remates/illustrationData.ts`

**Cambios:**
- `components/illustration/IllustrationCanvas.tsx`: prop `fade`.
- `components/illustration/index.ts` y `components/remates/index.ts`: exportar las piezas nuevas.
- `src/index.css`: animación `illustration-fill`.
- `pages/Remates.tsx`: encabezado a dos columnas.
- `CLAUDE.md`: las piezas nuevas y la ilustración de remates.

## Verificación
Capturas en escritorio (claro y oscuro), tableta y celular, para confirmar que en celular no aparece. También se revisa que el inicio y Contacto no cambien con la prop `fade`.

## Ajustes al construir

- **"✓ Descargado":** va en la misma fila que la barra de descarga, y se quitó la fila con el nombre del archivo, para que la tarjeta del aviso no quede cortada abajo.
- **Panel "Estado":** se acercó al borde (`-left-10`) para que se lean los títulos, las horas y las etiquetas, y no solo las etiquetas.
- **`fade="left"`:** desvanece menos (izquierda desde el 82 %, abajo desde el 90 %).
