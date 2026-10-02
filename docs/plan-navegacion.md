# Plan: selector de tema compacto y botón de sesión con ícono (construido el 2026-10-02)

Cambios en el encabezado de escritorio (desde `xl`), que es el mismo en todas las páginas, así el cambio aplica a todo el sitio. El menú de celular y tableta no cambia.

## Decisiones

| Tema | Decisión |
| --- | --- |
| Selector de tema | **Opción A:** en reposo, solo el ícono del tema elegido; al pasar el mouse o al enfocarlo, un desplegable debajo con las 3 opciones |
| Botón de sesión | Solo ícono: **entrar** (`arrow-right-end-on-rectangle`) sin sesión y **panel** (`squares-2x2`) con sesión; la leyenda aparece en un tooltip |
| Menú de celular y tableta | Sin cambios: selector con nombres y botón con texto a lo ancho (en pantallas táctiles no existe "pasar el mouse") |

## 1. Selector de tema compacto (`ThemeToggle variant="compact"`)

- **En reposo:** un botón cuadrado (40 × 40 px) con el ícono del tema actual (Claro, Oscuro o Sistema), con fondo tonal `surface-container-low` como el selector actual.
- **Al pasar el mouse o al enfocarlo con Tab** (`group-hover` y `group-focus-within`), aparece debajo un panel flotante:
  - fondo `surface-container-lowest` con `shadow-ambient`, sin bordes;
  - las 3 opciones con ícono y texto: Claro, Oscuro y Sistema;
  - la opción actual marcada con `primary-container` y ✓.
- **Sin saltos:** el panel es flotante (`absolute`), así el encabezado no se mueve.
- **Puente invisible:** entre el botón y el panel, para que el panel no se cierre al bajar el mouse.
- **Teclado:**
  - Tab entra al botón y el panel se muestra;
  - Tab recorre las opciones;
  - al salir del grupo se oculta;
  - Escape quita el foco y lo cierra.
- **Táctil:** tocar el botón lo enfoca y abre el panel.
- **Accesibilidad:**
  - el botón visible se llama "Tema: Claro" (u Oscuro o Sistema);
  - las opciones conservan `aria-pressed`;
  - el panel no se oculta con `display: none` mientras tiene foco.
- **Animación:** aparición suave (opacidad y un pequeño desplazamiento) con `motion-safe:`.

## 2. Botón de sesión con ícono y tooltip

- **El botón:** cuadrado (40 × 40 px) con el degradado `primary` actual, mediante `ButtonLink size="icon"`.
- **Sin sesión:** ícono de entrar, `aria-label="Iniciar sesión"` y tooltip "Iniciar sesión".
- **Con sesión:** ícono de panel, `aria-label="Ir al dashboard"` y tooltip "Ir al dashboard".
- **Tooltip** (`ui/Tooltip`):
  - aparece debajo al pasar el mouse o al enfocar;
  - superficie `inverse-surface`, texto `on-inverse-surface` y `text-xs`;
  - `aria-hidden`, porque el nombre accesible ya está en `aria-label`;
  - aparición con `motion-safe:`.

## 3. Menú de celular y tableta

Sin cambios.

## Piezas

| Archivo | Cambio |
| --- | --- |
| `ui/Tooltip.tsx` (nuevo) | Leyenda reutilizable, solo con CSS: el envoltorio es un `group` y la leyenda se muestra con `group-hover` / `group-focus-within` |
| `ui/ThemeToggle.tsx` | Variante `compact` (botón + desplegable). La segmentada actual queda para el menú de celular (`showLabels`) |
| `ui/Button.tsx` | Tamaño `icon`: cuadrado de 40 px, sin relleno lateral |
| `ui/index.ts` | Exportar `Tooltip` |
| `layout/Header.tsx` | Escritorio: `ThemeToggle variant="compact"` y botón de sesión con ícono y tooltip |
| `CLAUDE.md` / `design.md` | Documentar el tooltip, la variante compacta y el tamaño `icon` |

## Advertencia

Un botón de iniciar sesión solo con ícono es menos evidente para personas poco familiarizadas con interfaces digitales. El tooltip y el `aria-label` lo compensan en parte. Si la gente no lo encuentra, se puede volver a mostrar el texto en pantallas muy anchas (`2xl`).

## Verificación

- **Capturas en escritorio (claro y oscuro):** en reposo y con el panel del tema abierto (forzando el foco), y el tooltip del botón.
- **Prueba de teclado:** con Tab y Escape.
- **Menú de celular:** comprobar que sigue igual.

## Verificación realizada

Se verificó en Edge con el protocolo de depuración, a 1440 px de ancho y en claro y oscuro:
- **En reposo:** el panel está oculto.
- **Al enfocar el botón:** se abre, y el botón se anuncia como "Tema: Sistema".
- **Tab:** pasa a "Claro" dentro del panel.
- **Escape:** lo cierra.
- **Botón de sesión:** el tooltip aparece al pasar el mouse.

Nota: por debajo de 1280 px el encabezado de escritorio no se muestra (`xl`), por eso la ventana de prueba debe ser más ancha.

## Ajuste posterior: cierre del menú de hamburguesa

- **Cómo se cierra:** al hacer clic o tocar fuera del encabezado, con Escape y al elegir un tema (`ThemeToggle` recibe `onSelect`).
- **Verificado con clics reales en Edge a 500 px:**
  - abrir y luego clic fuera → cerrado;
  - elegir "Oscuro" → cerrado, con `data-theme="dark"`;
  - Escape → cerrado;
  - clic dentro del menú sin elegir nada → sigue abierto.
