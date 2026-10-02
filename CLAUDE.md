# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev`: Vite dev server with HMR
- `npm run build`: type-check (`tsc -b`, project references in `tsconfig.app.json` / `tsconfig.node.json`), then `vite build` to `dist/`
- `npm run lint`: ESLint flat config (typescript-eslint recommended, react-hooks, react-refresh)
- `npm run preview`: serve the production build
- `npm run format` / `npm run format:check`: Prettier (`.prettierrc.json`: single quotes, no semicolons, width 120, trailing commas). Markdown is ignored (`.prettierignore`)

There is no test framework configured yet.

## Stack

React 19 + TypeScript + Vite SPA styled with Tailwind CSS v4, with Supabase as the backend (auth + Postgres), react-router-dom v7 for routing, and zod for form validation. It has no backend code of its own. All data access goes through the Supabase JS client from the browser, so data security depends on Supabase Row Level Security policies, not on client code.

## Architecture

- **Supabase client** (`src/lib/supabase.ts`): a single shared client built from `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (set in `.env` / `.env.local`, both gitignored). Import this client everywhere. Don't create new clients.
- **Auth state**: `src/context/auth.ts` holds the context and the `useAuth()` hook, and `src/context/AuthContext.tsx` holds only the `AuthProvider` component (split so the `react-refresh/only-export-components` lint rule passes). `AuthProvider` loads the initial session with `getSession()`, then subscribes to `onAuthStateChange`. `useAuth()` returns `{ session, loading }`.
- **Routing** (`src/App.tsx`): `BrowserRouter` wraps `AuthProvider`, which wraps the routes. Private pages are wrapped in `ProtectedRoute`, which waits while `loading` is true and redirects to `/login` when there is no session. Public routes (`/`, `/avisos-remates` (old `/remates` redirects there), `/pqrs`, `/encuesta`, `/tutoriales`, `/contacto`, and `/login`, login only: accounts are not created from the public site) are nested under `src/layouts/PublicLayout.tsx` (`Header` + `<Outlet />` in `<main>` + `Footer`). Put new public pages inside that layout route. `/dashboard` is protected and outside the layout. Public nav links are in `mainLinks` in `src/components/navigation/links.ts`. Header uses it. The Footer has its own lists (`services`, `courts`) and the office contact details in `src/components/layout/Footer.tsx`. The full desktop menu appears only from `xl` up (MainNav, Header and MobileMenu use `xl:`), because the links don't fit on narrower screens. Below that, the hamburger menu is used.
- **Data**: `Dashboard` reads the `profiles` table (`id` = auth user id, `full_name`) using `.maybeSingle()`. A missing profile row is expected and is not treated as an error.

## Conventions

- UI text and user-facing messages are in Spanish.
- Format with Prettier, not with the Deno formatter: `.vscode/settings.json` sets Prettier as default formatter; Deno is only the language server for `supabase/functions`.
- TS config is strict about unused locals/params and uses `verbatimModuleSyntax`, so use `import type` for type-only imports.
- Styling uses Tailwind CSS v4 through the `@tailwindcss/vite` plugin. It has no `tailwind.config.js`: add any config in CSS in `src/index.css` (`@theme`, `@layer base`). Use utility classes in `className` rather than inline `style` props or new CSS files. Dark mode uses the `dark:` variant, which follows the system setting.

## Components

`src/components/` has three folders, each with an `index.ts` barrel (import like `import { Button, Card } from '../components/ui'`):
- `ui/`: Button (plus `ButtonLink`, a react-router `Link` styled as a button, and `ButtonAnchor`, an `<a>` for external links: `external` opens a new tab with `noopener`), Input, Select, Badge, Card (plus `CardHeader`/`CardBody`/`CardFooter`), Modal (native `<dialog>`), Alert, Spinner, EmptyState. Styling variants are `variant`/`size` props backed by class maps inside each file. Input and Select share classes from `ui/styles.ts`.
- `layout/`: Header, Footer, Container (the site-wide `max-w-6xl` + responsive gutters), PageHeader (title, description, optional breadcrumb, actions).
- `navigation/`: MainNav (desktop), MobileMenu (its toggle button lives in Header), Breadcrumb.
- Feature folders (e.g. `pqrs/`) hold a page's own components and data.

## PQRS

`/pqrs` has a 3-step form, `components/pqrs/PqrsForm.tsx`: type → name and email → summary + Cloudflare Turnstile.
- `schema.ts` holds the zod schema and `stepFields`. Each step validates only its own fields with `validateFields`. The final submit revalidates everything.
- `api.ts` (`submitRequest`) calls the Supabase Edge Function `submit-request` via `supabase.functions.invoke`, with `{ type, name, email, summary, captchaToken }`. Its source is in `supabase/functions/submit-request/index.ts` (Deno): it validates the fields, verifies Turnstile (`TURNSTILE_SECRET_KEY` secret), then inserts into `customer_requests` with the service role key. The browser never writes to the table directly.
- Turnstile tokens are single-use. After a failed submit, the widget is reset (`captchaRef.current.reset()`).
- Env vars are typed in `src/vite-env.d.ts`.

## Survey

`/encuesta` loads the active survey `satisfaccion-oeccb` with `useSurvey(code)` (`components/survey/useSurvey.ts`), which reads `surveys` + `survey_questions`. Both tables are publicly readable. `SurveyForm` shows one question per step, then a final review step (editable answers + Turnstile). It follows the same pattern as PQRS.
- Question types: `yes_no` → `YesNoQuestion` (boolean) and `scale` → `ScaleQuestion` (number between `scale_min` and `scale_max`), in `survey/questions/`. `QuestionField` picks the component by `question.type`. To add a type: create its component, add it to `QuestionField`, and add its zod schema in `survey/validation.ts` (`answerSchema`).
- Answers are keyed by `question.id`. They are sent to the Edge Function `submit-survey` as `{ surveyId, answers: [{ questionId, value }], captchaToken }` (`survey/api.ts`). The function's source is in `supabase/functions/submit-survey/index.ts` (Deno):
  1. Verifies Turnstile (`TURNSTILE_SECRET_KEY` secret).
  2. Calls the SQL function `public.submit_survey_response(p_survey_id, p_answers)` (`supabase/migrations/20260930120000_submit_survey_response.sql`), which runs as a single transaction. All business rules live there: the survey is active, each question belongs to it, type and range, no duplicates, required questions answered. It raises `survey_not_available`, `invalid_answers` or `missing_required_answers`, which the Edge Function maps to Spanish messages. `survey_answers.value` is a `smallint` from 0 to 10, so `yes_no` is stored as 1 (yes) / 0 (no).
  3. Security: EXECUTE on the function is revoked from `public`/`anon`/`authenticated` and granted only to `service_role`. It is `security invoker` with an empty `search_path`. Don't change it to `security definer`, and don't grant it to `anon`: that would bypass the captcha via `/rest/v1/rpc`.
  Deploy with `supabase functions deploy submit-survey --no-verify-jwt`. JWT verification is off because the client calls it with the publishable key.- Schema: `surveys` and `survey_questions` are publicly readable only when the survey is active. `survey_responses` and `survey_answers` have RLS enabled with no policies, so they are unreadable and unwritable from the client.
- `CaptchaField` (Turnstile) and `CheckIcon` live in `components/ui` and are shared by PQRS and the survey.

## Auction notices (Remates)

Plan and decisions in `docs/plan-remates.md`. Schema in `supabase/migrations/20261002120000_create_auction_notices.sql`: `auction_notices` (public read of `is_published` rows only, no write policies yet) and `pdf_folders` (the two number segments of the PDF URL, picked by the notice's `created_at`; no policies). The `auction_notices_before_write` trigger builds `pdf_url` (12-hour `HH`, America/Bogota), keeps `created_at` immutable and sets `updated_at`. It is `security invoker`: whoever writes notices must be able to read `pdf_folders`.
- `/avisos-remates` (`pages/Remates.tsx`) is a read-only list built from `components/remates/`. Filters (`juzgado`, `periodo`, `q`, `pagina`) live in the URL via `useRematesFilters`; `useAuctionNotices` fetches one page server-side (`.range()` + `count: 'exact'`), aborts stale requests and keeps the previous rows while loading. A `PGRST103` (page past the end) sends the user back to page 1.
- Agendado / Realizado and Próximos / Pasados share one rule: a notice is past `REALIZADO_DESPUES_DE_MIN` (60) minutes after `scheduled_at`. The cutoff uses the `now` captured with each request, never `new Date()` during render. Dates are formatted in `America/Bogota`.
- "Ver aviso" in each row opens `RemateDetailModal`, which refetches the notice by id on every opening (`NoticeSelection.openedAt`) and shows a spinner meanwhile. It offers "Ver aviso" (new tab) and "Descargar PDF" via `pdfDownloadUrl()` (`?download=true`, which makes the publications site answer `Content-Disposition: attachment`). The `download` attribute does not work because the PDF is cross-origin without CORS.
- `ui/Pagination` is generic: reuse it for other paginated lists.

## Home illustration

The hero of `pages/Home.tsx` shows `HeroIllustration` (`components/home/`, plan in `docs/plan-hero.md`): decorative cards on a tilted plane (`matrix(.996,.087,-.174,.985)`), `aria-hidden`, with fixed texts in `home/data.ts` (tutorial titles and step counts come from `tutorials/data.ts`).
- It is drawn on a 512 × 400 unit canvas. The `hero-scale` utility (`index.css`) sets `--u` = 1/512 of the nearest `@container` and redefines `--spacing`, text sizes and radii from it, so regular classes (`left-14`, `text-sm`) scale with the width. Only use spacing/text/radius utilities inside it, not fixed px values.
- Entrance uses `motion-safe:animate-hero-in` (keyframes animate `transform`; hover lifts use the separate `translate` property). Don't add `inert`: it would disable the hover effects, and nothing inside is focusable.

## Tutorials

`/tutoriales` (`pages/Tutoriales.tsx`) lists the tutorials as cards, and `/tutoriales/:slug` (`pages/Tutorial.tsx`) shows one, with breadcrumb `Inicio › Tutoriales › <title>`, its numbered steps and Anterior / Siguiente links. An unknown slug shows a "not found" EmptyState.
- All content lives in `components/tutorials/data.ts` (`tutorials`: `slug`, `title`, `description`, `draft?`, `steps: { title?, text, link?, image? }[]`). `draft: true` shows a "contenido de prueba" notice. Screenshots go in `public/img/tutoriales/<slug>/` and are referenced with `tutorialImage(slug, file)`. `TutorialImage` opens them enlarged in a `Modal`.
- Optional per-tutorial fields: `prerequisites` (slugs → "Antes de empezar" warning with links), `prerequisitesNote`, `intro`, and `next` (slug → "Siguiente paso recomendado" inside the closing "¡Felicidades!" box built from `summary`). Cross-references use slugs, never hardcoded titles or numbers, so titles come from the data.
- These boxes use `Alert` with `live={false}` (static page content must not be a live region) and an SVG `icon`, not emojis. The array order is the display and prev/next order. To add or edit a tutorial, change only the data. Build URLs with `tutorialPath(slug)`, not by hand.
- Nav links use `end` only for `/`, so a section stays highlighted on its subroutes.
- `ScrollToTop` (`components/navigation`), mounted once inside `BrowserRouter` in `App.tsx`, scrolls to the top on every pathname change, so pages don't need their own scroll reset.

The office's contact details (email, address) are in `src/lib/contact.ts`. Don't repeat them as literals.

Components take a `className` prop that is merged via `cn()` from `src/lib/cn.ts` (clsx + tailwind-merge), so callers can override Tailwind classes. Build new UI from these components before writing raw Tailwind in pages. Because of the `react-refresh/only-export-components` lint rule, keep non-component exports (constants, helpers) in separate `.ts` files, not in `.tsx` component files.

## Design

Visual guidelines are in `design.md`. Key points:
- Colors come from design tokens defined in `@theme` in `src/index.css` (`surface`, `surface-container-*`, `on-surface`, `on-surface-variant`, `outline-variant`, `primary`, `primary-dim`, `on-primary`, `primary-container`). They map to Tailwind's `slate` and `blue`. Use the token classes (`bg-surface-container-low`, `text-on-surface`, `border-outline-variant/15`). Don't use raw palette colors or `dark:`: the tokens are redefined for dark mode. That is also why they use `@theme` and not `@theme inline`. The only exception is status colors (green/amber/red, which do use `dark:`).
- No solid 1px borders for sectioning. Separate areas with background shifts. Elevation comes from layered surfaces, and `shadow-ambient` is used only for floating elements.
- Fonts: Inter (`font-sans`, the default) and Manrope (`font-display`, applied to `h1`–`h3` in base styles), loaded from Google Fonts in `index.html`.
- Theme (light / dark / system): `ThemeProvider` (`src/context/ThemeContext.tsx`, hook `useTheme` in `src/context/theme.ts`) writes `data-theme="light|dark"` on `<html>` and saves the choice in `localStorage` (`theme` key). "System" removes the attribute. `src/index.css` defines a custom `dark` variant that is active with `data-theme="dark"`, or with `prefers-color-scheme: dark` when there is no `data-theme`. The dark tokens use that same variant (`:root { @variant dark { … } }`). An inline script in `index.html` applies the saved theme before React renders to avoid a flash. If you change the storage key, update both places. The control is `ThemeToggle` (`components/ui`), shown in Header (icons) and MobileMenu (with labels).
