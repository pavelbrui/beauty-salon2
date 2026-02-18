# Beauty Salon Booking System - AI Agent Guidelines

## Project Overview

**Beauty Salon booking system** for "Katarzyna Brui" salon in Białystok, Poland. Multi-language (PL/EN/RU) React + TypeScript + Supabase app enabling customers to book beauty services (permanent makeup, lashes, laser, etc.) and admin staff to manage services, stylists, schedules, and gallery.

- **Stack**: React 18, TypeScript, Vite, Tailwind CSS, Supabase (PostgreSQL), Zustand, React Router
- **Dev Command**: `npm run dev` (runs on port 3000)
- **Build**: `npm run build` (TypeScript check + Vite bundle)
- **Lint**: `npm run eslint src --fix`

## Architecture Patterns

### Data Flow & State Management

1. **Authentication**: Supabase Auth via [src/lib/auth.ts](src/lib/auth.ts) - `signUp()`, `signIn()`, `signOut()` functions
   - Session retrieved via `supabase.auth.getSession()`
   - No JWT token storage needed (handled by Supabase client)

2. **Zustand Stores**: Minimal state management
   - [src/hooks/useLanguage.ts](src/hooks/useLanguage.ts) - persisted language state ('pl'|'en'|'ru')
   - No global user store; user data loaded on-demand from Supabase

3. **Database Access**: Direct Supabase queries in components/pages
   - All queries go through [src/lib/supabase.ts](src/lib/supabase.ts) singleton client
   - RLS (Row-Level Security) policies enforce admin vs client access (see `supabase/migrations/`)
   - Common tables: `services`, `stylists`, `bookings`, `time_slots`, `stylist_service_assignments`, `stylist_working_hours`

4. **i18n Pattern**: Static translations object in [src/i18n/translations.ts](src/i18n/translations.ts)
   - Retrieve via: `const { language } = useLanguage(); const t = translations[language];`
   - Keys nested by feature: `t.categories`, `t.reviews.title`, `t.bookNow`

### Component Organization

- **Pages** ([src/pages/](src/pages/)): Route-level containers that fetch data and orchestrate flow
  - `Home` → service list, reviews, contact
  - `BookingPage` → service selection → calendar → booking form → auth modal
  - `Admin` → tab-based admin panel (services, bookings, stylists, time slots, gallery, assignments)
  - `AppointmentsPage` → alternative booking interface with service/stylist filters
  - `ProfilePage` → user's appointment history

- **Components** ([src/components/](src/components/)): Reusable UI + logic
  - `BookingCalendar`, `AdvancedBookingCalendar` → date/time slot selection
  - `AuthModal` → login/signup form
  - `ImageUpload` → Supabase Storage integration for service images
  - `admin/` → admin-only features (AdminServices, AdminStylists, AdminTimeSlots, AdminGallery, StylistAssignments)
  - `ErrorBoundary` → class component catching render errors

### Booking Flow

1. User selects service (from services list or category filter)
2. Navigate to `/booking/:serviceId` or use `BookingModal`
3. **Calendar picks date** → queries `stylist_working_hours` + `bookings` to generate available slots via [src/utils/timeSlots.ts](src/utils/timeSlots.ts) `generateAvailableTimeSlots()`
4. **Select time slot** → if not authenticated, show `AuthModal`
5. **Fill BookingForm** → creates record in `bookings` table
6. **Email notification** via `sendEmail()` template system (stores template in `email_templates`, creates `notifications` record)

## Key Conventions

### API Query Patterns

```typescript
// Always destructure data + error, check for both
const { data, error } = await supabase
  .from('services')
  .select('*')
  .order('name');

if (error) {
  console.error('Error:', error);
  return; // or throw
}
if (data) setServices(data);
```

### Component State Pattern

1. Use local `useState` for UI state (isOpen, loading, selectedItem)
2. Load data in `useEffect` on component mount
3. Separate concerns: fetch logic → render logic

### Styling

- **Tailwind CSS**: utility-first (no custom CSS files except globals)
- **Accent color**: `bg-amber-500` / `hover:bg-amber-600` (repeats throughout)
- **Responsive**: `sm:`, `md:` breakpoints standard
- **Animations**: Framer Motion for Navbar, ServiceCard hover effects

### Polish/Localization

- Primary language is Polish (`language: 'pl'` default)
- Translation structure supports nested keys: `translations[language].section.subsection`
- Category names in translations, not hardcoded

## Database Schema Essentials

**Key tables** (from migrations):
- `services`: id, name, category, price (cents), duration (minutes), description
- `stylists`: id, name, specialties, image_url, role
- `time_slots`: id, service_id, start_time, end_time, is_available
- `bookings`: id, service_id, user_id, time_slot_id, status, created_at
- `stylist_service_assignments`: stylist_id, service_id (many-to-many)
- `stylist_working_hours`: stylist_id, day_of_week, start_time, end_time
- `service_images`: service_id, url (storage reference)
- `email_templates`: name, subject, content (with {{variable}} placeholders)

## Common Tasks

### Add a new service category
1. Update `translations.ts` → add to `pl.categories`
2. Services are categorized by `category` field in DB; filtering happens on client

### Admin Panel Tab System

The admin interface is tab-based in [src/pages/Admin.tsx](src/pages/Admin.tsx) with state-managed tab switching:

**Tab Structure:**
- `services` → [AdminServices](src/components/admin/AdminServices.tsx) - CRUD services, assign stylists
- `bookings` → Inline bookings list with status badges (pending/confirmed/cancelled)
- `stylists` → [AdminStylists](src/components/admin/AdminStylists.tsx) - manage stylist profiles
- `timeslots` → [AdminTimeSlots](src/components/admin/AdminTimeSlots.tsx) - configure working hours via [StylistCalendar](src/components/admin/StylistCalendar.tsx)
- `gallery` → [AdminGallery](src/components/admin/AdminGallery.tsx) - upload/delete service images
- `assignments` → [StylistAssignments](src/components/admin/StylistAssignments.tsx) - map stylists to services (many-to-many)

**Tab Button Pattern** (all tabs use identical styling):
```tsx
<button
  onClick={() => setActiveTab('tabId')}
  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
    activeTab === 'tabId' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
  }`}
>
  Tab Label
</button>
```

**Adding a New Admin Tab:**
1. Create component file in `components/admin/` with your feature (e.g., `AdminNewFeature.tsx`)
2. Add import at top of [Admin.tsx](src/pages/Admin.tsx)
3. Add new button with `activeTab` check in the tab navigation bar
4. Add conditional render: `{activeTab === 'newfeature' && <AdminNewFeature />}`
5. Update type union: `'services' | 'bookings' | 'stylists' | 'timeslots' | 'gallery' | 'assignments' | 'newfeature'`

**Key Admin Component Patterns:**
- **AdminServices**: Loads services with joins (`service_images`), handles stylist assignment via `stylist_service_assignments` table
- **AdminTimeSlots**: Uses `StylistCalendar` component to manage `stylist_working_hours` by day_of_week
- **AdminGallery**: Uploads to `service-images/` Supabase Storage bucket, stores metadata in `service_images` table
- **StylistAssignments**: Maintains many-to-many relationship between stylists and services

### Query specific stylist's bookings
```typescript
const { data: bookings } = await supabase
  .from('bookings')
  .select(`*, time_slots(start_time, service_id)`)
  .in('time_slot_id', 
    (await supabase.from('time_slots').select('id').eq('stylist_id', stylistId)).data
  );
```

### Modify booking workflow
- Check [src/pages/BookingPage.tsx](src/pages/BookingPage.tsx) for flow steps
- Time slot generation: [src/utils/timeSlots.ts](src/utils/timeSlots.ts)
- Calendar UI: [src/components/Calendar/](src/components/Calendar/)

## Integration Points

- **Supabase Storage**: Images stored in `service-images/` bucket → [src/components/ImageUpload.tsx](src/components/ImageUpload.tsx)
- **Email**: Template-based system (not yet integrated with actual email provider)
- **Leaflet Maps**: Google Store Locator embedded in [src/components/MapLocation.tsx](src/components/MapLocation.tsx)
- **Icons**: React Icons (`react-icons/fa`, `@heroicons/react`)

## Testing & Debugging

- **Type checking**: `tsc` runs before build
- **ESLint**: Enforced on build; unused vars caught
- **Console logs**: Admin panel queries log errors; check Network tab for Supabase RLS failures
- **RLS debugging**: If bookings fail, verify `user_id` matches authenticated user in Supabase Policy

---

*Last Updated: Feb 2026 | For codebase questions, refer to specific file paths above*
