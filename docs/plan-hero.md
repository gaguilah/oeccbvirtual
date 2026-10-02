# Plan: ilustración del hero del inicio (construida el 2026-10-02)

Ilustración decorativa junto al título del inicio, inspirada en la de laravel.com/cloud/network: tarjetas de interfaz sobre un plano inclinado, con fondo de puntos, bordes desvanecidos y animación de entrada. No se copia el SVG de Laravel: se construye con HTML + Tailwind.

## Contenido (datos fijos)

**Panel "Servicios en línea":**
- **Tarjeta "Tutoriales":** tres filas con número, título y, a la derecha, la cantidad de pasos ("6 pasos"). Al construirla, "● Disponible" cortaba los títulos, por eso se cambió por los pasos. Los títulos y los pasos salen de `components/tutorials/data.ts`, así se actualizan solos.
- **Menú oscuro flotante:** "Ver tutorial" (resaltado) y "Paso siguiente". Al pasar el mouse, el resaltado cambia a la opción bajo el cursor.
- **Tarjeta "PQRS":** "Solicitud radicada" con ● Recibida.

**Panel "Publicaciones procesales":**
- **Tarjeta "Juzgados de ejecución":** Estados, Traslados y Edictos, cada uno con ● Publicado. Queda parcialmente fuera del cuadro, desvanecido.

**Línea de conexión** entre los dos paneles.

Sin radicados ni fechas reales, para que nadie lo confunda con información oficial.

## Técnica

- **Escala:** el diseño mide 512 × 400 unidades. La utilidad `hero-scale` de `index.css` define `--u` = 1/512 del ancho del contenedor (`cqw`) y redefine `--spacing`, los tamaños de texto y los radios en función de `--u`. Así las clases normales de Tailwind (`p-4`, `text-sm`, `left-14`) escalan con el ancho, sin JavaScript.
- **Inclinación:** un plano con `transform: matrix(.996, .087, -.174, .985, 0, 0)` (≈ 5° de giro y 10° de inclinación), como en el original.
- **Colores:** solo tokens del diseño, así funciona en modo claro y oscuro. El menú oscuro usa dos tokens nuevos, `inverse-surface` y `on-inverse-surface`. Los estados usan el verde de los colores de estado.
- **Fondo y bordes:** puntos con `radial-gradient` en `on-surface` a baja opacidad, y bordes desvanecidos con las máscaras de Tailwind v4 (`mask-r-from-*`, `mask-b-from-*`), no con rectángulos blancos.
- **Animación:** entrada escalonada (`animate-hero-in` con retrasos de 0 / 150 / 300 / 450 ms), y elevación de las tarjetas al pasar el mouse. Todo con `motion-safe:`, así con "reducir movimiento" se ve quieta.
- **Accesibilidad:** `aria-hidden="true"` y ningún elemento enfocable. No se usa `inert`, porque desactivaría el efecto al pasar el mouse, y no hace falta: no hay nada enfocable.

## Diseño responsivo

| Pantalla | Diseño |
| --- | --- |
| Escritorio (`lg`+) | Dos columnas: texto a la izquierda, ilustración a la derecha |
| Tableta y celular | Ilustración debajo del título, al 90 % del ancho (máximo `max-w-lg`) |

La ilustración mantiene la proporción 512 × 400 (`aspect-[512/400]`) para que la página no salte al cargar.

## Archivos

**`src/components/home/`:**
- `HeroIllustration.tsx`: composición.
- `IllustrationPanel.tsx`, `IllustrationCard.tsx`, `IllustrationMenu.tsx`, `StatusDot.tsx`.
- `data.ts`: PQRS, Publicaciones y los slugs de los tutoriales que se muestran.
- `index.ts`.

**También cambian:**
- `src/index.css`: utilidad `hero-scale`, animación `hero-in` y tokens `inverse-surface` / `on-inverse-surface`.
- `design.md`: los tokens nuevos.
- `src/pages/Home.tsx`: hero a dos columnas.

Las tarjetas de servicios de abajo no cambian.
