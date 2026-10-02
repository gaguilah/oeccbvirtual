# Plan: ilustración de Tutoriales (construida el 2026-10-02)

Ilustración decorativa para el encabezado de `/tutoriales`, basada en la imagen `Network.png` de Laravel Cloud (enterprise). Se mantienen la izquierda y la derecha de la referencia y se cambia el centro por contenido de los tutoriales. Sigue `design.md` y el estándar de las otras ilustraciones: decorativa (`aria-hidden`), movimiento solo bajo `motion-safe:` y datos reales, sin inventar.

## La referencia

- **Formato:** plana (sin inclinación), proporción **3:2**, fondo de puntos y desvanecida solo abajo (`mask-b-from-70%`).
- **Izquierda:** tres íconos de **persona con ✓** en recuadros, sobre **líneas** con esquinas redondeadas que confluyen en una sola línea hacia el centro.
- **Centro:** panel con **doble contorno**, rótulo arriba e ícono a la derecha. Dentro, una tarjeta con encabezado y filas "etiqueta → valor", y un **selector segmentado** flotante encima.
- **Derecha:** una línea hacia una **columna de tres recuadros con íconos**, también con doble contorno.

## Decisiones

| Tema | Decisión |
| --- | --- |
| Color de la izquierda | **Verde**, como en la referencia, entendido como el estado "ciudadano atendido" (persona con ✓). Es la excepción de colores de estado de `design.md` |
| Centro | Recorre **los 6 tutoriales** en el orden de la página, 3 s cada uno (ciclo de 18 s). Al principio eran 3; se ampliaron a pedido |
| Pulsos de luz en las líneas | **No** |
| Íconos de la derecha | **Libro abierto** (`book-open`) en los tres recuadros, repetido como en la referencia |
| Responsivo | Visible también en celular: debajo del título y centrada hasta `lg` (ancho completo en celular, 90 % desde `sm`, máx. `max-w-lg`); dos columnas en escritorio. A diferencia de Remates, aquí no se oculta |

## Composición (lienzo plano de 512 × 341 unidades, proporción 3:2)

### Izquierda (igual que la referencia)
- **Tres personas con ✓:** recuadros con borde verde (`green-600`, `dark:` `green-400`) e ícono `user` con ✓.
- **Líneas verdes:** con esquinas redondeadas, confluyen en una sola línea que entra al panel central.

### Centro: panel "Tutoriales · OECCB"
- **Panel con doble contorno:** fondo `surface-container-low` y contorno `on-surface/10`. Arriba a la derecha, un ícono de reproducir en un círculo `primary-container` (en lugar del escudo).
- **Tarjeta interior** (`surface-container-lowest`), con datos de `components/tutorials/data.ts`:
  - **Encabezado:** ícono de reproducir y el **título del tutorial**.
  - **Fila "Pasos":** `steps.length` pasos.
  - **Fila "Capturas de apoyo":** cantidad de pasos con imagen.
- **Selector segmentado flotante:** **"▶ Paso a paso"** resaltado (`primary-container`, texto `primary`) | "Con capturas".
- **Ciclo:** la tarjeta muestra uno de los 3 tutoriales a la vez y cambia cada ~3 s con un fundido suave (ciclo de 9 s).

### Derecha (igual que la referencia)
- **Línea `primary`:** del panel central a la columna.
- **Columna con doble contorno:** tres recuadros `surface-container-low` con el ícono **libro abierto** (`on-surface-variant`).

## Animación (todo con `motion-safe:`)

- **Entrada escalonada:** izquierda (0 ms) → centro (150 ms) → derecha (300 ms), con `illustration-in`.
- **Ciclo de tutoriales:** animación nueva `illustration-cycle` (opacidad: aparece, se mantiene y desaparece en un tercio del ciclo), solo con CSS. Cada tutorial recibe un retraso de 0 s, 3 s o 6 s. Las tres versiones de la tarjeta están apiladas en el mismo lugar.
- **Con "reducir movimiento":** se ve fijo el primer tutorial (Publicaciones Procesales).
- **Sin pulsos en las líneas.**

## Técnica

### Piezas comunes (`components/illustration/`)

| Pieza | Cambio |
| --- | --- |
| `IllustrationCanvas` | Opción `flat` (sin inclinación) y `ratio` (`'512/400'` por defecto o `'3/2'`). Nuevo `fade="bottom"` (desvanece solo abajo) |
| `IllustrationSegmented` (nueva) | Selector segmentado decorativo: una opción resaltada con ícono y las demás neutras. Reutilizable |
| `icons.ts` | Íconos `user`, `bookOpen` y el ✓ pequeño para la persona |

Inicio, Contacto, Remates, PQRS y Encuesta no cambian, porque las opciones nuevas tienen valores por defecto.

### Propias de Tutoriales (`components/tutorials/`)
- **`TutorialsIllustration.tsx`:** la composición.
- **Líneas:** un SVG con `viewBox="0 0 512 341"`, que escala con el ancho como el resto del lienzo, con trazos `stroke-green-600` y `stroke-primary`.
- **`illustrationData.ts`:** los 3 slugs del ciclo, sus retrasos (clases completas para Tailwind) y los textos. Título, pasos y capturas salen de `tutorials`.

### Estilos (`index.css`)
Animación `illustration-cycle` en `@theme`.

### Colores
- **Tokens:** superficies, `primary`, `primary-container` y `on-surface`.
- **Excepción:** el verde de la izquierda, como color de estado.

## Página `/tutoriales`

| Pantalla | Diseño del encabezado |
| --- | --- |
| Escritorio (`lg`+) | Breadcrumb, título y descripción a la izquierda; ilustración a la derecha |
| Tableta (`md`–`lg`) | Ilustración debajo del título, centrada al 90 % (máx. `max-w-lg`) |
| Celular | Ilustración centrada debajo del título, a ancho completo (máx. `max-w-lg`) |

La cuadrícula de tarjetas y las páginas de detalle de cada tutorial no cambian.

## Archivos

**Nuevos:**
- `components/illustration/IllustrationSegmented.tsx`
- `components/tutorials/TutorialsIllustration.tsx`
- `components/tutorials/illustrationData.ts`

**Cambios:**
- `components/illustration/IllustrationCanvas.tsx`: `flat`, `ratio` y `fade="bottom"`.
- `components/illustration/icons.ts` y `index.ts`.
- `components/tutorials/index.ts`.
- `src/index.css`: animación `illustration-cycle`.
- `pages/Tutoriales.tsx`: encabezado a dos columnas.
- `CLAUDE.md`: la ilustración de Tutoriales y las opciones nuevas del lienzo.

## Verificación
- **Capturas:** escritorio (claro y oscuro), tableta y celular.
- **Las otras ilustraciones:** el inicio, Contacto, Remates, PQRS y Encuesta deben verse igual.

## Ajustes al construir

- **Tarjeta central fija:** no se apilan 3 tarjetas. Hay una sola tarjeta, y solo el **título** y las **cifras** se turnan, cada uno apilado en su lugar. Con tarjetas semitransparentes superpuestas, los textos se veían fantasmales durante el cambio.
- **Ciclo sin solapamiento:** cada texto termina de desaparecer antes de que llegue el siguiente.
- **Selector segmentado:** quedó encima del borde de la tarjeta, sin tapar el título; las líneas y las personas se realinearon a la nueva altura.
- **Corrección general de los retrasos (afecta a todas las ilustraciones):**
  - **Problema 1:** las clases `[animation-delay:…]` nunca tuvieron efecto, porque el atajo `animation` de `motion-safe:animate-…` va después en el CSS y las restablece a 0. Por eso la entrada escalonada no funcionaba en ninguna ilustración.
  - **Problema 2:** al poner el retraso en las variables `--animate-*` del tema, se resolvía en `:root` (siempre 0).
  - **Solución:** las animaciones pasaron a ser `@utility` con `var(--illustration-delay)` dentro del atajo, y cada pieza fija su retraso con `[--illustration-delay:…]` (una `@property` no heredada).
  - **Verificación:** se midió en Edge real, con el protocolo de depuración, que el ciclo alterna los 3 tutoriales y que las cinco ilustraciones anteriores ahora escalonan su entrada.
- **Ciclo ampliado a los 6 tutoriales:** `animate-illustration-cycle` pasó a 18 s con turnos de 3 s, y los retrasos van en `CYCLE_DELAYS` (`illustrationData.ts`). Si cambia la cantidad de tutoriales, hay que ajustar ambos. "paso/pasos" e "imagen/imágenes" se escriben en singular cuando la cifra es 1.
