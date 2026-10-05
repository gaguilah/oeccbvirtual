# Plan: footer con enlaces de los juzgados y luz en movimiento (construido el 2026-10-04)

Los juzgados del footer pasan de texto plano ("Juzgado 1", "Juzgado 2") a enlaces a sus publicaciones procesales, en una fila propia debajo de OECCB y Servicios. Los datos de los juzgados se unifican en un solo archivo. Además, todo el footer lleva de fondo una luz que se desplaza de derecha a izquierda, inspirada en un componente de referencia (ver la sección 3).

## Enlaces verificados (2026-10-04)

URL base del portal de publicaciones procesales, con el parámetro `idDespacho`:

| Juzgado | `idDespacho` | Respuesta | Despacho seleccionado en la página | Publicaciones mostradas |
| --- | --- | --- | --- | --- |
| Juzgado 1 | `680013403001` | HTTP 200 | JUZGADO 001 DE EJECUCIÓN CIVIL DEL CIRCUITO DE BUCARAMANGA | Solo J1 (p. ej. TRASLADOS 157 a 160) |
| Juzgado 2 | `680013403002` | HTTP 200 | JUZGADO 002 DE EJECUCIÓN CIVIL DEL CIRCUITO DE BUCARAMANGA | Solo J2 (p. ej. TRASLADOS 160 a 162) |

## Decisiones

| Tema | Decisión |
| --- | --- |
| Datos | Unificados en `src/lib/courts.ts`; Avisos de Remate los toma de ahí |
| Título | "**Publicaciones de los juzgados**" |
| Disposición | No es una columna: es una **fila propia debajo de OECCB y Servicios**, con los dos juzgados **uno debajo del otro** en todos los tamaños. Se probaron antes `justify-between` y la grilla de la fila de arriba (`2fr 1fr`); con columnas de distinto ancho no se veía bien |
| Textos de los enlaces | El nombre oficial de `lib/courts.ts`: "Juzgado 1 Civil del Circuito de Ejecución de Sentencias de Bucaramanga" y el del Juzgado 2 (al principio era "Juzgado 1 de Ejecución Civil del Circuito") |

## 1. `src/lib/courts.ts` (nuevo)

Fuente única de los juzgados, como `contact.ts`:

```ts
export const COURTS = [
  { number: 1, short: 'Juzgado 1', name: 'Juzgado 1 de Ejecución Civil del Circuito', despacho: '680013403001' },
  { number: 2, short: 'Juzgado 2', name: 'Juzgado 2 de Ejecución Civil del Circuito', despacho: '680013403002' },
]
export function courtPublicationsUrl(despacho: string): string // arma la URL con URLSearchParams
```

- **URL en un solo lugar:** la URL larga del portal se escribe una sola vez dentro de `courtPublicationsUrl`; solo cambia `idDespacho`. Si la Rama Judicial cambia el portal (por ejemplo, el identificador de instancia `BIyXQFHVaYaq` de los parámetros), se corrige solo ahí.
- **Avisos de Remate:** `components/remates/constants.ts` deja de definir sus propios nombres. Su `COURTS` se arma desde `lib/courts.ts`: `short` sin cambios, y `name` con "de Bucaramanga" (`CONTACT_CITY`), como hoy. Así no se desincronizan.

## 2. Footer

```
┌──────────────────────────────────────────────────────────────┐
│ OECCB                                  SERVICIOS              │
│ Oficina de Apoyo para los Juzgados…    Avisos de Remate       │
│ Carrera 12 No. 31-08 · Bucaramanga…    PQRS                   │
│ correo · horario                       Encuesta · Tutoriales  │
│                                                               │
│ PUBLICACIONES DE LOS JUZGADOS                                 │
│ ↗ Juzgado 1 de Ejecución Civil…         ↗ Juzgado 2 de Ejecución Civil… │  ← lg: 2 columnas, space-between
├──────────────────────────────────────────────────────────────┤
│ © 2026 OECCB · Rama Judicial                                  │
└──────────────────────────────────────────────────────────────┘
```

- **Fila 1:** OECCB (marca, descripción, dirección, correo y horario) a la izquierda y "Servicios" a la derecha. Es la misma información de hoy, sin la columna de juzgados.
- **Fila 2 (nueva):** título "Publicaciones de los juzgados" (mismo estilo de título de columna) y los dos enlaces.
  - **Todos los tamaños:** los dos juzgados uno debajo del otro.
  - **Separación:** con espacio, sin línea divisoria (regla de `design.md`).
- **Cada enlace:**
  - texto completo del juzgado e ícono de enlace externo, en línea con el texto (si el nombre se parte en dos líneas, el ícono sigue a la última palabra);
  - abre en pestaña nueva (`target="_blank"`, `rel="noopener noreferrer"`);
  - texto oculto para lectores de pantalla: "– publicaciones procesales (se abre en una pestaña nueva)";
  - estilo de los enlaces del footer (`hover:text-on-surface`).
- **Sin cambios:** la franja inferior ("© … OECCB · Rama Judicial").

## 3. Luz en movimiento en todo el footer

### Cómo funciona la referencia
- **Capa 1:** franjas diagonales (115°) de color primario, hechas con un `repeating-linear-gradient` de período 640 px. Se desplazan horizontalmente sin fin, de derecha a izquierda, en **12 s**.
- **Capa 2:** franjas del **color del fondo**, con el mismo ángulo, que se desplazan **3,4 veces más rápido** (3,5 s). Al cruzarse con la capa 1 la tapan y la destapan, y eso produce el brillo que recorre el fondo.
- **Acabado:** las dos capas van desenfocadas (`blur-md`) y al **20 % de opacidad**, con una trama de puntos encima y máscaras que las desvanecen arriba y a los lados.
- **Decorativa:** `aria-hidden` y `pointer-events-none`.

### Adaptación al proyecto

**Colores con tokens** (funcionan en claro y oscuro sin `dark:`):

| Elemento | Color |
| --- | --- |
| Franjas de luz | `--color-primary` |
| Franjas que la tapan | `--color-surface-container-low`, el fondo del footer |
| Puntos | `surface-container-lowest`, a baja opacidad |

**Más simple que la referencia:**
- **Un solo elemento por capa:** la referencia usa 3 "baldosas" por capa. Aquí cada capa es un solo elemento, más ancho que el footer en exactamente una repetición del patrón (≈ 706 px = 640 / sen 115°), que se desplaza esa distancia y vuelve a empezar sin que se note el salto. Así cubre cualquier ancho de pantalla, incluso monitores muy anchos.
- **Animación con `transform`:** la hace la tarjeta gráfica, no el procesador. Se define como `@utility` en `index.css`, con la duración y la distancia en variables CSS por capa.

**Rendimiento:**
- **Se pausa cuando el footer no está en pantalla** (casi siempre, porque está al final de la página). Un `IntersectionObserver` cambia `animation-play-state` a `paused`, como la variable `--play-state` de la referencia.
- **Nada se mueve mientras se lee** el contenido de arriba.

**Accesibilidad:**
- **Decorativa:** `aria-hidden` y `pointer-events-none`; el texto del footer queda por encima (`relative z-10`).
- **Con "reducir movimiento" (`motion-safe:`):** las franjas se ven quietas, sin animación.
- **Legibilidad:** opacidad baja (≈ 15–20 %); se verificará el contraste del texto del footer en ambos temas.

**Cobertura:**
- **Ocupa todo el footer,** incluida la franja inferior "© …". Esa franja pasa a un fondo semitransparente (`surface-container/70`) para que la luz se vea también ahí, sin perder la separación tonal.
- **Máscaras:** la luz se concentra en la **parte superior** del footer y se desvanece hacia abajo (`mask-b-from-30% mask-b-to-70%`), además de a los lados. Al principio estaba abajo, como en la referencia, y se invirtió a pedido.

### Pieza
`components/layout/FooterGlow.tsx`: las dos capas, los puntos, las máscaras y la pausa fuera de pantalla. `Footer` la coloca como primer hijo (`absolute inset-0`), y el contenido va encima.

## 4. Archivos

| Archivo | Cambio |
| --- | --- |
| `src/lib/courts.ts` (nuevo) | Datos de los juzgados y `courtPublicationsUrl()` |
| `components/layout/Footer.tsx` | Fila nueva con los enlaces; se quita la columna de juzgados; `FooterGlow` de fondo y franja inferior semitransparente |
| `components/layout/FooterGlow.tsx` (nuevo) | Luz en movimiento: dos capas de franjas, puntos, máscaras y pausa fuera de pantalla |
| `src/index.css` | Utilidad de desplazamiento horizontal infinito con la distancia y la duración en variables |
| `components/remates/constants.ts` | `COURTS` desde `lib/courts.ts` |
| `CLAUDE.md` / `design.md` | Documentar `lib/courts.ts`, la nueva fila del footer y la luz de fondo |

## Verificación

- **Capturas del footer:** celular, tableta y escritorio, en claro y oscuro.
- **Enlaces:** que los generados por `courtPublicationsUrl()` sean idénticos a los verificados arriba y respondan 200.
- **Avisos de Remate:** que siga mostrando "Juzgado 1 / Juzgado 2" en filtros, tabla y modal.
- **Luz, medida en Edge en tiempo real:**
  - que se desplace de derecha a izquierda (la posición de cada capa cambia con el tiempo);
  - que se pause con el footer fuera de pantalla y se reanude al llegar a él;
  - que esté quieta con "reducir movimiento".
- **Legibilidad:** contraste del texto del footer sobre la luz, en claro y oscuro.

## Verificación realizada

- **Enlaces:** las URL generadas por `courtPublicationsUrl()` son idénticas, carácter por carácter, a la URL dada (con el código de cada despacho), responden 200 y abren cada juzgado ya seleccionado.
- **Avisos de Remate:** los nombres derivados de `lib/courts.ts` son exactamente los de antes ("Juzgado 1" y "Juzgado 1 de Ejecución Civil del Circuito de Bucaramanga").
- **Luz, medida en Edge en tiempo real:**
  - se desplaza a la izquierda (~59 px/s = 706 px en 12 s);
  - está pausada (t = 0) con el footer fuera de pantalla en una página larga y se pone en marcha al llegar a él;
  - con "reducir movimiento" no se anima (`animation-name: none`).
- **Capturas:** escritorio claro y oscuro y celular; el texto se lee bien sobre la luz y la franja "©" la deja ver.
- **Ajuste al construir:** la pausa no se hace con una clase `animation-play-state` (el atajo `animation` la restablecería), sino con la variable `--glow-play` dentro del propio atajo.
- **Nota de pruebas:** Edge headless reporta "reducir movimiento" por defecto; para verificar animaciones hay que forzar `no-preference`.

## Ajuste posterior: nombre oficial de los juzgados

- **Nombre oficial:** "**Juzgado X Civil del Circuito de Ejecución de Sentencias de Bucaramanga**", definido una sola vez en `lib/courts.ts` (con `CONTACT_CITY`).
- **Dónde se usa:** el footer y Avisos de Remate (tabla, filtros y modal de detalle).
- **Excepción a propósito:** el paso 3 del tutorial Publicaciones Procesales mantiene "Juzgado 001 de Ejecución Civil del Circuito de Bucaramanga", porque es el texto que hay que escribir en el buscador del portal de la Rama Judicial, que usa ese nombre.
