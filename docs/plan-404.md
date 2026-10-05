# Plan: página 404 (construida el 2026-10-04)

Página para direcciones que no existen, con ilustración (como las de las demás secciones), un botón "Ir al inicio" y accesos rápidos a los servicios.

## Situación actual

- **Dirección inexistente:** no hay ruta comodín (`*`), así que React no dibuja nada y la página queda **en blanco**, sin encabezado.
- **Tutorial inexistente** (`/tutoriales/xyz`): tiene su propio mensaje con `EmptyState`, con un diseño distinto.
- **Despliegue:** no hay configuración del servidor en el repositorio. El sitio se publicará en **Netlify**.
- **Título de la pestaña:** siempre es "oeccbvirtual".

## Decisiones

| Tema | Decisión |
| --- | --- |
| Hosting | Netlify: regla `/* /index.html 200` en `public/_redirects` |
| Accesos rápidos | Sí: enlaces a los servicios debajo de "Ir al inicio" |
| Tutorial inexistente | Usa la misma página 404, con textos y botón adaptados |
| Ilustración | "La ruta rota": la dirección se escribe sola, aparece el "404" y la conexión queda cortada |

## 1. Ruta

- **`App.tsx`:** `<Route path="*" element={<NotFound />} />` dentro del grupo de `PublicLayout`, con encabezado y footer.
- **`pages/Tutorial.tsx`:** si el slug no existe, muestra `<NotFound>` con:
  - título "Tutorial no encontrado";
  - texto "Es posible que la dirección esté mal escrita o que el tutorial ya no exista.";
  - botón principal "Ver todos los tutoriales" (`/tutoriales`).

## 2. Contenido (columna izquierda en escritorio)

- **"Error 404":** en pequeño, `primary`, mayúsculas y espaciado amplio, como "OECCB" en el inicio.
- **Título (`h1`):** "Página no encontrada".
- **La dirección intentada:** "No encontramos `<ruta>`", tomada de `useLocation().pathname`, en fuente de ancho fijo y con `break-all` por si es larga.
- **Texto:** "Revise que la dirección esté bien escrita o use uno de estos enlaces."
- **Botón principal "Ir al inicio"** (`ButtonLink` a `/`), con ícono de casa.
- **Accesos rápidos:** enlaces secundarios a los servicios, de `mainLinks` sin "Inicio": Avisos Remate, PQRS, Encuesta, Tutoriales y Contacto.
- **Props opcionales de `NotFound`:** `eyebrow`, `title`, `description` y `primaryAction` (texto y destino), para el caso del tutorial. Por defecto, los textos de la 404 general.

## 3. Ilustración: "la ruta rota"

Con las piezas comunes de `components/illustration/`: `IllustrationCanvas` con la inclinación común, `fade="left"` y `compact`.

**Tarjeta principal "Navegador":**
- **Barra de direcciones:** se escribe sola la **dirección real que se intentó abrir** (`animate-illustration-type`, con cursor), recortada si es muy larga. Antecedida por el dominio en tono atenuado.
- **Debajo:** un gran **"404"** en `primary` (`font-display`), una lupa y el texto "Sin resultados". Aparecen después de la escritura.
- **Acento:** rayado `primary` detrás (`IllustrationHatch`).

**Panel izquierdo "Rutas del sitio"** (sale por la izquierda, desvanecido):
- **Rutas reales** (de `mainLinks`) con `StatusDot` ● En línea.
- **Al final, la ruta intentada** con ✕ **"No existe"**, en rojo (color de estado permitido por `design.md`).

**Conexión cortada:** la línea entre el panel y la tarjeta es **punteada e interrumpida** a la mitad (metáfora del enlace roto).

**Menú oscuro flotante** (`IllustrationMenu`): "Ir al inicio" (resaltado) y "Ver servicios".

**Animación** (todo con `motion-safe:` y `[--illustration-delay:…]`):

| Momento | Qué pasa |
| --- | --- |
| 0 ms | Entra el panel de rutas |
| 150 ms | Entra el navegador |
| ~400 ms | Se escribe la dirección |
| ~1,9 s | Aparecen el "404" y "Sin resultados" |
| ~2,2 s | La ruta inexistente se marca como "No existe" |

Con "reducir movimiento" se ve el estado final.

Es decorativa (`aria-hidden`): la dirección intentada también está como texto real en la columna izquierda.

## 4. Diseño responsivo

| Pantalla | Diseño |
| --- | --- |
| Escritorio (`lg`+) | Texto y botones a la izquierda; ilustración a la derecha |
| Tableta y celular | Texto, botones y, debajo, la ilustración centrada (visible también en celular: la página tiene poco contenido) |

## 5. Detalles técnicos

- **Netlify:** `public/_redirects` con `/* /index.html 200`. Así, al abrir directamente cualquier dirección, Netlify entrega la aplicación y React muestra la 404 (o la página que corresponda). Vite copia `public/` a `dist/` en el build.
- **Título y buscadores:** mientras se muestra, la 404:
  - cambia el título de la pestaña a "OECCB Virtual | Página no encontrada" (o "OECCB Virtual | Tutorial no encontrado");
  - agrega `<meta name="robots" content="noindex">`;
  - al salir, restaura ambos.

  Se hace con un pequeño hook, `useDocumentMeta`, en `src/lib/`. El servidor responde 200 en una SPA (una "404 suave"); el `noindex` evita que se indexe.

## 6. Archivos

| Archivo | Cambio |
| --- | --- |
| `src/pages/NotFound.tsx` (nuevo) | La página, con props opcionales |
| `src/components/notfound/NotFoundIllustration.tsx` + `illustrationData.ts` + `index.ts` (nuevos) | La ilustración |
| `src/lib/useDocumentMeta.ts` (nuevo) | Título de la pestaña y `noindex` mientras la página está montada |
| `src/App.tsx` | Ruta `*` dentro del layout público |
| `src/pages/Tutorial.tsx` | Usa `NotFound` para un tutorial inexistente |
| `public/_redirects` (nuevo) | Regla de la SPA para Netlify |
| `CLAUDE.md` | Documentar la 404, `_redirects` y `useDocumentMeta` |

## Verificación

- **Capturas** de `/xyz` y de `/tutoriales/xyz` en escritorio (claro y oscuro), tableta y celular.
- **Comprobar en Edge** que la dirección intentada aparece en el texto y en la ilustración, que el título de la pestaña cambia y se restaura, y que el `noindex` aparece y desaparece.
- **Comprobar que `_redirects`** llega a `dist/` tras el build.

## Verificación realizada

- **Comprobado en Edge (protocolo de depuración):**

  | Dirección | Título de la pestaña | `noindex` | Botón principal | Dirección mostrada |
  | --- | --- | --- | --- | --- |
  | `/ruta-que-no-existe` | "OECCB Virtual \| Página no encontrada" | Sí | "Ir al inicio" → `/` | `/ruta-que-no-existe` |
  | `/tutoriales/xyz` | "OECCB Virtual \| Tutorial no encontrado" | Sí | "Ver todos los tutoriales" → `/tutoriales` | `/tutoriales/xyz` |

  En los dos casos aparecen los accesos rápidos (Avisos Remate, PQRS, Encuesta, Tutoriales, Contacto), el encabezado y el footer. Al hacer clic en "Ir al inicio" el título vuelve a ser el original y desaparece el `noindex`.
- **`dist/_redirects`** existe tras el build.
- **Capturas:** escritorio claro y oscuro y celular.

## Ajustes al construir

- **Panel de rutas:** el estado de cada ruta (● y ✕) y el texto "No existe" van **a la derecha**, porque el lado izquierdo del panel se desvanece y los cortaba.
- **Menú oscuro:** se movió a la esquina inferior derecha del navegador, bajo el "404", como acción sugerida que aparece al final de la secuencia (2,4 s). Antes tapaba el título de la tarjeta.
