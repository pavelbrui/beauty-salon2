# Logika Rezerwacji i Przypisywania Stylistek

Dokument ten opisuje w jaki sposób działa algorytm rezerwacyjny w aplikacji "beauty-salon2" pod kątem przypisywania usług do stylistek oraz w jaki sposób generowane są i deduplikowane terminy.

## Relacja Usługa <-> Stylistka

System wykorzystuje tabelę `stylist_service_assignments` do przypisywania stylistek do konkretnych usług.

1. **Wiele stylistek**: Jeśli do jednej usługi (np. przedłużanie rzęs) jest przypisanych kilka stylistek, aplikacja odblokowuje widok filtru (dropdown/kafelki) nad kalendarzem (`StylistFilter`).
2. **Jedna stylistka**: Jeśli przypisana jest tylko jedna osoba, filtr stylistek **nie jest wyświetlany**, by uprościć interfejs dla klienta.
3. **Brak przypisań**: Jeśli w systemie brakuje wpisów w tabeli `stylist_service_assignments` dla danej usługi, system zachowawczo (fallback) ładuje wszystkie stylistki dostępne w salonie.

## Filtrowanie i Generowanie Terminów (Time Slots)

Generowanie slotów czasowych zachodzi w funkcji `generateAvailableTimeSlots` w pliku `src/utils/timeSlots.ts`.

1. **Dostępność "Dowolna Stylistka" (Any Stylist)**:
   - Gdy użytkownik nie wybierze żadnej konkretnej stylistki (opcja domyślna dla usług z wieloma pracownikami), aplikacja wyszukuje wolne terminy dla **wszystkich wykwalifikowanych stylistek**.
   - **Deduplikacja**: Jeżeli dwie lub więcej stylistek jest wolnych o tej samej godzinie (np. 12:00), aby uniknąć duplikowania przycisków "12:00" w UI, algorytm zwraca tylko jeden przycisk, automatycznie (losowo/wg pierwszego trafienia z bazy) przypisując jedną ze stylistek. Dzięki temu klient, któremu jest obojętne kto wykona usługę, nie odczuwa zamieszania na kalendarzu.
2. **Wybór konkretnej stylistki**:
   - Gdy klient wybierze konkretną osobę z filtra (lub wejdzie przez stronę danej stylistki), zapytania do bazy ograniczane są do `stylist_id` tej osoby.
   - W takim wypadku system zwraca tylko godziny, w których dana stylistka jest wolna, i bezpośrednio jej przypisuje rezerwację.

## Ograniczenia i Restrykcje (BookingRestrictions)

Do harmonogramów nakładane są także dynamiczne ograniczenia zapisane przy poszczególnych profilach stylistek w tabeli `stylists`:
- `min_advance_hours`: Minimalne wyprzedzenie (w godzinach) z jakim można dokonać rezerwacji (domyślnie 2h). Zabezpiecza to przed rezerwacjami z minuty na minutę.
- **Blokady nocne**: (`night_start_hour`, `night_end_hour`, `night_min_slot_hour`). Algorytm nie rezerwuje wizyt w późnych porach w trybie "na jutro z samego rana", unless the slot is appropriately in the future.

Te zasady (restrykcje) kalkulowane są po wygenerowaniu wolnych terminów, poprzez funkcję `isSlotBookable`.

## Podsumowanie komponentów

- `AdvancedBookingCalendar.tsx` (oraz `QuickBookingPopup.tsx`): Główne kontrolery kalendarza. Dynamicznie sprawdzają ile stylistek ma uprawnienia do usługi i na podstawie tego renderują moduł do wyboru wykonawcy. Pobierają dane z `stylist_working_hours` oraz `time_slots` (już zajęte terminy).
- `StylistFilter.tsx`: Odpowiada za UI wyboru konkretnej stylistki.
