# Plan: ilustración de PQRS (construida el 2026-10-02)

Ilustración decorativa para el encabezado de `/pqrs`. Cuenta el recorrido del formulario real: elegir el tipo, escribir la solicitud y recibir la confirmación. Usa las piezas comunes de `components/illustration/` y sigue `design.md`: solo tokens, sin `dark:` (salvo los colores de estado), con movimiento solo bajo `motion-safe:` y decorativa (`aria-hidden`).

## Decisiones

| Tema | Decisión |
| --- | --- |
| Celular | Oculta. Se muestra desde tableta (`md`), como en Avisos de Remate |
| Texto de la solicitud | Animado: se escribe solo, con cursor que parpadea |
| "Otros canales" | Se actualiza para tomar todo de `src/lib/contact.ts` y enlazar a Contacto |
| Desvanecido | A la izquierda (`fade="left"`), como Avisos de Remate |
| Tamaño de texto | `compact` (≈ 12 % más pequeño), por la cantidad de contenido |

## Composición (512 × 400 unidades, inclinación común)

### Panel izquierdo: "Tipo de solicitud" (sale por la izquierda, desvanecido)
- **Tarjeta con las 5 opciones** como botones de selección, igual que el paso 1 real.
- **Opción marcada:** **Petición**, con punto `primary` y borde resaltado.
- **Opciones sin marcar:** Queja, Reclamo, Sugerencia y Felicitación.
- **Datos:** los nombres salen de `requestTypes` (`components/pqrs/data.ts`).

### Panel principal: "Radicación en línea" (derecha)

**1. Tarjeta "Su solicitud" (principal):**
- **Mini indicador de pasos:** 1 Tipo ✓ · 2 Datos ✓ · 3 Solicitud (activo), con los colores del `StepIndicator` real.
- **Campos "Nombre" y "Correo":** barras de relleno, sin datos personales inventados.
- **Cuadro de texto:** la frase *"Solicito información sobre el estado de mi proceso…"* se escribe sola, con cursor.
- **Abajo:** la casilla "✓ Verificación de seguridad" (imita Turnstile) y el botón simulado "Enviar solicitud" (`IllustrationButton` primario).
- **Acento:** rayado `primary` detrás (`IllustrationHatch`).

**2. Tarjeta "Solicitud recibida" (debajo):** imita `RequestSent`.
- Círculo con ✓, "¡Gracias! Su solicitud fue recibida." y "Respuesta al correo registrado".
- `StatusDot` "Recibida".
- **Acento:** rayado neutro detrás.

### Conexión
Una línea de la tarjeta de tipos a la tarjeta "Su solicitud".

## Animación (todo con `motion-safe:`)

| Momento | Qué pasa |
| --- | --- |
| 0 ms | Entra el panel de tipos con "Petición" marcada |
| 150 ms | Entra "Su solicitud"; los ✓ de los pasos 1 y 2 aparecen uno tras otro |
| ~600 ms | El texto se escribe (≈ 1,5 s) y el cursor parpadea |
| ~2,2 s | Se marca la verificación |
| ~2,6 s | Entra "Solicitud recibida" con su ✓ |

**Animaciones nuevas en `index.css` (`@theme`):**
- **`illustration-type`:** revela el texto de izquierda a derecha con `steps()`, ancho de 0 a 100 % sobre un contenedor con `overflow-hidden`.
- **`illustration-caret`:** parpadeo del cursor.

**Con "reducir movimiento":** se ve el estado final completo (texto escrito, verificación marcada y confirmación visible) y el cursor queda fijo.

**Elevación:** las tarjetas suben al pasar el mouse (`lift`).

## Técnica

**Piezas comunes que se reutilizan:**
- `IllustrationCanvas` (`fade="left"`, `compact`), `IllustrationPanel`, `IllustrationCard` y `IllustrationRow`.
- `IllustrationHatch`, `IllustrationButton`, `StatusDot`, `illustrationIcons`, `enter`, `lift` y `connector`.

**Propias de PQRS (`components/pqrs/`):**
- `PqrsIllustration.tsx`: la composición.
- `MiniSteps.tsx`: el mini indicador de pasos.
- `illustrationData.ts`: textos y retrasos. Los tipos salen de `requestTypes` y los nombres de los pasos de los mismos textos del formulario (`STEPS` se mueve a `data.ts` para compartirlo, porque las constantes no pueden exportarse desde un `.tsx`).

**Colores:**
- **Tarjetas:** `surface-container-lowest`.
- **Paneles:** `surface-container-low`.
- **Acentos:** `primary`.
- **Estados:** verde para "Recibida" y el ✓, que son colores de estado permitidos.

## Página `/pqrs`

### Encabezado
| Pantalla | Diseño |
| --- | --- |
| Escritorio (`lg`+) | Dos columnas: el texto actual a la izquierda (Atención al ciudadano, "PQRS", los cinco tipos y "Radicar solicitud") y la ilustración a la derecha |
| Tableta (`md`–`lg`) | Texto y, debajo, la ilustración centrada al 90 % (máx. `max-w-lg`) |
| Celular | Solo el texto y el botón (`hidden md:block` en la ilustración) |

"PQRS" baja de `lg:text-8xl` a `lg:text-7xl` para compartir la fila con la ilustración.

### "Otros canales de atención"
- **Datos de `src/lib/contact.ts`:** correo (`mailto:`), dirección con `CONTACT_CITY` y `CONTACT_DEPARTMENT`, y horario (`CONTACT_DAYS`, `CONTACT_HOURS`, `CONTACT_HOURS_NOTE`).
- **Enlace:** "Ver todos los datos de contacto" hacia `/contacto`.

El formulario y su lógica no cambian.

## Archivos

**Nuevos:**
- `components/pqrs/PqrsIllustration.tsx`
- `components/pqrs/MiniSteps.tsx`
- `components/pqrs/illustrationData.ts`

**Cambios:**
- `components/pqrs/data.ts`: recibe `STEPS` desde `PqrsForm.tsx`.
- `components/pqrs/PqrsForm.tsx`: importa `STEPS` desde `data.ts`.
- `src/index.css`: animaciones `illustration-type` e `illustration-caret`.
- `pages/Pqrs.tsx`: encabezado a dos columnas y "Otros canales" desde `contact.ts`.
- `CLAUDE.md`: la ilustración de PQRS.

## Verificación
- **Capturas:** escritorio (claro y oscuro), tableta y celular; en celular la ilustración no debe aparecer.
- **Formulario:** probar que el formulario sigue funcionando igual tras mover `STEPS`.

## Ajustes al construir

- **`illustration-type`:** anima `max-width` (no `width`), porque `width` no puede animarse hasta `auto`. Así el cursor queda pegado al final del texto.
- **Frase acortada:** pasó a *"Solicito información sobre mi proceso…"* para que quepa en una línea.
- **Indicador de pasos:** tiene los tres círculos y el texto "Paso 3 de 3 · Su solicitud", tomado de `REQUEST_STEPS`. Los nombres completos de los tres pasos no cabían en la tarjeta.
