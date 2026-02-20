-- =====================================================
-- TRAININGS: Block-based training/course content
-- =====================================================

CREATE TABLE IF NOT EXISTS public.trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_en text,
  title_ru text,
  slug text UNIQUE NOT NULL,
  category text NOT NULL,
  description text,
  description_en text,
  description_ru text,
  cover_image_url text,
  cover_image_position text DEFAULT 'center',
  price text,
  price_en text,
  price_ru text,
  duration text,
  duration_en text,
  duration_ru text,
  content_blocks jsonb DEFAULT '[]'::jsonb,
  is_published boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trainings_slug ON public.trainings(slug);
CREATE INDEX IF NOT EXISTS idx_trainings_sort ON public.trainings(sort_order);

ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trainings_select_public" ON public.trainings FOR SELECT TO public USING (true);
CREATE POLICY "trainings_insert_admin" ON public.trainings FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "trainings_update_admin" ON public.trainings FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "trainings_delete_admin" ON public.trainings FOR DELETE TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION update_trainings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trainings_updated_at
  BEFORE UPDATE ON public.trainings
  FOR EACH ROW EXECUTE FUNCTION update_trainings_updated_at();

-- Seed data: 4 training templates
INSERT INTO public.trainings (title, title_en, title_ru, slug, category, description, description_en, description_ru, price, price_en, price_ru, duration, duration_en, duration_ru, content_blocks, is_published, sort_order) VALUES
(
  'Makijaż Permanentny',
  'Permanent Makeup',
  'Перманентный макияж',
  'makijaz-permanentny',
  'permanent_makeup',
  'Kompleksowe szkolenie z makijażu permanentnego — brwi, usta, kreska. Teoria i praktyka pod okiem doświadczonej linergistki.',
  'Comprehensive permanent makeup training — brows, lips, eyeliner. Theory and practice under the guidance of an experienced specialist.',
  'Комплексное обучение перманентному макияжу — брови, губы, стрелки. Теория и практика под руководством опытного специалиста.',
  'od 3 500 PLN',
  'from 3 500 PLN',
  'от 3 500 PLN',
  '5 dni (40h)',
  '5 days (40h)',
  '5 дней (40ч)',
  '[
    {"id":"pm-1","type":"heading","text":"Dla kogo jest to szkolenie?","text_en":"Who is this training for?","text_ru":"Для кого это обучение?","level":2},
    {"id":"pm-2","type":"text","text":"Szkolenie skierowane jest zarówno do osób początkujących, które chcą rozpocząć karierę w branży beauty, jak i do praktyków pragnących poszerzyć swoje umiejętności o techniki makijażu permanentnego. Nie wymagamy wcześniejszego doświadczenia — uczymy od podstaw.","text_en":"The training is designed for both beginners who want to start a career in the beauty industry and practitioners looking to expand their skills with permanent makeup techniques. No prior experience required — we teach from scratch.","text_ru":"Обучение предназначено как для начинающих, желающих начать карьеру в бьюти-индустрии, так и для практиков, стремящихся расширить свои навыки техниками перманентного макияжа. Предыдущий опыт не требуется — обучаем с нуля."},
    {"id":"pm-3","type":"heading","text":"Program szkolenia","text_en":"Training program","text_ru":"Программа обучения","level":2},
    {"id":"pm-4","type":"list","items":["Teoria koloru i kolorystyka skóry","Anatomia i fizjologia skóry twarzy","Zasady higieny i sterylizacji","Technika pudrowa (Powder Brows)","Technika mikroblading","Makijaż permanentny ust — pełne wypełnienie i kontur","Kreska permanentna — górna i dolna powieka","Praca na sztucznej skórze (latex)","Praca na modelkach pod okiem instruktora","Obsługa i konserwacja sprzętu"],"items_en":["Color theory and skin colorimetry","Facial skin anatomy and physiology","Hygiene and sterilization principles","Powder Brows technique","Microblading technique","Permanent lip makeup — full fill and contour","Permanent eyeliner — upper and lower lid","Practice on artificial skin (latex)","Work on live models under instructor supervision","Equipment operation and maintenance"],"items_ru":["Теория цвета и колориметрия кожи","Анатомия и физиология кожи лица","Правила гигиены и стерилизации","Техника пудровых бровей (Powder Brows)","Техника микроблейдинг","Перманентный макияж губ — полная заливка и контур","Перманентные стрелки — верхнее и нижнее веко","Практика на искусственной коже (латекс)","Работа на моделях под руководством инструктора","Обслуживание и уход за оборудованием"],"style":"check"},
    {"id":"pm-5","type":"heading","text":"Co otrzymujesz?","text_en":"What do you get?","text_ru":"Что вы получаете?","level":2},
    {"id":"pm-6","type":"list","items":["Certyfikat ukończenia szkolenia","Starter kit z maszynką i pigmentami","Materiały szkoleniowe w formie elektronicznej","Wsparcie mentorskie przez 3 miesiące po szkoleniu","Dostęp do zamkniętej grupy absolwentów"],"items_en":["Training completion certificate","Starter kit with machine and pigments","Electronic training materials","3-month mentoring support after training","Access to private alumni group"],"items_ru":["Сертификат об окончании обучения","Стартовый набор с аппаратом и пигментами","Электронные учебные материалы","Менторская поддержка в течение 3 месяцев после обучения","Доступ к закрытой группе выпускников"],"style":"check"},
    {"id":"pm-7","type":"heading","text":"Przebieg szkolenia","text_en":"Training schedule","text_ru":"Расписание обучения","level":3},
    {"id":"pm-8","type":"text","text":"Dzień 1-2: Intensywna teoria — kolorystyka, anatomia, bezpieczeństwo. Dzień 3: Ćwiczenia na sztucznej skórze — opanowanie technik krok po kroku. Dzień 4-5: Praca na modelkach — pełne zabiegi pod indywidualną opieką instruktora. Każdy dzień trwa ok. 8 godzin z przerwami na lunch.","text_en":"Day 1-2: Intensive theory — color science, anatomy, safety. Day 3: Practice on artificial skin — mastering techniques step by step. Day 4-5: Work on live models — full procedures under individual instructor guidance. Each day lasts approximately 8 hours with lunch breaks.","text_ru":"День 1-2: Интенсивная теория — колористика, анатомия, безопасность. День 3: Практика на искусственной коже — освоение техник шаг за шагом. День 4-5: Работа на моделях — полные процедуры под индивидуальным руководством инструктора. Каждый день длится около 8 часов с перерывами на обед."}
  ]'::jsonb,
  true,
  0
),
(
  'Stylizacja Paznokci — Manikiur',
  'Nail Styling — Manicure',
  'Стилизация ногтей — Маникюр',
  'manikiur',
  'manicure',
  'Profesjonalne szkolenie z manikiuru — techniki hybrydowe, żelowe i klasyczne. Praktyczna nauka pod okiem specjalistki.',
  'Professional manicure training — hybrid, gel and classic techniques. Hands-on learning under specialist guidance.',
  'Профессиональное обучение маникюру — гибридные, гелевые и классические техники. Практическое обучение под руководством специалиста.',
  'od 2 000 PLN',
  'from 2 000 PLN',
  'от 2 000 PLN',
  '3 dni (24h)',
  '3 days (24h)',
  '3 дня (24ч)',
  '[
    {"id":"mn-1","type":"heading","text":"Dla kogo jest to szkolenie?","text_en":"Who is this training for?","text_ru":"Для кого это обучение?","level":2},
    {"id":"mn-2","type":"text","text":"Kurs jest idealny dla osób chcących rozpocząć pracę jako stylistka paznokci lub rozszerzyć swoją ofertę o profesjonalny manikiur. Szkolenie obejmuje zarówno teorię, jak i intensywną praktykę na modelkach.","text_en":"The course is ideal for those who want to start working as a nail stylist or expand their services with professional manicure. The training includes both theory and intensive practice on models.","text_ru":"Курс идеален для тех, кто хочет начать работу мастером маникюра или расширить свои услуги профессиональным маникюром. Обучение включает как теорию, так и интенсивную практику на моделях."},
    {"id":"mn-3","type":"heading","text":"Program szkolenia","text_en":"Training program","text_ru":"Программа обучения","level":2},
    {"id":"mn-4","type":"list","items":["Budowa i choroby paznokcia — kiedy nie wykonujemy zabiegu","Przygotowanie płytki paznokcia","Technika manikiuru klasycznego","Manikiur hybrydowy — aplikacja i utwardzanie","Przedłużanie paznokci żelem na szablonie i tipsie","Zdobienia — french, ombre, grafiki","Usuwanie hybrydy i żelu bez uszkodzenia płytki","Pielęgnacja i olejowanie skórek"],"items_en":["Nail structure and diseases — contraindications","Nail plate preparation","Classic manicure technique","Hybrid manicure — application and curing","Gel nail extensions on forms and tips","Decorations — french, ombre, nail art","Hybrid and gel removal without plate damage","Cuticle care and oiling"],"items_ru":["Строение и заболевания ногтей — противопоказания","Подготовка ногтевой пластины","Техника классического маникюра","Гибридный маникюр — нанесение и полимеризация","Наращивание ногтей гелем на формах и типсах","Дизайн — френч, омбре, нейл-арт","Снятие гибрида и геля без повреждения пластины","Уход за кутикулой и маслами"],"style":"check"},
    {"id":"mn-5","type":"heading","text":"Co otrzymujesz?","text_en":"What do you get?","text_ru":"Что вы получаете?","level":2},
    {"id":"mn-6","type":"list","items":["Certyfikat ukończenia kursu","Zestaw startowy z lampą UV/LED","Materiały szkoleniowe","Wsparcie po szkoleniu — konsultacje online","Rabat na produkty do stylizacji paznokci"],"items_en":["Course completion certificate","Starter kit with UV/LED lamp","Training materials","Post-training support — online consultations","Discount on nail styling products"],"items_ru":["Сертификат об окончании курса","Стартовый набор с UV/LED лампой","Учебные материалы","Поддержка после обучения — онлайн консультации","Скидка на продукцию для стилизации ногтей"],"style":"check"},
    {"id":"mn-7","type":"text","text":"Zajęcia odbywają się w małych grupach (max. 4 osoby), co gwarantuje indywidualne podejście do każdej kursantki. Zapewniamy wszystkie materiały potrzebne do nauki.","text_en":"Classes are held in small groups (max. 4 people), ensuring an individual approach to each student. We provide all materials needed for learning.","text_ru":"Занятия проходят в небольших группах (макс. 4 человека), что гарантирует индивидуальный подход к каждой ученице. Мы предоставляем все необходимые материалы для обучения."}
  ]'::jsonb,
  true,
  1
),
(
  'Stylizacja Brwi',
  'Brow Styling',
  'Стилизация бровей',
  'brwi',
  'brows',
  'Szkolenie z profesjonalnej stylizacji brwi — henna, laminacja, geometria brwi, microblading.',
  'Professional brow styling training — henna, lamination, brow geometry, microblading.',
  'Обучение профессиональной стилизации бровей — хна, ламинирование, геометрия бровей, микроблейдинг.',
  'od 1 800 PLN',
  'from 1 800 PLN',
  'от 1 800 PLN',
  '2 dni (16h)',
  '2 days (16h)',
  '2 дня (16ч)',
  '[
    {"id":"br-1","type":"heading","text":"Dla kogo jest to szkolenie?","text_en":"Who is this training for?","text_ru":"Для кого это обучение?","level":2},
    {"id":"br-2","type":"text","text":"Szkolenie jest przeznaczone dla kosmetyczek, stylistek i osób chcących specjalizować się w usługach brwiowych. Idealne jako uzupełnienie oferty salonu lub początek nowej ścieżki zawodowej.","text_en":"The training is designed for beauticians, stylists and those who want to specialize in brow services. Ideal as an addition to a salon''s offerings or the start of a new career path.","text_ru":"Обучение предназначено для косметологов, стилистов и тех, кто хочет специализироваться на услугах для бровей. Идеально как дополнение к услугам салона или начало новой карьеры."},
    {"id":"br-3","type":"heading","text":"Program szkolenia","text_en":"Training program","text_ru":"Программа обучения","level":2},
    {"id":"br-4","type":"list","items":["Analiza kształtu twarzy i dobór formy brwi","Geometria brwi — pomiary i symetria","Korekta brwi pęsetą i woskiem","Henna pudrowa i klasyczna — aplikacja i dobór koloru","Laminacja brwi krok po kroku","Koloryzacja brwi farbką","Technika microblading — rysowanie włosków","Pielęgnacja pozabiegowa i porady dla klientek"],"items_en":["Face shape analysis and brow shape selection","Brow geometry — measurements and symmetry","Brow correction with tweezers and wax","Powder and classic henna — application and color matching","Brow lamination step by step","Brow tinting","Microblading technique — hair stroke drawing","Post-treatment care and client advice"],"items_ru":["Анализ формы лица и подбор формы бровей","Геометрия бровей — измерения и симметрия","Коррекция бровей пинцетом и воском","Пудровая и классическая хна — нанесение и подбор цвета","Ламинирование бровей пошагово","Окрашивание бровей краской","Техника микроблейдинг — прорисовка волосков","Послепроцедурный уход и советы для клиенток"],"style":"check"},
    {"id":"br-5","type":"heading","text":"Co otrzymujesz?","text_en":"What do you get?","text_ru":"Что вы получаете?","level":2},
    {"id":"br-6","type":"list","items":["Certyfikat ukończenia szkolenia","Zestaw do henny i laminacji","Materiały szkoleniowe z ilustracjami","Konsultacje po szkoleniu","Dostęp do grupy wsparcia online"],"items_en":["Training completion certificate","Henna and lamination kit","Illustrated training materials","Post-training consultations","Access to online support group"],"items_ru":["Сертификат об окончании обучения","Набор для хны и ламинирования","Учебные материалы с иллюстрациями","Консультации после обучения","Доступ к группе поддержки онлайн"],"style":"check"},
    {"id":"br-7","type":"text","text":"Szkolenie prowadzone w kameralnej atmosferze, z naciskiem na praktykę. Gwarantujemy modelki do ćwiczeń oraz pełne zaplecze materiałowe.","text_en":"Training conducted in an intimate atmosphere with emphasis on practice. We guarantee models for practice and full material support.","text_ru":"Обучение проводится в камерной атмосфере с упором на практику. Мы гарантируем моделей для практики и полное материальное обеспечение."}
  ]'::jsonb,
  true,
  2
),
(
  'Przedłużanie Rzęs',
  'Eyelash Extensions',
  'Наращивание ресниц',
  'przedluzanie-rzes',
  'lashes',
  'Szkolenie z przedłużania rzęs — techniki 1:1, objętościowe i mega volume. Pełna teoria i praktyka na modelkach.',
  'Eyelash extension training — 1:1, volume and mega volume techniques. Full theory and practice on models.',
  'Обучение наращиванию ресниц — техники 1:1, объёмные и мега объём. Полная теория и практика на моделях.',
  'od 2 500 PLN',
  'from 2 500 PLN',
  'от 2 500 PLN',
  '3 dni (24h)',
  '3 days (24h)',
  '3 дня (24ч)',
  '[
    {"id":"rz-1","type":"heading","text":"Dla kogo jest to szkolenie?","text_en":"Who is this training for?","text_ru":"Для кого это обучение?","level":2},
    {"id":"rz-2","type":"text","text":"Kurs przeznaczony jest dla osób chcących profesjonalnie zajmować się przedłużaniem rzęs. Zarówno dla początkujących, jak i dla stylistek chcących opanować zaawansowane techniki objętościowe.","text_en":"The course is designed for those who want to professionally work with eyelash extensions. For both beginners and stylists who want to master advanced volume techniques.","text_ru":"Курс предназначен для тех, кто хочет профессионально заниматься наращиванием ресниц. Как для начинающих, так и для стилистов, желающих освоить продвинутые объёмные техники."},
    {"id":"rz-3","type":"heading","text":"Program szkolenia","text_en":"Training program","text_ru":"Программа обучения","level":2},
    {"id":"rz-4","type":"list","items":["Anatomia oka i rodzaje rzęs naturalnych","Bezpieczeństwo i higiena pracy","Technika klasyczna 1:1","Technika objętościowa 2D-6D","Technika Mega Volume","Dobór kształtu i skrętu rzęs do kształtu oka","Izolacja rzęs i praca z kleiami","Uzupełnianie i zdejmowanie rzęs","Praca na modelkach — minimum 2 pełne aplikacje"],"items_en":["Eye anatomy and natural lash types","Workplace safety and hygiene","Classic 1:1 technique","Volume technique 2D-6D","Mega Volume technique","Lash shape and curl selection for eye shape","Lash isolation and adhesive work","Lash fills and removal","Work on models — minimum 2 full applications"],"items_ru":["Анатомия глаза и типы натуральных ресниц","Безопасность и гигиена работы","Классическая техника 1:1","Объёмная техника 2D-6D","Техника Мега Объём","Подбор формы и изгиба ресниц к форме глаза","Изоляция ресниц и работа с клеями","Коррекция и снятие ресниц","Работа на моделях — минимум 2 полные аппликации"],"style":"check"},
    {"id":"rz-5","type":"heading","text":"Co otrzymujesz?","text_en":"What do you get?","text_ru":"Что вы получаете?","level":2},
    {"id":"rz-6","type":"list","items":["Certyfikat ukończenia szkolenia","Profesjonalny zestaw startowy (pęsety, kleje, rzęsy)","Materiały szkoleniowe","Wsparcie mentorskie przez 2 miesiące","Rabat na zakup materiałów do pracy"],"items_en":["Training completion certificate","Professional starter kit (tweezers, adhesives, lashes)","Training materials","2-month mentoring support","Discount on work materials"],"items_ru":["Сертификат об окончании обучения","Профессиональный стартовый набор (пинцеты, клеи, ресницы)","Учебные материалы","Менторская поддержка в течение 2 месяцев","Скидка на рабочие материалы"],"style":"check"},
    {"id":"rz-7","type":"heading","text":"Przebieg szkolenia","text_en":"Training schedule","text_ru":"Расписание обучения","level":3},
    {"id":"rz-8","type":"text","text":"Dzień 1: Teoria — budowa oka, rodzaje rzęs, materiałoznawstwo, bezpieczeństwo. Dzień 2: Praktyka na manekinie i sztucznej głowie. Dzień 3: Praca na modelkach — pełne aplikacje pod indywidualnym nadzorem instruktora.","text_en":"Day 1: Theory — eye structure, lash types, materials science, safety. Day 2: Practice on mannequin and artificial head. Day 3: Work on live models — full applications under individual instructor supervision.","text_ru":"День 1: Теория — строение глаза, типы ресниц, материаловедение, безопасность. День 2: Практика на манекене и искусственной голове. День 3: Работа на моделях — полные аппликации под индивидуальным руководством инструктора."}
  ]'::jsonb,
  true,
  3
);
