# Plan: página de Contacto con ilustración (construida el 2026-10-02)

Rediseño de `/contacto` con una ilustración decorativa como la del inicio (ver `docs/plan-hero.md`). La pieza principal es un mapa esquemático y un correo electrónico. Los datos reales de contacto también se muestran como contenido accesible, porque la ilustración es `aria-hidden`.

## Decisiones

| Tema | Decisión |
| --- | --- |
| Piezas de ilustración | Las que usan varias secciones pasan a `components/illustration/` |
| Google Maps | Botón "Ver en Google Maps" que abre una pestaña nueva con un enlace de búsqueda. Sin mapa incrustado ni clave de API |
| Horario | **Lunes a viernes (días hábiles), 08:00 a. m. a 04:00 p. m., jornada continua** |
| Teléfono | No se muestra (no hay dato) |
| Ciudad | "Bucaramanga, Santander" |

## Datos (`src/lib/contact.ts`)

Todo sale de aquí, sin repetir textos (regla de `CLAUDE.md`).

| Constante | Estado | Valor |
| --- | --- | --- |
| `CONTACT_EMAIL` | existente | `ofejccbuc@cendoj.ramajudicial.gov.co` |
| `CONTACT_ADDRESS` | existente | `Carrera 12 No. 31-08` |
| `CONTACT_CITY` | existente | `Bucaramanga` |
| `CONTACT_DEPARTMENT` | nueva | `Santander` |
| `CONTACT_DAYS` | nueva | `Lunes a viernes (días hábiles)` |
| `CONTACT_HOURS` | nueva | `08:00 a. m. a 04:00 p. m.` |
| `CONTACT_HOURS_NOTE` | nueva | `Jornada continua` |
| `CONTACT_MAPS_URL` | nueva | `https://www.google.com/maps/search/?api=1&query=<dirección, ciudad, departamento>` (codificada) |

## 1. Piezas comunes: `components/illustration/`

Se mueven desde `components/home/`:
- `IllustrationPanel`, `IllustrationCard` + `IllustrationRow`, `IllustrationMenu` y `StatusDot`.

Se agrega:
- **`IllustrationCanvas`:** el marco común: `@container`, escala, plano inclinado, puntos y máscaras de desvanecido. Hoy está dentro de `HeroIllustration`.

En `index.css`, las utilidades pasan a nombres genéricos: `hero-scale` → `illustration-scale`, `hero-dots` → `illustration-dots` y `animate-hero-in` → `animate-illustration-in`.

`components/home/` queda con `HeroIllustration` y sus datos. El inicio debe verse igual que antes.

## 2. Ilustración de contacto (datos fijos de `contact.ts`)

**Panel "Ubicación":**
- **Tarjeta "Mapa"** (ícono de pin):
  - **Mapa esquemático en SVG:** cuadras de color `surface-container`, separadas por calles con fondo `surface-container-lowest`. Calles rotuladas "Cra. 12" y "Calle 31", y un pin `primary` en el cruce, con un pulso suave (`motion-safe:animate-ping`).
  - **Debajo:** `Carrera 12 No. 31-08` y `Bucaramanga, Santander`.
  - Es un dibujo, no un mapa real.
- **Menú oscuro flotante:** "Cómo llegar" (resaltado) y "Copiar dirección".
- **Tarjeta "Correo electrónico"**, con forma de mensaje nuevo:
  - **Para:** el correo.
  - **Asunto:** Solicitud de información.
  - **Cuerpo:** una barra gris simulada.

**Panel "Atención"** (parcialmente fuera del cuadro):
- **Tarjeta "Horario":** `08:00 a. m. – 04:00 p. m.` con ● Jornada continua.
- **Filas** PQRS, Encuesta y Tutoriales, cada una con ● En línea.

**Animación:** igual que en el inicio (entrada escalonada y elevación al pasar el mouse), con `motion-safe:`.

## 3. Página `/contacto`

**Encabezado como el hero del inicio:**

| Pantalla | Diseño |
| --- | --- |
| Escritorio (`lg`+) | Izquierda: breadcrumb, título y descripción. Derecha: ilustración |
| Tableta y celular | Ilustración centrada debajo del título, al 90 % del ancho |

**Tarjetas con los datos reales (accesibles):**
1. **Correo electrónico:** enlace `mailto:` y botón "Copiar correo", que confirma con "¡Copiado!". Si el navegador no permite copiar, muestra un mensaje alternativo.
2. **Dirección:** `Carrera 12 No. 31-08`, `Bucaramanga, Santander` y el botón **"Ver en Google Maps"** (pestaña nueva, `noopener`).
3. **Horario de atención:** lunes a viernes (días hábiles), `08:00 a. m. a 04:00 p. m.`, jornada continua.
4. **Canales en línea:** enlaces a PQRS, Encuesta y Tutoriales.

## 4. Archivos

**Nuevos:**
- `components/illustration/`: piezas comunes, `IllustrationCanvas` e `index.ts`.
- `components/contacto/`:
  - `ContactIllustration.tsx`, `MapSketch.tsx` y `data.ts`;
  - `ContactCards.tsx` y `CopyButton.tsx`;
  - `index.ts`.

**Cambios:**
- `components/home/`: usa las piezas comunes.
- `index.css`: utilidades con nombres genéricos.
- `lib/contact.ts`: constantes nuevas.
- `pages/Contacto.tsx`: el nuevo diseño.
- `CLAUDE.md`: documenta las piezas comunes y la página de contacto.

## Footer

Muestra también "Bucaramanga, Santander" y el horario (días, horas y jornada continua), tomados de `contact.ts`.

## Cambio tras la revisión

Para no repetir datos, las tarjetas de Correo, Dirección y Horario se reemplazaron por una lista compacta (`ContactSummary`) bajo el título del encabezado. Debajo queda solo "Canales en línea", con las tarjetas de servicios del inicio (`components/services/ServiceCard`).
