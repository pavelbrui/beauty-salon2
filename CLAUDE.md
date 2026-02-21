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
- **Auth**: Supabase Auth (email/password). Session via `supabase.auth.getSession()`. RLS enforces access.
- **State**: Only language in Zustand. Everything else is local `useState` + `useEffect` fetching.
- **i18n**: Always add translations for all 3 languages (pl, en, ru) in `src/i18n/translations.ts`
- **i18n Routing**: URL-based language prefixes for SEO (`/en/...`, `/ru/...`, no prefix = Polish). See "i18n Routing System" section below.
- **Styling**: Tailwind only. Accent color: `amber-500`/`amber-600`. No custom CSS files.
- **Prices**: Stored in cents in DB. Display: `(price / 100).toFixed(0) + ' PLN'`

## Database Tables
`services` (name, category, price in cents, duration in min) | `stylists` (name, role, specialties[]) | `bookings` (service_id, user_id, time_slot_id, stylist_id, status) | `time_slots` (stylist_id, start_time, end_time, is_available) | `stylist_service_assignments` | `stylist_working_hours` (day_of_week 0-6) | `service_images` | `email_templates` | `notifications` | `trainings` (title, slug, category, content_blocks JSONB, is_published)

## Routes
`/` Home | `/services` `/services/:category` | `/booking/:serviceId` | `/profile` | `/appointments` | `/stylists` | `/gallery` | `/training` `/training/:slug` | `/admin` (tabs: services, bookings, stylists, timeslots, gallery, assignments, trainings)

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
- Find time slot logic: `Read: src/utils/timeSlots.ts`
- Find training system: `Glob: src/components/admin/AdminTrainings.tsx` or `Read: src/components/admin/BlockEditor.tsx`
- Find migrations: `Glob: supabase/migrations/*.sql`

## Adding New Features Checklist
1. Types → `src/types/index.ts`
2. Component → `src/components/` (or `admin/` subfolder)
3. Page + route → `src/pages/` + `src/App.tsx`
4. Translations → `src/i18n/translations.ts` (all 3 langs!)
5. Admin tab → edit `src/pages/Admin.tsx` (button + conditional render)
6. DB table → new file in `supabase/migrations/`

## Environment
- Supabase URL: `VITE_SUPABASE_URL` in `.env`
- Supabase Key: `VITE_SUPABASE_ANON_KEY` in `.env`
- DeepL API: `VITE_DEEPL_API_KEYS` in `.env` (used for auto-translation)
- Google Maps: `VITE_GOOGLE_MAPS_API_KEY` in `.env`
- Access in code: `import.meta.env.VITE_SUPABASE_URL`
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
