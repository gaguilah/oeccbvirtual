# Plan: ilustración de la Encuesta (construida el 2026-10-02)

Ilustración decorativa para el encabezado de `/encuesta`. Como en PQRS, cuenta el recorrido real: responder, revisar y enviar. El momento llamativo es una calificación con **estrellas pequeñas que se llenan una por una** hasta la quinta. Usa las piezas comunes de `components/illustration/` y sigue `design.md`: solo tokens, sin `dark:` (salvo los colores de estado), con movimiento solo bajo `motion-safe:` y decorativa (`aria-hidden`).

## Decisiones

| Tema | Decisión |
| --- | --- |
| Responsivo | Igual que PQRS: oculta en celular; diseño de tableta desde 640 px; ilustración desde 768 px |
| Preguntas de ejemplo | *"¿Encontró la información que buscaba?"* (Sí / No) y *"Califique la atención"* (calificación), con textos fijos y sin consultar Supabase |
| Calificación | **Estrellas pequeñas** (5) que se llenan una por una. El formulario real usa números; en la ilustración se eligen estrellas por ser más expresivas |
| Estadísticas | Ninguna: la ilustración muestra *una* respuesta, no resultados, para no confundirla con datos reales de la oficina |
| Desvanecido y texto | `fade="left"` y `compact`, como Remates y PQRS |

## Composición (512 × 400 unidades, inclinación común)

### Panel izquierdo: "Preguntas" (sale por la izquierda, desvanecido)
- **Tarjeta con la pregunta Sí / No** *"¿Encontró la información que buscaba?"*: **Sí** marcado (resaltado `primary-container` con ✓) y **No** sin marcar, como las opciones reales (`ChoiceOption`).

### Panel principal: "Encuesta de satisfacción" (derecha)

**1. Tarjeta "Califique la atención" (principal):**
- **Progreso:** "Pregunta 3 de 5" con la barra en degradado `primary`, como `SurveyProgress`. Avanza de 40 % a 60 % al entrar.
- **Cinco estrellas pequeñas** (≈ 16 unidades), con contorno `outline-variant` cuando están vacías. Se llenan de `primary` una tras otra hasta la quinta.
- **Etiquetas de los extremos:** "Muy insatisfecho" y "Muy satisfecho", en mayúsculas pequeñas como en la página real.
- **Al completarse:** la quinta estrella tiene un pulso suave y aparece encima un globo `inverse-surface` con **"Excelente"**.
- **Acento:** rayado `primary` detrás (`IllustrationHatch`).

**2. Tarjeta "Revise sus respuestas" (debajo):** imita el paso final real.
- **Filas:**
  - "Información encontrada → **Sí**"
  - "Calificación de la atención → ★★★★★" (estrellas pequeñas llenas)

  Cada una con "Editar" en `primary`, y aparecen una tras otra.
- **Pie:** casilla "✓ Verificación de seguridad" y `StatusDot` **Enviada**.
- **Acento:** rayado neutro detrás.

### Conexión
Una línea de la pregunta Sí / No a la tarjeta de calificación.

## Animación (todo con `motion-safe:`)

| Momento | Qué pasa |
| --- | --- |
| 0 ms | Entra la pregunta Sí / No con **Sí** marcado |
| 150 ms | Entra la tarjeta de calificación; la barra avanza de 40 % a 60 % |
| ~600 ms | Las estrellas se llenan una por una (≈ 150 ms cada una) |
| ~1,4 s | Pulso en la quinta estrella y aparece el globo "Excelente" |
| ~1,8 s | Entra "Revise sus respuestas"; sus filas aparecen una tras otra |
| ~2,6 s | Se marca la verificación y aparece ● Enviada |

**Animaciones:** solo se reutilizan las existentes, sin crear nuevas:
- `illustration-in` para las estrellas llenas, que aparecen sobre las vacías con un retraso cada una;
- `illustration-fill` para la barra;
- `animate-ping` para el pulso.

**Con "reducir movimiento":** se ve el estado final (5 estrellas llenas, el globo, la revisión completa y ● Enviada).

**Elevación:** las tarjetas suben al pasar el mouse (`lift`).

## Técnica

**Piezas comunes que se reutilizan:**
- `IllustrationCanvas` (`fade="left"`, `compact`), `IllustrationPanel`, `IllustrationCard` e `IllustrationRow`.
- `IllustrationHatch`, `StatusDot`, `illustrationIcons` (se agrega el ícono `star`), `enter`, `lift` y `connector`.

**Propias de la encuesta (`components/survey/`):**
- `SurveyIllustration.tsx`: la composición.
- `MiniStars.tsx`: las estrellas, en dos tamaños (calificación y revisión), con la opción de animar el llenado.
- `illustrationData.ts`: textos, cantidad de estrellas y los retrasos de cada una (clases completas para Tailwind).

**Colores:**
- **Estrellas:** `primary` llenas y `outline-variant` vacías.
- **Superficies:** tarjetas `surface-container-lowest` y paneles `surface-container-low`.
- **Globo:** `inverse-surface`.
- **Estados:** verde solo para "Enviada" y el ✓.

## Página `/encuesta`

### Encabezado (mismo estándar que PQRS)
| Pantalla | Diseño |
| --- | --- |
| Menos de 640 px | Todo apilado y el botón a lo ancho; sin ilustración |
| 640 px a 1023 px | "Su opinión cuenta" + **Encuesta** a la izquierda; "Ayúdenos a mejorar nuestros servicios" y "Responder le tomará solo unos minutos" al lado; el botón "Responder encuesta" debajo. Desde 768 px, la ilustración va debajo, centrada al 90 % (máx. `max-w-lg`) |
| Desde 1024 px | Texto apilado a la izquierda e ilustración a la derecha |

"Encuesta" baja a `lg:text-7xl` como máximo, para compartir la fila con la ilustración. El subtítulo usa `text-xl` y pasa a `md:text-2xl`, como en PQRS.

El formulario de la encuesta, su carga desde Supabase y su lógica no cambian.

## Archivos

**Nuevos:**
- `components/survey/SurveyIllustration.tsx`
- `components/survey/MiniStars.tsx`
- `components/survey/illustrationData.ts`

**Cambios:**
- `components/illustration/icons.ts`: ícono `star`.
- `pages/Encuesta.tsx`: encabezado responsivo con la ilustración.
- `CLAUDE.md`: la ilustración de la encuesta.

## Verificación
Capturas en escritorio (claro y oscuro) y en 500, 640, 768 y 1280 px. Comprobar que la encuesta sigue cargando y respondiéndose igual.

## Ajustes al construir

- **Barra de progreso:** se llena de 0 a 60 % al entrar, reutilizando `illustration-fill` en lugar de crear una animación nueva de 40 % a 60 %.
- **Globo "Excelente":** se bajaron las estrellas y se agrandó la tarjeta para que no tape la barra de progreso.
- **Botón "Responder encuesta":** en celular ocupa todo el ancho, como "Radicar solicitud" en PQRS.
