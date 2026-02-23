# Beauty Salon Booking System

System rezerwacji online i panel administracyjny dla salonu Katarzyna Brui (React + TypeScript + Supabase).

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Aplikacja działa na: `http://localhost:3000`

## Najważniejsze komendy

```bash
npm run build      # TypeScript check + produkcyjny build Vite
npm test           # Playwright E2E
npm run test:ui    # Playwright UI
```

## Główne flow rezerwacji

### Klient
1. Wybór usługi i terminu.
2. Utworzenie `time_slots` (`is_available=false`).
3. Utworzenie `bookings` z referencją `time_slot_id`, `start_time`, `end_time`.
4. Powiązanie zwrotne `time_slots.booking_id = bookings.id`.

### Zmiana terminu przez klienta
1. Tworzony jest nowy slot.
2. Stary slot jest zwalniany (`is_available=true`, `booking_id=null`).
3. Rezerwacja jest przepinana na nowy `time_slot_id`.
4. Nowy slot dostaje `booking_id` rezerwacji.

### Admin
Panel `Admin -> Rezerwacje` obsługuje:
- edycję: status, zabieg, stylistka, data/godzina, cena (override), dane kontaktowe, notatki,
- ręczne tworzenie nowej rezerwacji (np. telefonicznej),
- walidację konfliktów czasowych dla stylistki.

## Schemat cen

- Cena bazowa trzymana jest w `services.price` (grosze/cents).
- Cena indywidualna rezerwacji trzymana jest w `bookings.price_override` (grosze/cents).
- Wyświetlanie: `PLN`.