# Plan: Servicios del inicio como carrusel con ilustraciones (planeado el 2026-10-27)

Hoy la sección **Servicios** del inicio es una cuadrícula de 5 tarjetas (Avisos Remate, Audiencias,
PQRS, Encuesta, Tutoriales) con ícono, título, descripción de una línea e "Ingresar →"
(`components/services/ServiceCard`, datos en `components/services/data.ts`). Se cambia por un
carrusel de tarjetas grandes, inspirado en una tarjeta de producto (título, gráfico, texto) con
botones ‹ › debajo.

## Decisiones

| Tema | Decisión |
| --- | --- |
| Orden dentro de la tarjeta | **Título → ilustración → descripción → acción**. Toda la tarjeta es un enlace a su servicio |
| Ilustración | La de la página de cada servicio (`RematesIllustration`, `AudienciasIllustration`, `PqrsIllustration`, `SurveyIllustration`, `TutorialsIllustration`), **sin animaciones** |
| Acción | Propia de cada servicio en vez de "Ingresar" (ver textos) |
| Textos | Descripciones nuevas que dan protagonismo a la **Oficina** (no a los juzgados), sin afirmar quién publica cada aviso o audiencia, para que sigan siendo ciertas si cambian los permisos |
| Fuente de los textos | **Una sola**: `services/data.ts`. Contacto ("Canales en línea": PQRS, Encuesta, Tutoriales) muestra las mismas descripciones y acciones; su tarjeta (`ServiceCard`) conserva la forma actual |
| Vuelta al inicio | **Simple**: en la última tarjeta, › vuelve desplazándose a la primera; en la primera, ‹ va a la última. Los botones nunca se desactivan. Se descartó el carrusel infinito con copias (≈ 3 veces el código, copias ocultas para lectores y Tab, y brincos al deslizar en Safari) |
| Celular (< 768 px) | Una tarjeta, con un **borde de la siguiente asomando** para que se note que hay más |
| Tablet (768–1023 px) | Título "Servicios" arriba, **una tarjeta y media**; al avanzar, la que se veía a medias pasa al inicio. Botones debajo, a la derecha |
| Pantalla grande (≥ 1024 px) | **Opción B**: columna izquierda (≈ ¼) con "Servicios", la frase y los botones ‹ ›; a la derecha la tarjeta (≈ la mitad del contenido, lo que hoy ocupan 2,5 tarjetas) y la siguiente a medias |
| Frase de la columna | "Consultas y trámites en línea con la Oficina, sin desplazarse." (sin el nombre oficial: es largo y ya es el título de la portada) |
| Avance automático | No: el carrusel solo se mueve cuando el usuario lo pide |

```
Celular             Tablet                         Pantalla grande (B)
┌──────────┐┌      ┌──────────────┐ ┌──────      ┌──────────┐┌──────────────┐ ┌──────
│ título   ││      │ título       │ │ títu       │ Servicios││ título       │ │ títu
│ ilustr.  ││      │ ilustración  │ │ ilus       │ frase    ││ ilustración  │ │ ilus
│ texto    ││      │ texto        │ │ text       │          ││ texto        │ │ text
│ Acción → ││      │ Acción →     │ │ Acci       │ ‹  ›     ││ Acción →     │ │ Acci
└──────────┘└      └──────────────┘ └──────      └──────────┘└──────────────┘ └──────
      ‹  ›                          ‹  ›
```

## Textos aprobados

Los títulos no cambian (los del menú y el footer).

| Servicio | Descripción | Acción |
| --- | --- | --- |
| Avisos Remate | La Oficina de Apoyo reúne en un solo lugar los avisos de remate: consulte la fecha y hora, el radicado y el aviso en PDF para verlo o descargarlo. | Ver avisos de remate |
| Audiencias | La Oficina de Apoyo le acerca a sus audiencias: consulte cuáles están programadas, conéctese con el enlace a la hora indicada y vea la grabación cuando esté disponible. | Ver audiencias |
| PQRS | Escríbale a la Oficina de Apoyo: envíe su petición, queja, reclamo, sugerencia o felicitación, y reciba un número de radicado y la respuesta en su correo. | Crear PQRS |
| Encuesta | Cuéntele a la Oficina cómo lo atendimos. Son pocas preguntas, sus respuestas son anónimas y nos ayudan a mejorar cada día. | Responder encuesta |
| Tutoriales | La Oficina preparó guías paso a paso, con imágenes, para que consulte publicaciones procesales, estados y traslados, y se conecte a sus audiencias. | Ver tutoriales |

Columna izquierda (≥ 1024 px): **Servicios** · "Consultas y trámites en línea con la Oficina, sin desplazarse."

## Ilustraciones quietas

Las animaciones de las ilustraciones (`index.css`) usan `fill-mode: both` y los estilos base son el
estado final, así que basta con apagarlas para verlas completas:

- `IllustrationCanvas` recibe `still`: apaga toda animación dentro del lienzo (barras llenas, textos
  completos, cursor fijo) y quita los efectos de hover internos (`pointer-events: none`), para que
  solo reaccione la tarjeta.
- Excepción: Tutoriales alterna 6 textos apilados (`animate-illustration-cycle`); quieta mostraría
  los 6 a la vez. En modo quieto muestra solo el primero.
- La ilustración de Tutoriales es 3:2 y las demás 512 × 400: va centrada en el mismo espacio para
  que todas las tarjetas midan lo mismo.
- En las páginas de cada servicio las ilustraciones siguen animadas.

## Carrusel

- Desplazamiento nativo del navegador (`overflow-x` + scroll snap, cada tarjeta se alinea al borde
  izquierdo del contenido), sin librerías: en celular y tablet también se desliza con el dedo. Sin
  barra de desplazamiento visible; la página no debe tener desplazamiento horizontal.
- Botones ‹ › redondos (`aria-label` "Servicio anterior" / "Servicio siguiente") que llevan a la
  tarjeta anterior o siguiente con la vuelta descrita arriba. La lógica de índice (siguiente,
  anterior, vuelta) va en un `.ts` aparte, con pruebas en Vitest.
- Accesibilidad: región con `aria-roledescription="carrusel"`, cada tarjeta "Servicio n de 5";
  un aviso `aria-live="polite"` anuncia "Servicio 2 de 5: Audiencias" al usar los botones; con Tab
  se recorren las tarjetas y la enfocada se desplaza a la vista; con "reducir movimiento" el
  desplazamiento es instantáneo.

## Archivos

- `components/services/`: `ServicesCarousel` (fila, botones, aviso), `ServiceSlide` (tarjeta),
  `ServiceIllustration` (elige la ilustración por servicio, `still`), helper `.ts` del índice +
  prueba. `data.ts` gana `action` y las descripciones nuevas; `ServiceCard` (Contacto) muestra
  `action` en vez de "Ingresar".
- `components/illustration/IllustrationCanvas`: opción `still`; `tutorials/TutorialsIllustration`:
  versión quieta (solo el primer texto).
- `pages/Home.tsx`: el carrusel en lugar de la cuadrícula.
- Documentación: este plan y CLAUDE.md (la frase "home services grid (5 cards: `lg` 3 columns,
  `xl` 5)" en Audiencias, la sección de ilustraciones y la de Contacto).

## Pruebas

- Vitest: siguiente / anterior, de la última a la primera y de la primera a la última.
- Navegador (Edge) a 390, 768, 1024, 1280 y 1440 px: tarjetas visibles en cada ancho, vuelta
  completa con los botones, sin desplazamiento horizontal de la página, modo oscuro, teclado,
  "reducir movimiento" (headless Edge lo trae activo: ver nota de CLAUDE.md) e ilustraciones
  quietas. Contacto con los textos nuevos.
