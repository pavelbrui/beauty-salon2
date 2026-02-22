# CLAUDE.md - Beauty Salon Booking System

## Quick Start Commands
```bash
npm run dev          # Dev server → http://localhost:3000
npm run build        # TypeScript check + production build
npm run lint         # ESLint (ts, tsx)
npx tsc --noEmit     # Type check only (fast, no output)
npm test             # Run all Playwright E2E tests (headless)
npm run test:headed  # Run tests with visible browser
npm run test:ui      # Playwright UI mode (interactive debugging)
```

## Stack
React 18 + TypeScript + Vite + Tailwind CSS + Supabase (PostgreSQL) + Zustand + React Router v6

## Project Structure
```
src/
├── pages/           # Route-level components (Home, BookingPage, Admin, ServicesPage, TrainingPage, etc.)
├── components/      # Reusable UI (Navbar, ServiceCard, AuthModal, BookingForm, etc.)
│   ├── admin/       # Admin panel tabs (AdminServices, AdminStylists, AdminTimeSlots, AdminGallery, StylistAssignments, AdminTrainings)
│   └── Calendar/    # Booking calendar (AdvancedBookingCalendar, MonthCalendar, TimeGrid)
├── lib/             # Supabase client (supabase.ts), auth (auth.ts), email (email.ts)
├── hooks/           # useLanguage.ts (Zustand store), useLocalizedPath.ts (i18n routing helpers)
├── i18n/            # translations.ts (pl/en/ru)
├── types/           # index.ts (TypeScript interfaces)
├── utils/           # timeSlots.ts, dateUtils.ts
└── assets/          # images.ts (URLs)
supabase/migrations/ # 20 SQL migration files (0001–0020)
```

## Key Architectural Rules
- **No REST API** - All DB queries go directly from components to Supabase via `src/lib/supabase.ts`
- **Auth**: Supabase Auth (email/password + Google OAuth). Session via `supabase.auth.getSession()`. RLS enforces access.
- **State**: Only language in Zustand. Everything else is local `useState` + `useEffect` fetching.
- **i18n**: Always add translations for all 3 languages (pl, en, ru) in `src/i18n/translations.ts`
- **i18n Routing**: URL-based language prefixes for SEO (`/en/...`, `/ru/...`, no prefix = Polish). See "i18n Routing System" section below.
- **Styling**: Tailwind only. Accent color: `amber-500`/`amber-600`. No custom CSS files.
- **Prices**: Stored in cents in DB. Display: `(price / 100).toFixed(0) + ' PLN'`

## Database Tables
`services` (name, category, price in cents, duration in min) | `stylists` (name, role, specialties[]) | `bookings` (service_id, user_id, time_slot_id, stylist_id, status) | `time_slots` (stylist_id, start_time, end_time, is_available) | `stylist_service_assignments` | `stylist_working_hours` (day_of_week 0-6) | `service_images` | `email_templates` | `notifications` | `trainings` (title, slug, category, content_blocks JSONB, is_published)

## Routes
All public routes support language prefixes: `/en/...` (English), `/ru/...` (Russian), no prefix = Polish (default).

`/` Home | `/services` `/services/:category` | `/booking/:serviceId` | `/profile` | `/appointments` | `/stylists` | `/gallery` | `/training` `/training/:slug` | `/blog` `/blog/:slug` | `/admin` (tabs: services, bookings, stylists, timeslots, gallery, assignments, trainings, blog, booksy)

Examples: `/services` (PL), `/en/services` (EN), `/ru/services` (RU). Admin at `/admin` has no prefix.

## Supabase Query Pattern (ALWAYS follow)
```typescript
const { data, error } = await supabase.from('table').select('*').eq('field', value);
if (error) { console.error('Error:', error); return; }
if (data) setItems(data);
```

## Trainings System (Block-Based CMS)
The training/courses section uses a JSONB-based block editor:
- **DB table**: `trainings` with `content_blocks` JSONB column storing an array of blocks
- **Block types**: `heading` (H2/H3), `text`, `image` (Supabase Storage upload), `list` (bullet/check)
- **Each block** has `id`, `type`, and multilingual fields (`text`, `text_en`, `text_ru`)
- **Admin**: `src/components/admin/AdminTrainings.tsx` — list view + inline block editor
- **Block editor**: `src/components/admin/BlockEditor.tsx` — per-block editing with PL/EN/RU tabs
- **Templates**: `src/components/admin/trainingTemplates.ts` — 4 pre-made course templates
- **Frontend**: `src/pages/TrainingPage.tsx` — list mode (`/training`) + detail mode (`/training/:slug`)
- **Types**: `ContentBlock` (discriminated union), `Training` in `src/types/index.ts`

## i18n Routing System (Language-Prefix URLs for SEO)
The site uses URL-based language routing so each language version has a unique, indexable URL.

### URL Scheme
| Language | URL Pattern | Example |
|----------|-------------|---------|
| Polski (default) | `/<path>` | `/services` |
| English | `/en/<path>` | `/en/services` |
| Russian | `/ru/<path>` | `/ru/services` |
| Admin | `/admin` (no prefix) | `/admin` |

### Key Files
- **`src/hooks/useLocalizedPath.ts`** — Core utilities: `localizedPath()`, `stripLangPrefix()`, `detectLangFromPath()`, `useLocalizedNavigate()`, `useLanguagePrefix()`
- **`src/components/LocalizedLink.tsx`** — Drop-in replacement for `<Link>` that auto-prepends language prefix
- **`src/components/LanguageLayout.tsx`** — Layout route component that syncs URL language → Zustand store → `<html lang>`
- **`src/App.tsx`** — Routes defined once in `publicRoutes`, rendered 3x under `/` (pl), `/en`, `/ru`
- **`src/components/SEO.tsx`** — Generates proper hreflang tags with 3 distinct URLs per page + `x-default`

### Rules for New Pages/Components
1. **Use `<LocalizedLink to="/path">` instead of `<Link to="/path">`** for all internal navigation (except `/admin`)
2. **Use `useLocalizedNavigate()` instead of `useNavigate()`** for programmatic navigation
3. Path strings stay bare (e.g. `"/services"`, `"/booking/${id}"`) — prefixing is automatic
4. **Admin links** (`/admin`) keep plain `<Link>` — admin panel is outside language routing
5. **`navigate(-1)` still works** — numeric args pass through without prefixing
6. **New routes** must be added to the `publicRoutes` fragment in `App.tsx` (defined once, shared across all 3 language groups)
7. **SEO canonical** prop should be a bare path (e.g. `canonical="/blog/my-post"`) — `SEO.tsx` handles prefixing

### Language Switcher
In `Navbar.tsx`, the `switchLanguage()` function strips the current prefix, then navigates to the new prefixed path. Query params and hash are preserved.

## Common Searches for Subagents
When exploring this codebase, use these patterns:
- Find all DB queries: `Grep: supabase.from`
- Find all routes: `Read: src/App.tsx`
- Find component: `Glob: src/components/**/<Name>.tsx`
- Find admin feature: `Glob: src/components/admin/*.tsx`
- Find translations: `Grep: translations\[language\]` or `Read: src/i18n/translations.ts`
- Find types: `Read: src/types/index.ts`
- Find styling patterns: `Grep: amber-500`
- Find auth usage: `Grep: getSession\|signIn\|signOut`
- Find state management: `Grep: useState\|useEffect\|useLanguage`
- Find i18n routing: `Read: src/hooks/useLocalizedPath.ts` or `Grep: LocalizedLink\|useLocalizedNavigate`
- Find time slot logic: `Read: src/utils/timeSlots.ts`
- Find training system: `Glob: src/components/admin/AdminTrainings.tsx` or `Read: src/components/admin/BlockEditor.tsx`
- Find migrations: `Glob: supabase/migrations/*.sql`

## Adding New Features Checklist
1. Types → `src/types/index.ts`
2. Component → `src/components/` (or `admin/` subfolder)
3. Page + route → `src/pages/` + add to `publicRoutes` in `src/App.tsx` (automatically available under `/`, `/en/`, `/ru/`)
4. Translations → `src/i18n/translations.ts` (all 3 langs!)
5. Navigation → use `<LocalizedLink>` and `useLocalizedNavigate()`, NOT plain `<Link>` / `useNavigate()`
6. Admin tab → edit `src/pages/Admin.tsx` (button + conditional render)
7. DB table → new file in `supabase/migrations/`

## Google OAuth Setup
Google login uses Supabase Auth with the Google provider. The flow: App → Google → Supabase callback → App redirect.

### Required Configuration
1. **Supabase Dashboard** → Authentication → URL Configuration:
   - **Site URL**: `https://katarzynabrui.pl`
   - **Redirect URLs**: `https://katarzynabrui.pl/**`, `http://localhost:3000/**`
2. **Supabase Dashboard** → Authentication → Providers → Google:
   - Enable Google provider, add Client ID + Client Secret from Google Cloud Console
3. **Google Cloud Console** → APIs & Services → Credentials → OAuth 2.0 Client:
   - **Authorized JavaScript origins**: `https://katarzynabrui.pl`, `http://localhost:3000`
   - **Authorized redirect URIs**: `https://twifcurnuhlmhhrnwpib.supabase.co/auth/v1/callback`

### Code
- `src/lib/auth.ts` — `signInWithGoogle()` uses `window.location.origin` as `redirectTo`
- `src/components/AuthModal.tsx` — Google login button UI
- Auth state listeners (`onAuthStateChange`) in Navbar, AuthRoute, useAdmin pick up session after redirect

### Troubleshooting
- **Redirects to localhost on production**: Site URL in Supabase is set to `http://localhost:3000` — change to `https://katarzynabrui.pl`
- **Redirect URL mismatch**: Production domain not in Supabase Redirect URLs whitelist
- **Google error**: Callback URL `https://<project>.supabase.co/auth/v1/callback` missing from Google OAuth redirect URIs

## Environment
- Supabase URL: `VITE_SUPABASE_URL` in `.env`
- Supabase Key: `VITE_SUPABASE_ANON_KEY` in `.env`
- DeepL API: `VITE_DEEPL_API_KEYS` in `.env` (used for auto-translation)
- Google Maps: `VITE_GOOGLE_MAPS_API_KEY` in `.env`
- Access in code: `import.meta.env.VITE_SUPABASE_URL`
- **Production domain**: `https://katarzynabrui.pl` (Netlify)
- **E2E Tests**: Playwright (Chromium) — test files in `e2e/` directory
- **Deployment**: Netlify (see `netlify.toml`)
- No CI/CD pipelines

## E2E Tests (Playwright)
```
e2e/
├── home.spec.ts        # Hero, about, services carousel, reviews, contact, footer
├── navigation.spec.ts  # Navbar links, logo, language switcher (PL/EN/RU)
├── services.spec.ts    # Service catalog, category filters, service cards
├── booking.spec.ts     # Booking flow, appointments page
├── stylists.spec.ts    # Stylist cards, specialties, book button
├── gallery.spec.ts     # Gallery grid, category filter, image hover
├── seo.spec.ts         # SEO meta tags, structured data
└── admin.spec.ts       # Admin panel, tab switching, content visibility
```

### Running Tests
```bash
npm test                           # All tests headless
npm run test:headed                # Watch tests in browser
npm run test:ui                    # Interactive Playwright UI
npx playwright test e2e/home.spec.ts  # Run single test file
npx playwright test --grep "hero"     # Run tests matching pattern
npx playwright show-report           # Open last HTML report
```
