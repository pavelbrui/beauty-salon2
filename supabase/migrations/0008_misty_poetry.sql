/*
  # Add all services

  1. New Services
    - Added all services from Booksy with categories:
      - Pielęgnacja brwi
      - Makijaż permanentny
      - Rzęsy
      - Peeling węglowy
      - Laserowe usuwanie
      - Pakiety zniżkowe
      - Stylizacja rzęs

  2. Changes
    - Added detailed descriptions
    - Updated prices and durations
    - Added categories
*/

-- Insert all services
INSERT INTO services (name, category, price, duration, description) VALUES
-- Pielęgnacja brwi
('Regulacja brwi + henna', 'Pielęgnacja brwi', 9000, 35, 'Budowanie kształtu brwi, regulacja i delikatne farbowanie brwi. Naturalny i wyrazisty efekt.'),
('Laminowanie brwi + henna + regulacja', 'Pielęgnacja brwi', 13000, 50, 'Kompleksowy zabieg modelowania i utrwalania kształtu brwi wraz z koloryzacją.'),
('Henna brwi + regulacja + botox', 'Pielęgnacja brwi', 10000, 60, 'Zabieg z dodatkiem botoxu dla wzmocnienia i odżywienia brwi.'),
('Botox brwi', 'Pielęgnacja brwi', 4000, 20, 'Odżywczy zabieg z botoxem dla wzmocnienia włosków.'),
('Regulacja brwi', 'Pielęgnacja brwi', 5000, 20, 'Precyzyjna regulacja kształtu brwi.'),
('Botox + henna brwi', 'Pielęgnacja brwi', 6000, 50, 'Połączenie koloryzacji z odżywczym zabiegiem botox.'),
('Lifting rzęs + henna brwi z regulacją', 'Pielęgnacja brwi', 23000, 70, 'Kompleksowy zabieg dla rzęs i brwi.'),
('Botox brwi + botox rzęs', 'Pielęgnacja brwi', 5000, 30, 'Odżywczy zabieg dla brwi i rzęs.'),
('Laminacja brwi z regulacją', 'Pielęgnacja brwi', 11000, 40, 'Modelowanie i utrwalanie kształtu brwi.'),
('Regulacja wąsika', 'Pielęgnacja brwi', 3000, 5, 'Precyzyjna regulacja owłosienia nad górną wargą.'),
('Regulacja brwi z przerzedzeniem', 'Pielęgnacja brwi', 5500, 25, 'Regulacja z dodatkowym przerzedzeniem zbyt gęstych brwi.'),
('Regulacja brwi + wąsik', 'Pielęgnacja brwi', 6000, 20, 'Kompleksowa regulacja brwi i wąsika.'),
('Regulacja brwi + henna + wąsik', 'Pielęgnacja brwi', 11000, 40, 'Pełny zabieg regulacji i koloryzacji z wąsikiem.'),

-- Makijaż permanentny
('Makijaż permanentny ust', 'Makijaż permanentny', 85000, 150, 'Trwały makijaż ust z efektem 3D. Naturalny wygląd i długotrwały efekt.'),
('Makijaż permanentny brwi (pudrowe/cieniowane)', 'Makijaż permanentny', 80000, 135, 'Makijaż permanentny brwi metodą pudrową lub cieniowaną.'),
('Makijaż permanentny oczu', 'Makijaż permanentny', 45000, 130, 'Zagęszczenie linii rzęs dla podkreślenia spojrzenia.'),
('Makijaż permanentny brwi z korektą', 'Makijaż permanentny', 100000, 120, 'Kompletny zabieg z korektą w cenie.'),
('Korekta do 2 miesięcy', 'Makijaż permanentny', 20000, 90, 'Korekta na życzenie klienta, 5-9 tygodni po pierwszym zabiegu.'),
('Dopigmentowanie makijażu permanentnego', 'Makijaż permanentny', 15000, 60, 'Dopigmentowanie do 2 miesięcy po ostatnim zabiegu.'),
('Usuwanie makijażu permanentnego brwi', 'Makijaż permanentny', 17000, 40, 'Usuwanie makijażu permanentnego brwi metodą remover.'),
('Konsultacja', 'Makijaż permanentny', 100, 30, 'Profesjonalna konsultacja przed zabiegiem.'),
('Odświeżenie makijażu permanentnego', 'Makijaż permanentny', 45000, 120, 'Odświeżenie istniejącego makijażu permanentnego.'),

-- Rzęsy
('Lifting rzęs + botox + farbowanie', 'Rzęsy', 14000, 70, 'Kompleksowy zabieg liftingu rzęs z botoxem i farbowaniem.'),
('Botox rzęs', 'Rzęsy', 4000, 15, 'Odżywczy zabieg z botoxem dla rzęs.'),
('Henna rzęs', 'Rzęsy', 4000, 20, 'Farbowanie rzęs dla podkreślenia spojrzenia.'),

-- Peeling węglowy
('Laserowy peeling węglowy', 'Peeling węglowy', 20000, 60, 'Głęboko oczyszczający zabieg z użyciem lasera.'),

-- Laserowe usuwanie
('Laserowe usunięcie makijażu permanentnego', 'Laserowe usuwanie', 17000, 15, 'Precyzyjne usuwanie makijażu permanentnego.'),
('Laserowe usuwanie tatuażu', 'Laserowe usuwanie', 18000, 30, 'Profesjonalne usuwanie tatuażu laserem.'),
('Laserowe usuwanie kresek permanentnych', 'Laserowe usuwanie', 20000, 25, 'Usuwanie kresek wykonanych makijażem permanentnym.'),

-- Pakiety zniżkowe
('Ściągnięcie rzęs + laminacja', 'Pakiety', 18000, 80, 'Ściągnięcie przedłużonych rzęs z zabiegiem laminacji.'),
('Makijaż permanentny brwi + kreska', 'Pakiety', 110000, 210, 'Komplet makijażu permanentnego brwi i kreski.'),
('Makijaż permanentny brwi + usta', 'Pakiety', 195000, 270, 'Komplet makijażu permanentnego brwi i ust z korektą.'),
('Pakiet laserowego usuwania (5 sesji)', 'Pakiety', 60000, 30, 'Pakiet 5 sesji usuwania tatuażu do 8 cm.'),
('Lifting rzęs + laminowanie brwi', 'Pakiety', 23000, 90, 'Kompleksowy zabieg dla rzęs i brwi.'),
('Laserowy peeling węglowy (3 sesje)', 'Pakiety', 50000, 30, 'Pakiet 3 zabiegów peelingu węglowego.'),
('Henna komplet', 'Pakiety', 10000, 40, 'Henna brwi z regulacją + henna rzęs.'),

-- Stylizacja rzęs
('Przedłużanie rzęs 1:1', 'Stylizacja rzęs', 15000, 135, 'Klasyczne przedłużanie rzęs metodą 1:1.'),
('Przedłużanie rzęs 2:1', 'Stylizacja rzęs', 16000, 135, 'Przedłużanie rzęs metodą objętościową 2:1.'),
('Przedłużanie rzęs 3-4D', 'Stylizacja rzęs', 18000, 150, 'Przedłużanie rzęs metodą objętościową 3-4D.'),
('Przedłużanie rzęs 5-6D', 'Stylizacja rzęs', 20000, 150, 'Przedłużanie rzęs metodą mega objętościową 5-6D.'),
('Uzupełnienie rzęs 1:1', 'Stylizacja rzęs', 13000, 90, 'Uzupełnienie rzęs metodą 1:1 do 3-4 tygodni.'),
('Uzupełnienie rzęs 2:1', 'Stylizacja rzęs', 14000, 90, 'Uzupełnienie rzęs metodą 2:1 do 3-4 tygodni.'),
('Uzupełnienie rzęs 3-4D', 'Stylizacja rzęs', 15000, 90, 'Uzupełnienie rzęs metodą 3-4D do 3-4 tygodni.'),
('Uzupełnienie rzęs 5-6D', 'Stylizacja rzęs', 16000, 90, 'Uzupełnienie rzęs metodą 5-6D do 3-4 tygodni.'),
('Ściągnięcie rzęs', 'Stylizacja rzęs', 5000, 30, 'Bezpieczne ściągnięcie przedłużonych rzęs.'),
('Przedłużanie rzęs mokry efekt 2D', 'Stylizacja rzęs', 17000, 135, 'Przedłużanie rzęs metodą mokry efekt 2D.'),
('Przedłużanie rzęs mokry efekt 3-4D', 'Stylizacja rzęs', 19000, 150, 'Przedłużanie rzęs metodą mokry efekt 3-4D.'),
('Uzupełnienie rzęs mokry efekt 2D', 'Stylizacja rzęs', 14000, 90, 'Uzupełnienie rzęs metodą mokry efekt 2D do 3-4 tygodni.'),
('Uzupełnienie rzęs mokry efekt 3-4D', 'Stylizacja rzęs', 15000, 90, 'Uzupełnienie rzęs metodą mokry efekt 3-4D do 3-4 tygodni.');