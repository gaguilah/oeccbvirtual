# Design System Strategy: The Diplomatic Protocol

## 1. Overview & Creative North Star: "The Silent Facilitator"
This design system rejects the "loud" marketing tropes of typical event platforms in favor of a high-end, editorial aesthetic termed **The Silent Facilitator**. It is built for professional environments where clarity is a form of respect and diplomacy is expressed through precision.

The system breaks the "template" look by using **intentional asymmetry**—pairing heavy typographic displays with expansive white space—and **tonal layering** instead of structural lines. By prioritizing a "High-End Editorial" layout, we move away from a grid of boxes to a sophisticated flow of information that feels curated, not just displayed.

---

## 2. Colors: Tonal Architecture
The palette is rooted in professional blues and refined grays, but its application must be strictly governed to maintain a premium feel.

All colors come from the default Tailwind CSS palette: **`slate`** for surfaces, text and outlines, and **`blue`** for the primary color. The tokens are defined in `src/index.css` (`@theme`) and generate utility classes (`bg-surface`, `text-on-surface`, `border-outline-variant/15`, …). **Use the token classes in components, not the palette colors directly**: the tokens switch to their dark-mode values on their own, so you don't need the `dark:` variant.

**Color modes:** the user picks light, dark or system with `ThemeToggle`. Dark mode is active with `data-theme="dark"` on `<html>`, or with the system preference when there is no `data-theme`. Both the tokens and the `dark:` variant follow that same logic.

### Color Tokens

| Token | Role | Example class | Light | Dark |
|---|---|---|---|---|
| `surface` | Page canvas (base layer) | `bg-surface` | `slate-50` | `slate-950` |
| `surface-container-low` | Secondary content areas, sections | `bg-surface-container-low` | `slate-100` | `slate-950`/`slate-900` 50 % mix |
| `surface-container` | Background for stacked cards | `bg-surface-container` | `slate-200` | `slate-800` |
| `surface-container-lowest` | Cards and elevated containers | `bg-surface-container-lowest` | `white` | `slate-900` |
| `surface-variant` | Subtle input container background | `bg-surface-variant` | `slate-100` | `slate-800` |
| `on-surface` | Main text and headings | `text-on-surface` | `slate-800` | `slate-100` |
| `on-surface-variant` | Secondary text, inactive states | `text-on-surface-variant` | `slate-600` | `slate-400` |
| `outline-variant` | Ghost Borders, dividers (always at low opacity) | `border-outline-variant/15` | `slate-400` | `slate-500` |
| `primary` | Main actions, links, active states | `text-primary` | `blue-800` | `blue-400` |
| `primary-dim` | End of the primary gradient | `to-primary-dim` | `blue-900` | `blue-500` |
| `on-primary` | Text on primary | `text-on-primary` | `white` | `slate-950` |
| `primary-container` | Subtle highlights (calendar, scheduling) | `bg-primary-container` | `blue-100` | `blue-950` |

**Status colors (the only exception):** alerts, badges and validation errors may use Tailwind's `green`, `amber` and `red` on low-opacity backgrounds (e.g. `bg-red-600/10 text-red-800 dark:text-red-300`). Use them only to communicate state, never for decoration.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders for sectioning or grouping. Physical boundaries are an admission of failed hierarchy.
- Use background shifts to define zones (e.g., a `bg-surface-container-low` section sitting directly on a `bg-surface` page).
- Transitions between content blocks must be felt through color shifts, not seen through lines.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of heavy-weight vellum.
- **Base Layer:** Use `bg-surface` for the canvas.
- **Sectioning:** Use `bg-surface-container-low` for secondary content areas.
- **Floating/Actionable Elements:** Use `bg-surface-container-lowest` for cards or elevated containers to create a natural, "high-light" lift.

### Signature Textures & Glass
- **The Glass Rule:** For floating headers or navigation, use `surface` at 80% opacity with blur: `bg-surface/80 backdrop-blur-xl`. This integrates the UI into the content rather than layering it on top.
- **Sophisticated Gradients:** Main CTAs should avoid flat colors. Use a subtle 135-degree linear gradient from `primary` to `primary-dim` to provide "visual soul": `bg-linear-135 from-primary to-primary-dim`.

---

## 3. Typography: The Editorial Voice
We utilize a dual-sans-serif approach to create a distinction between "Data" and "Atmosphere." Both fonts are loaded from Google Fonts in `index.html`.

*   **Display & Headlines (Manrope, `font-display`):** The Manrope scale (Display-lg to Headline-sm) provides a modern, geometric authority. `h1`–`h3` already get `font-display`, `text-on-surface` and `tracking-[-0.02em]` from the base styles, for a bespoke, printed look.
*   **Body & UI (Inter, `font-sans`):** The Inter scale (Body-lg to Label-sm) is used for high-utility data. It is the default font of `body`. Inter's tall x-height ensures readability in complex event tables and data visualizations.
*   **The Power of Scale:** Create drama by pairing a very large headline (`text-6xl`/`text-7xl`) with a small caption (`text-sm`) immediately below it. This high-contrast scale ratio is the hallmark of premium editorial design.

---

## 4. Elevation & Depth: Tonal Layering
In this design system, shadows are treated as "ambient occlusion" rather than "drop shadows."

*   **The Layering Principle:** Depth is achieved by stacking. A `bg-surface-container-lowest` card placed on a `bg-surface-container` background creates a soft, natural lift without a single pixel of shadow.
*   **Ambient Shadows:** If an element must float (e.g., a modal or dropdown), use `shadow-ambient` (32px blur, 8px offset on y, `on-surface` at 5% opacity). It should feel like a soft glow, not a dark stain.
*   **The "Ghost Border" Fallback:** If accessibility requires a container boundary, use `outline-variant` at **15% opacity**: `border border-outline-variant/15`. This creates a "Ghost Border"—visible enough to contain, but too light to clutter.

---

## 5. Components: Precision Primitives
The components in `src/components/` already follow these rules. Reuse them before writing new styles.

### Data Tables (The "Invisible Grid")
- **Forbidden:** Vertical dividers and heavy horizontal lines.
- **Execution:** Use `bg-surface-container-low` for the header row. Use a 1px `outline-variant` at 10% opacity for horizontal rows only (`border-b border-outline-variant/10`). Increase row height to `h-12` (3rem) to allow the text to breathe.

### Buttons (The Diplomatic Action) — `Button` / `ButtonLink`
- **Primary** (`variant="primary"`): Gradient fill (`bg-linear-135 from-primary to-primary-dim`), `text-on-primary`, and `rounded-md`.
- **Secondary** (`variant="secondary"`): Transparent background with a "Ghost Border" (`border border-outline-variant/15`).
- **Tertiary** (`variant="tertiary"`): No background or border. `text-primary` in `text-xs uppercase tracking-widest` for a professional look.

### Input Fields & Search — `Input` / `Select`
- **Minimalist Fields:** No side or top borders. A simple `outline-variant` underline at 20% opacity (`border-b border-outline-variant/20`) that switches to `primary` on focus (`focus:border-primary`). Use `bg-surface-variant` as a very subtle background for the input container.

### Segmented Controls — `ThemeToggle`
- Group on a `bg-surface-container-low` background, with no borders. The active option rises onto `bg-surface-container-lowest` with `text-on-surface` and `shadow-ambient`. Inactive options use `text-on-surface-variant`.
- In primary navigation on mobile, show text labels next to the icons. On desktop, icons must have `aria-label` and `title`.

### Tabs (The Flat Toggle) — `MainNav`
- Use "Flat Tabs" where the active state is indicated by a color shift to `text-on-surface` and a 2px `primary` underline (`border-b-2 border-primary`). The inactive states should be `text-on-surface-variant` with no containing box.

### Cards & Lists — `Card`
- **Spacing over Separation:** Use 2rem of vertical white space (`space-y-8` or `gap-8`) to separate list items. Do not use dividers.
- **Nesting:** Place list items inside a `bg-surface-container-low` wrapper to group related event data.

---

## 6. Do's and Don'ts

### Do:
- **Do** use wide page margins on desktop (`lg:px-16`, already applied by `Container`) to create a sense of luxury and importance.
- **Do** align all text to a rigid baseline, but allow imagery and decorative elements to sit off-center for an "asymmetric balance."
- **Do** use `bg-primary-container` for subtle highlights in calendar views or scheduling components.

### Don't:
- **Don't** use 100% black text (`text-black`). Always use `text-on-surface` to maintain a soft, diplomatic tone.
- **Don't** use standard "Material Design" shadows or Tailwind's default shadows (`shadow-md`, `shadow-lg`, `shadow-xl`). Use `shadow-ambient` only.
- **Don't** use icons without labels in primary navigation. Clarity is the highest priority.
- **Don't** use more than one "Floating Action Button." The interface should feel grounded and stable.
- **Don't** use colors outside the tokens (`gray`, `indigo`, custom hex values). The only exception is status colors.

---

## 7. Responsive Focus
The system transitions from an asymmetric editorial desktop view to a tightly stacked, high-contrast mobile view. On mobile, increase the use of `surface-container` tiers (`bg-surface-container-low`, `bg-surface-container`) to distinguish sections, as white space is limited. Ensure all touch targets for pagination and tabs are at least `min-h-10` (2.5rem) tall for accessibility.
