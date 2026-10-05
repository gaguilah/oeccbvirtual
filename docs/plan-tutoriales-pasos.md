# Plan: disposición de los pasos de los tutoriales (construido el 2026-10-04)

Rediseño de los pasos en `/tutoriales/<slug>`: cada paso a lo ancho, con el texto a la izquierda, la captura a la derecha y el enlace centrado debajo. Además, una animación sutil al aparecer cada paso en pantalla.

## Situación actual

- **Ancho:** todo el contenido del tutorial está en una columna de `max-w-3xl` (~768 px), aunque la página permite `max-w-6xl` (~1152 px).
- **Cada paso:** número a la izquierda y, apilados, texto, enlace (alineado a la izquierda) y captura a todo el ancho.

## Decisiones

| Tema | Decisión |
| --- | --- |
| Ancho | Los pasos **y el resto del contenido** ("Antes de empezar", introducción y "¡Felicidades!") a **ancho completo** del contenedor (`max-w-6xl`) |
| Disposición en escritorio | Texto a la izquierda **40 %**, captura a la derecha **60 %**, enlace en una fila propia **debajo, centrado** |
| Alineación vertical | Texto **centrado** respecto a la captura |
| Desde qué ancho van lado a lado | Desde **`lg` (1024 px)**. Antes, apilado: texto, captura y enlace centrado |
| Animación al aparecer | **Sí, sutil**, solo con CSS y con `motion-safe:` (ver abajo) |

## 1. Cada paso

```
┌──────────────────────────────────────────────────────────────┐
│ (1)  Texto del paso…              │  ┌─────────────────────┐  │
│      (centrado verticalmente)     │  │     Captura          │  │
│                                   │  │   (clic = ampliar)   │  │
│                                   │  └─────────────────────┘  │
│              [ ↗ www.ramajudicial.gov.co ]  ← centrado        │
└──────────────────────────────────────────────────────────────┘
```

- **Grilla:** `lg:grid-cols-[2fr_3fr]` (40/60) con `lg:items-center`.
  - Izquierda: número del paso, título (si existe) y texto.
  - Derecha: `TutorialImage`, con el mismo zoom al hacer clic.
- **Enlace:** en una fila propia que abarca las dos columnas (`lg:col-span-2`), con el botón centrado (`justify-self-center`).
- **Paso sin captura:** el texto ocupa todo el ancho, sin columna vacía.
- **Paso sin enlace:** no hay fila de abajo.
- **Por debajo de `lg`:** apilado, en el orden texto → captura → enlace centrado.
- **Sin cambios:**
  - la tarjeta (`surface-container-lowest`, sin bordes);
  - la lista ordenada y el texto oculto "Paso N" para lectores de pantalla;
  - el enlace en pestaña nueva, con su aviso para lectores de pantalla.

## 2. Ancho completo

En `pages/Tutorial.tsx` se quita el `max-w-3xl` del contenedor del contenido. Los avisos "Antes de empezar" y "¡Felicidades!", la introducción y los pasos quedan alineados con el título y con los botones Anterior / Siguiente.

## 3. Animación al aparecer cada paso

- **Efecto:** fundido de 0 a 1 y desplazamiento de unos 16 px hacia arriba, mientras el paso entra en pantalla (`animation-range: entry 0% entry 40%`).
- **Técnica:** animación ligada al scroll, solo con CSS (`animation-timeline: view()`), sin JavaScript ni librerías. Se define como una utilidad `animate-step-reveal` en `index.css`.
- **Mejora progresiva:** la regla va dentro de `@supports (animation-timeline: view())`. Los navegadores sin soporte (hoy, Firefox) muestran los pasos normales, sin animación, y el contenido nunca queda oculto.
- **"Reducir movimiento":** se usa con `motion-safe:`, así que con esa preferencia no hay animación.
- **Al volver a subir,** el efecto se revierte suavemente, porque va ligado a la posición del scroll. Es el comportamiento normal de esta técnica.
- **Lo que no se afecta:** buscar con Ctrl+F, imprimir y los lectores de pantalla, porque el contenido siempre está en la página.

## Archivos

- **`components/tutorials/TutorialContent.tsx`:** grilla del paso y la clase de animación.
- **`pages/Tutorial.tsx`:** quitar `max-w-3xl`.
- **`src/index.css`:** utilidad `animate-step-reveal` y `@keyframes`, dentro de `@supports`.
- **`CLAUDE.md`:** documentar la disposición y la animación.

## Verificación

- **Capturas:** escritorio (claro y oscuro), 1024 px, tableta y celular, en un tutorial con enlaces (Publicaciones Procesales) y en uno sin enlaces.
- **Animación:** comprobar en Edge que los pasos fuera de pantalla empiezan ocultos y aparecen al hacer scroll, y que con "reducir movimiento" se ven sin animar.

## Verificación realizada

- **Capturas:**
  - Publicaciones Procesales (con enlaces) a 1440 px: texto 40 % centrado, captura 60 % y enlace centrado debajo;
  - Consulta de Estados (sin enlaces) en oscuro;
  - tableta a 768 px, apilado.
- **Animación, medida en Edge en tiempo real:**
  - el paso 5 tiene opacidad 0,03 fuera de pantalla y 1,00 al hacer scroll hasta él;
  - con "reducir movimiento" tiene 1,00 desde el inicio.

## Ajuste posterior: alto máximo de las capturas

- **El problema:** la captura de celular del paso 3 de Realización de Audiencias (proporción 2,21, más alta que ancha) ocupaba ~1000 px de alto.
- **La solución:** todas las capturas tienen un alto máximo de **384 px** en todos los tamaños (`max-h-96`, `w-full`, `object-contain`).
  - Las capturas horizontales (proporción 0,57) no llegan al límite y no cambian.
  - Las verticales quedan centradas sobre el fondo tonal.
  - El zoom las muestra completas.
- **Medido en Edge:** la captura de celular mide 384 px de alto a 390, 768, 1024 y 1440 px, y las demás conservan su tamaño (174 a 368 px según el ancho).
- **Relleno vertical:** el fondo tonal de cada captura tiene relleno vertical (12 px en celular y 16 px desde `sm`), para que la imagen no toque sus bordes superior e inferior.
- **Relleno horizontal:** también hay relleno horizontal, de la mitad del vertical (6 px en celular y 8 px desde `sm`), porque algunas capturas tocaban los bordes laterales.
