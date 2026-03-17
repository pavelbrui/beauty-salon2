export interface LandingPageFAQ {
  question: string;
  question_en: string;
  question_ru: string;
  answer: string;
  answer_en: string;
  answer_ru: string;
}

export interface LocalizedText {
  pl: string;
  en: string;
  ru: string;
}

export interface ProcedureStep {
  title: LocalizedText;
  description: LocalizedText;
}

export interface LandingPageConfig {
  slug: string;
  category: string;
  imageKey: 'permanentMakeup' | 'lashes' | 'browCare' | 'carbonPeeling' | 'tattooRemoval' | 'manicure';
  hero: { title: LocalizedText; subtitle: LocalizedText };
  seo: { title: LocalizedText; description: LocalizedText; keywords: LocalizedText };
  intro: LocalizedText;
  benefits: { pl: string; en: string; ru: string }[];
  faq: LandingPageFAQ[];
  cta: { text: LocalizedText; link: string };
  procedureSteps?: ProcedureStep[];
  contraindications?: LocalizedText[];
  extendedIntro?: LocalizedText;
  pricingLink?: { text: LocalizedText; url: string };
  showEffectsGallery?: boolean;
}

export const LANDING_PAGES: LandingPageConfig[] = [
  // 1. Makijaż permanentny
  {
    slug: 'makijaz-permanentny-bialystok',
    category: 'Makijaż permanentny',
    imageKey: 'permanentMakeup',
    hero: {
      title: {
        pl: 'Makijaż Permanentny w Białymstoku',
        en: 'Permanent Makeup in Białystok',
        ru: 'Перманентный макияж в Белостоке',
      },
      subtitle: {
        pl: 'Brwi, usta, oczy — naturalny efekt na lata. Salon Katarzyna Brui.',
        en: 'Brows, lips, eyes — natural look for years. Katarzyna Brui Salon.',
        ru: 'Брови, губы, глаза — натуральный эффект на годы. Салон Катажина Бруи.',
      },
    },
    seo: {
      title: {
        pl: 'Makijaż Permanentny Białystok — Brwi, Usta, Oczy | Katarzyna Brui',
        en: 'Permanent Makeup Białystok — Brows, Lips, Eyes | Katarzyna Brui',
        ru: 'Перманентный макияж Белосток — Брови, Губы, Глаза | Катажина Бруи',
      },
      description: {
        pl: 'Profesjonalny makijaż permanentny brwi, ust i oczu w Białymstoku. Microblading, metoda pudrowa, ombre. Bezpłatna konsultacja. Umów wizytę w salonie Katarzyna Brui.',
        en: 'Professional permanent makeup of brows, lips and eyes in Białystok. Microblading, powder method, ombre. Free consultation. Book at Katarzyna Brui salon.',
        ru: 'Профессиональный перманентный макияж бровей, губ и глаз в Белостоке. Микроблейдинг, пудровая техника, омбре. Бесплатная консультация. Запишитесь в салон Катажина Бруи.',
      },
      keywords: {
        pl: 'makijaż permanentny Białystok, permanentny brwi Białystok, permanentny ust Białystok, brwi pudrowe Białystok, powder brows Białystok, ombre brows Białystok, kreska permanentna oczy Białystok, najlepszy makijaż permanentny Białystok opinie, makijaż permanentny brwi cena Białystok, korekta makijażu permanentnego Białystok, permanentny ust efekt naturalny, linergistka Białystok, microblading Białystok, nanopigmentacja Białystok, combo brows Białystok, makijaż permanentny cena Białystok',
        en: 'permanent makeup Białystok, microblading Białystok, permanent brows, permanent lips, powder brows, ombre brows, best permanent makeup Białystok',
        ru: 'перманентный макияж Белосток, микроблейдинг Белосток, перманент бровей, перманент губ, пудровые брови, омбре брови',
      },
    },
    intro: {
      pl: 'Salon Katarzyna Brui w Białymstoku to miejsce, w którym makijaż permanentny tworzymy z pasją i precyzją. Specjalizujemy się w metodzie pudrowej, microblading oraz technice ombre brwi. Każdy zabieg poprzedzamy indywidualną konsultacją, aby dobrać idealny kształt i kolor do Twojej twarzy. Pracujemy na najwyższej jakości pigmentach, gwarantując naturalny i długotrwały efekt.',
      en: 'Katarzyna Brui Salon in Białystok is a place where we create permanent makeup with passion and precision. We specialize in powder method, microblading and ombre brow technique. Each treatment is preceded by an individual consultation to select the ideal shape and color for your face. We use the highest quality pigments, guaranteeing a natural and long-lasting effect.',
      ru: 'Салон Катажина Бруи в Белостоке — это место, где перманентный макияж создаётся с увлечением и точностью. Мы специализируемся на пудровой технике, микроблейдинге и омбре бровей. Каждую процедуру предваряет индивидуальная консультация для подбора идеальной формы и цвета. Мы используем пигменты высочайшего качества, гарантируя естественный и долговременный результат.',
    },
    benefits: [
      { pl: 'Ponad 10 lat doświadczenia w makijażu permanentnym', en: 'Over 10 years of permanent makeup experience', ru: 'Более 10 лет опыта в перманентном макияже' },
      { pl: 'Certyfikowane pigmenty najwyższej jakości', en: 'Certified highest quality pigments', ru: 'Сертифицированные пигменты высочайшего качества' },
      { pl: 'Indywidualna konsultacja i dobór kształtu', en: 'Individual consultation and shape selection', ru: 'Индивидуальная консультация и подбор формы' },
      { pl: 'Sterylne warunki pracy — jednorazowe narzędzia', en: 'Sterile working conditions — disposable tools', ru: 'Стерильные условия работы — одноразовые инструменты' },
      { pl: 'Korekta w cenie zabiegu', en: 'Touch-up included in the price', ru: 'Коррекция включена в стоимость' },
    ],
    faq: [
      {
        question: 'Ile kosztuje makijaż permanentny brwi w Białymstoku?',
        question_en: 'How much does permanent brow makeup cost in Białystok?',
        question_ru: 'Сколько стоит перманентный макияж бровей в Белостоке?',
        answer: 'Ceny makijażu permanentnego brwi w naszym salonie zaczynają się od 400 PLN. Dokładna cena zależy od wybranej metody (microblading, pudrowa, ombre). W cenę wliczona jest konsultacja i korekta.',
        answer_en: 'Permanent brow makeup prices at our salon start from 400 PLN. The exact price depends on the chosen method (microblading, powder, ombre). Consultation and touch-up are included.',
        answer_ru: 'Цены на перманентный макияж бровей в нашем салоне начинаются от 400 PLN. Точная цена зависит от выбранной техники (микроблейдинг, пудровая, омбре). Консультация и коррекция включены.',
      },
      {
        question: 'Jak długo utrzymuje się makijaż permanentny?',
        question_en: 'How long does permanent makeup last?',
        question_ru: 'Как долго держится перманентный макияж?',
        answer: 'Makijaż permanentny utrzymuje się od 1 do 3 lat, w zależności od typu skóry, stylu życia i pielęgnacji. Zalecamy korektę co 12-18 miesięcy, aby utrzymać świeży wygląd.',
        answer_en: 'Permanent makeup lasts from 1 to 3 years, depending on skin type, lifestyle and care. We recommend a touch-up every 12-18 months to maintain a fresh look.',
        answer_ru: 'Перманентный макияж держится от 1 до 3 лет, в зависимости от типа кожи, образа жизни и ухода. Мы рекомендуем коррекцию каждые 12-18 месяцев для поддержания свежего вида.',
      },
      {
        question: 'Czy makijaż permanentny brwi boli?',
        question_en: 'Is permanent brow makeup painful?',
        question_ru: 'Больно ли делать перманентный макияж бровей?',
        answer: 'Stosujemy profesjonalne środki znieczulające, dzięki czemu zabieg jest praktycznie bezbolesny. Większość klientek opisuje odczucia jako lekkie swędzenie lub wibrację.',
        answer_en: 'We use professional anesthetics, making the procedure virtually painless. Most clients describe the sensation as slight tingling or vibration.',
        answer_ru: 'Мы используем профессиональные обезболивающие средства, благодаря чему процедура практически безболезненна. Большинство клиенток описывают ощущения как лёгкое покалывание или вибрацию.',
      },
      {
        question: 'Jak wygląda gojenie po makijażu permanentnym?',
        question_en: 'What does healing look like after permanent makeup?',
        question_ru: 'Как проходит заживление после перманентного макияжа?',
        answer: 'Proces gojenia trwa około 4-6 tygodni. Przez pierwsze dni kolor jest intensywniejszy, potem brwi się złuszczają i kolor jasnieje o 30-50%. Ostateczny efekt widoczny jest po pełnym zagojeniu.',
        answer_en: 'The healing process takes about 4-6 weeks. For the first days the color is more intense, then brows peel and the color lightens by 30-50%. The final result is visible after full healing.',
        answer_ru: 'Процесс заживления длится около 4-6 недель. В первые дни цвет интенсивнее, затем брови шелушатся и цвет светлеет на 30-50%. Окончательный результат виден после полного заживления.',
      },
      {
        question: 'Jak przygotować się do makijażu permanentnego?',
        question_en: 'How to prepare for permanent makeup?',
        question_ru: 'Как подготовиться к перманентному макияжу?',
        answer: 'Na 24 godziny przed zabiegiem unikaj alkoholu, kawy i leków rozrzedzających krew (np. aspiryny). Nie opalaj się i nie korzystaj z solarium przez tydzień przed wizytą. Przyjdź z czystą skórą bez makijażu w okolicy brwi. Jeśli masz skłonność do opryszczki (przy makijażu ust), poinformuj nas wcześniej — zalecamy profilaktykę.',
        answer_en: 'Avoid alcohol, coffee and blood-thinning medications (e.g. aspirin) 24 hours before the procedure. Do not sunbathe or use a solarium for a week before your appointment. Come with clean skin and no makeup in the brow area. If you are prone to cold sores (for lip procedures), let us know in advance — we recommend preventive treatment.',
        answer_ru: 'За 24 часа до процедуры избегайте алкоголя, кофе и препаратов, разжижающих кровь (например, аспирина). Не загорайте и не посещайте солярий за неделю до визита. Приходите с чистой кожей без макияжа в зоне бровей. Если у вас склонность к герпесу (при макияже губ), сообщите нам заранее — мы рекомендуем профилактику.',
      },
      {
        question: 'Jakie są przeciwwskazania do makijażu permanentnego?',
        question_en: 'What are the contraindications for permanent makeup?',
        question_ru: 'Какие противопоказания к перманентному макияжу?',
        answer: 'Przeciwwskazania to m.in.: ciąża i okres karmienia piersią, cukrzyca, choroby autoimmunologiczne, aktywne stany zapalne skóry, epilepsja, przyjmowanie leków immunosupresyjnych oraz skłonność do bliznowców (keloidów). Podczas konsultacji omówimy Twoją historię zdrowotną, aby zabieg był bezpieczny.',
        answer_en: 'Contraindications include: pregnancy and breastfeeding, diabetes, autoimmune diseases, active skin inflammation, epilepsy, immunosuppressive medications, and tendency to keloid scarring. During consultation, we will discuss your medical history to ensure the procedure is safe.',
        answer_ru: 'Противопоказания включают: беременность и кормление грудью, сахарный диабет, аутоиммунные заболевания, активные воспаления кожи, эпилепсию, приём иммуносупрессивных препаратов и склонность к келоидным рубцам. Во время консультации мы обсудим вашу историю здоровья, чтобы процедура была безопасной.',
      },
    ],
    cta: {
      text: {
        pl: 'Chcesz naturalnie piękne brwi? Umów wizytę!',
        en: 'Want naturally beautiful brows? Book an appointment!',
        ru: 'Хотите естественно красивые брови? Запишитесь!',
      },
      link: '/services',
    },
    extendedIntro: {
      pl: 'Makijaż permanentny to technika mikroigłowej pigmentacji skóry, która pozwala uzyskać efekt idealnie wykonanego makijażu na co dzień. W naszym salonie w Białymstoku stosujemy najnowsze metody — od microbladingu po technikę pudrową — dobierając pigmenty indywidualnie do kolorytu skóry każdej klientki. Efekt utrzymuje się od 1 do 3 lat, w zależności od typu cery i pielęgnacji.',
      en: 'Permanent makeup is a micro-needle skin pigmentation technique that creates the effect of perfectly applied daily makeup. At our salon in Białystok, we use the latest methods — from microblading to powder brows — selecting pigments individually to match each client\'s skin tone. Results last from 1 to 3 years, depending on skin type and aftercare.',
      ru: 'Перманентный макияж — это техника микроигольной пигментации кожи, которая создаёт эффект идеально выполненного ежедневного макияжа. В нашем салоне в Белостоке мы используем новейшие методы — от микроблейдинга до пудровой техники — подбирая пигменты индивидуально под тон кожи каждой клиентки. Результат сохраняется от 1 до 3 лет в зависимости от типа кожи и ухода.',
    },
    procedureSteps: [
      {
        title: { pl: 'Konsultacja i projekt kształtu', en: 'Consultation & shape design', ru: 'Консультация и проектирование формы' },
        description: { pl: 'Omawiamy Twoje oczekiwania, analizujemy rysy twarzy i rysujemy projekt kształtu brwi lub ust kredką kosmetyczną. Dopasowujemy kolor pigmentu do Twojego typu urody.', en: 'We discuss your expectations, analyze facial features and draw the brow or lip shape with a cosmetic pencil. We match the pigment color to your beauty type.', ru: 'Обсуждаем ваши ожидания, анализируем черты лица и рисуем контур бровей или губ косметическим карандашом. Подбираем цвет пигмента под ваш тип внешности.' },
      },
      {
        title: { pl: 'Znieczulenie', en: 'Anesthesia', ru: 'Обезболивание' },
        description: { pl: 'Nakładamy krem znieczulający, który działa 15–20 minut. Dzięki temu zabieg jest komfortowy i praktycznie bezbolesny.', en: 'We apply a numbing cream that works for 15–20 minutes. This makes the procedure comfortable and virtually painless.', ru: 'Наносим обезболивающий крем, который действует 15–20 минут. Благодаря этому процедура комфортная и практически безболезненная.' },
      },
      {
        title: { pl: 'Pigmentacja', en: 'Pigmentation', ru: 'Пигментация' },
        description: { pl: 'Za pomocą specjalnego urządzenia wprowadzamy pigment pod skórę na głębokość 0,5–1 mm. Cały proces trwa około 1,5–2 godzin w zależności od obszaru.', en: 'Using a specialized device, we introduce pigment under the skin at a depth of 0.5–1 mm. The entire process takes about 1.5–2 hours depending on the area.', ru: 'С помощью специального аппарата вводим пигмент под кожу на глубину 0,5–1 мм. Весь процесс занимает около 1,5–2 часов в зависимости от области.' },
      },
      {
        title: { pl: 'Instrukcja pielęgnacji', en: 'Aftercare instructions', ru: 'Инструкция по уходу' },
        description: { pl: 'Po zabiegu otrzymujesz szczegółową instrukcję pielęgnacji. Pełne gojenie trwa 4–6 tygodni, a po tym czasie umawiamy się na bezpłatną korektę.', en: 'After the procedure, you receive detailed care instructions. Full healing takes 4–6 weeks, after which we schedule a free touch-up.', ru: 'После процедуры вы получаете подробную инструкцию по уходу. Полное заживление занимает 4–6 недель, после чего мы назначаем бесплатную коррекцию.' },
      },
    ],
    contraindications: [
      { pl: 'Ciąża i okres karmienia piersią', en: 'Pregnancy and breastfeeding', ru: 'Беременность и кормление грудью' },
      { pl: 'Cukrzyca', en: 'Diabetes', ru: 'Сахарный диабет' },
      { pl: 'Choroby autoimmunologiczne', en: 'Autoimmune diseases', ru: 'Аутоиммунные заболевания' },
      { pl: 'Aktywne stany zapalne skóry w obszarze zabiegu', en: 'Active skin inflammation in the treatment area', ru: 'Активные воспаления кожи в области процедуры' },
      { pl: 'Epilepsja', en: 'Epilepsy', ru: 'Эпилепсия' },
      { pl: 'Skłonność do bliznowców (keloidów)', en: 'Tendency to keloid scarring', ru: 'Склонность к келоидным рубцам' },
      { pl: 'Przyjmowanie leków rozrzedzających krew', en: 'Taking blood-thinning medications', ru: 'Приём препаратов, разжижающих кровь' },
    ],
    pricingLink: {
      text: { pl: 'Zobacz pełny cennik makijażu permanentnego', en: 'View full permanent makeup price list', ru: 'Смотреть полный прайс-лист перманентного макияжа' },
      url: '/prices',
    },
    showEffectsGallery: true,
  },

  // 2. Stylizacja rzęs
  {
    slug: 'stylizacja-rzes-bialystok',
    category: 'Stylizacja rzęs',
    imageKey: 'lashes',
    hero: {
      title: {
        pl: 'Stylizacja i Przedłużanie Rzęs w Białymstoku',
        en: 'Lash Styling & Extensions in Białystok',
        ru: 'Наращивание и стилизация ресниц в Белостоке',
      },
      subtitle: {
        pl: 'Rzęsy 1:1, objętościowe 2-6D, laminacja i lifting. Efekt głębokiego spojrzenia.',
        en: 'Classic 1:1, volume 2-6D, lamination and lifting. Deep gaze effect.',
        ru: 'Ресницы 1:1, объёмные 2-6D, ламинирование и лифтинг. Эффект глубокого взгляда.',
      },
    },
    seo: {
      title: {
        pl: 'Przedłużanie Rzęs Białystok — 1:1, Objętościowe, Laminacja | Katarzyna Brui',
        en: 'Lash Extensions Białystok — Classic, Volume, Lamination | Katarzyna Brui',
        ru: 'Наращивание ресниц Белосток — Классика, Объём, Ламинирование | Катажина Бруи',
      },
      description: {
        pl: 'Profesjonalne przedłużanie rzęs 1:1, objętościowe 2-6D, laminacja i lifting rzęs w Białymstoku. Naturalny efekt, trwałość do 4 tygodni. Umów wizytę — Salon Katarzyna Brui.',
        en: 'Professional lash extensions 1:1, volume 2-6D, lamination and lash lifting in Białystok. Natural effect, lasts up to 4 weeks. Book now — Katarzyna Brui Salon.',
        ru: 'Профессиональное наращивание ресниц 1:1, объёмное 2-6D, ламинирование и лифтинг ресниц в Белостоке. Натуральный эффект, стойкость до 4 недель. Запишитесь — Салон Катажина Бруи.',
      },
      keywords: {
        pl: 'stylizacja rzęs Białystok, przedłużanie rzęs Białystok, rzęsy objętościowe Białystok, rzęsy 1:1, rzęsy 2D, rzęsy 3D, Hollywood effect, Kim Kardashian style, najlepsza stylizacja rzęs Białystok, laminacja rzęs Białystok, lifting rzęs Białystok, botoks rzęs Białystok, cena przedłużania rzęs',
        en: 'lash extensions Białystok, lash styling, classic lashes, volume lashes, lash lamination, lash lift, lash extensions price',
        ru: 'наращивание ресниц Белосток, стилизация ресниц, ресницы 1:1, объёмные ресницы, ламинирование ресниц, лифтинг ресниц',
      },
    },
    intro: {
      pl: 'W salonie Katarzyna Brui w Białymstoku oferujemy pełen zakres usług stylizacji rzęs. Od klasycznego przedłużania 1:1 po efektowne rzęsy objętościowe 2-6D. Wykonujemy również laminację i lifting rzęs z botoxem — idealne rozwiązanie dla osób preferujących naturalny wygląd. Używamy wyłącznie certyfikowanych materiałów, które są bezpieczne dla oczu i nie obciążają naturalnych rzęs.',
      en: 'At Katarzyna Brui salon in Białystok, we offer a full range of lash styling services. From classic 1:1 extensions to stunning volume 2-6D lashes. We also perform lash lamination and lifting with botox — perfect for those who prefer a natural look. We use only certified materials that are safe for eyes and do not damage natural lashes.',
      ru: 'В салоне Катажина Бруи в Белостоке мы предлагаем полный спектр услуг по стилизации ресниц. От классического наращивания 1:1 до эффектных объёмных ресниц 2-6D. Мы также выполняем ламинирование и лифтинг ресниц с ботоксом — идеальное решение для тех, кто предпочитает естественный вид. Используем только сертифицированные материалы, безопасные для глаз.',
    },
    benefits: [
      { pl: 'Szeroki wybór metod: 1:1, 2D, 3D, Russian Volume', en: 'Wide range of methods: 1:1, 2D, 3D, Russian Volume', ru: 'Широкий выбор методов: 1:1, 2D, 3D, Russian Volume' },
      { pl: 'Hipoalergiczne kleje i materiały', en: 'Hypoallergenic glues and materials', ru: 'Гипоаллергенные клеи и материалы' },
      { pl: 'Efekt trwały do 4 tygodni', en: 'Effect lasting up to 4 weeks', ru: 'Эффект держится до 4 недель' },
      { pl: 'Dobieramy styl do kształtu oka', en: 'We match the style to your eye shape', ru: 'Подбираем стиль под форму глаз' },
      { pl: 'Bezpłatna konsultacja przed zabiegiem', en: 'Free consultation before the treatment', ru: 'Бесплатная консультация перед процедурой' },
    ],
    faq: [
      {
        question: 'Ile kosztuje przedłużanie rzęs w Białymstoku?',
        question_en: 'How much do lash extensions cost in Białystok?',
        question_ru: 'Сколько стоит наращивание ресниц в Белостоке?',
        answer: 'Ceny przedłużania rzęs zaczynają się od 100 PLN za metodę 1:1. Rzęsy objętościowe kosztują od 150 PLN. Uzupełnienie to koszt od 80 PLN. Dokładny cennik znajdziesz na stronie z usługami.',
        answer_en: 'Lash extension prices start from 100 PLN for classic 1:1 method. Volume lashes from 150 PLN. Refill from 80 PLN. Full price list available on our services page.',
        answer_ru: 'Цены на наращивание ресниц начинаются от 100 PLN за классический метод 1:1. Объёмные ресницы от 150 PLN. Коррекция от 80 PLN. Полный прайс-лист на странице услуг.',
      },
      {
        question: 'Jak długo trwa przedłużanie rzęs?',
        question_en: 'How long does lash extension take?',
        question_ru: 'Сколько длится наращивание ресниц?',
        answer: 'Zabieg przedłużania rzęs trwa od 1,5 do 2,5 godziny w zależności od wybranej metody. Uzupełnienie zajmuje około 1-1,5 godziny.',
        answer_en: 'Lash extension takes 1.5 to 2.5 hours depending on the chosen method. A refill takes about 1-1.5 hours.',
        answer_ru: 'Процедура наращивания ресниц длится от 1,5 до 2,5 часов в зависимости от выбранного метода. Коррекция занимает около 1-1,5 часа.',
      },
      {
        question: 'Czy przedłużanie rzęs niszczy naturalne rzęsy?',
        question_en: 'Do lash extensions damage natural lashes?',
        question_ru: 'Повреждает ли наращивание натуральные ресницы?',
        answer: 'Przy profesjonalnym wykonaniu i odpowiedniej pielęgnacji, przedłużanie rzęs nie niszczy naturalnych rzęs. Stosujemy odpowiednio dobrane obciążenie i wysokiej jakości materiały.',
        answer_en: 'When done professionally and with proper care, lash extensions do not damage natural lashes. We use appropriately matched weights and high-quality materials.',
        answer_ru: 'При профессиональном выполнении и правильном уходе наращивание не повреждает натуральные ресницы. Мы используем подходящую нагрузку и качественные материалы.',
      },
      {
        question: 'Jak przygotować się do przedłużania rzęs?',
        question_en: 'How to prepare for lash extensions?',
        question_ru: 'Как подготовиться к наращиванию ресниц?',
        answer: 'Przyjdź bez makijażu oczu i tuszem do rzęs. Nie używaj olejowych demakijaży 24 godziny przed wizytą, ponieważ olej osłabia przyczepność kleju. Jeśli nosisz soczewki kontaktowe, wyjmij je przed zabiegiem. Zabieg polega na leżeniu z zamkniętymi oczami przez 1,5-2,5 godziny — możesz przynieść słuchawki.',
        answer_en: 'Come without eye makeup or mascara. Avoid oil-based makeup removers 24 hours before your appointment, as oil weakens glue adhesion. If you wear contact lenses, remove them before the treatment. The procedure involves lying with closed eyes for 1.5-2.5 hours — you are welcome to bring headphones.',
        answer_ru: 'Приходите без макияжа глаз и туши. Не используйте масляные средства для демакияжа за 24 часа до визита, так как масло ослабляет сцепление клея. Если носите контактные линзы, снимите их перед процедурой. Во время процедуры вы лежите с закрытыми глазами 1,5-2,5 часа — можете принести наушники.',
      },
      {
        question: 'Jakie są przeciwwskazania do przedłużania rzęs?',
        question_en: 'What are the contraindications for lash extensions?',
        question_ru: 'Какие противопоказания к наращиванию ресниц?',
        answer: 'Przeciwwskazania obejmują: aktywne infekcje oczu (zapalenie spojówek, jęczmień), alergie na klej cyjanoakrylowy, choroby skóry powiek (łuszczyca, egzema), niedawne zabiegi laserowe w okolicy oczu oraz chemioterapię. W przypadku wątpliwości zalecamy konsultację przed wizytą.',
        answer_en: 'Contraindications include: active eye infections (conjunctivitis, stye), allergy to cyanoacrylate glue, eyelid skin conditions (psoriasis, eczema), recent laser treatments around the eyes, and chemotherapy. If in doubt, we recommend a consultation before your appointment.',
        answer_ru: 'Противопоказания включают: активные инфекции глаз (конъюнктивит, ячмень), аллергию на цианоакрилатный клей, заболевания кожи век (псориаз, экзема), недавние лазерные процедуры в области глаз и химиотерапию. При сомнениях рекомендуем консультацию перед визитом.',
      },
      {
        question: 'Jak pielęgnować rzęsy po przedłużeniu?',
        question_en: 'How to care for lash extensions?',
        question_ru: 'Как ухаживать за ресницами после наращивания?',
        answer: 'Przez pierwsze 24 godziny unikaj kontaktu z wodą i parą. Nie używaj tłustych kremów ani olejowych demakijaży w okolicy oczu. Czesz rzęsy specjalną szczoteczką codziennie rano. Unikaj pocierania oczu i spania na brzuchu. Dzięki odpowiedniej pielęgnacji efekt trwa do 4 tygodni.',
        answer_en: 'Avoid water and steam contact for the first 24 hours. Do not use oily creams or oil-based removers around the eyes. Brush your lashes with a special spoolie brush every morning. Avoid rubbing your eyes and sleeping face down. With proper care, the effect lasts up to 4 weeks.',
        answer_ru: 'В первые 24 часа избегайте контакта с водой и паром. Не используйте жирные кремы и масляные средства для демакияжа в области глаз. Расчёсывайте ресницы специальной щёточкой каждое утро. Не трите глаза и не спите лицом в подушку. При правильном уходе эффект держится до 4 недель.',
      },
    ],
    cta: {
      text: {
        pl: 'Gotowa na piękne rzęsy? Zarezerwuj termin!',
        en: 'Ready for beautiful lashes? Book your appointment!',
        ru: 'Готовы к красивым ресницам? Запишитесь!',
      },
      link: '/services',
    },
    extendedIntro: {
      pl: 'Stylizacja rzęs to zabieg, który podkreśli głębię Twojego spojrzenia bez konieczności codziennego nakładania tuszu. W salonie Katarzyna Brui w Białymstoku oferujemy różne techniki — od klasycznego przedłużania po efekt 2D, 3D i objętość rosyjską. Każdy zestaw jest dopasowywany do naturalnego kształtu oka i oczekiwań klientki.',
      en: 'Lash styling is a treatment that enhances the depth of your gaze without the need for daily mascara application. At Katarzyna Brui salon in Białystok, we offer various techniques — from classic extensions to 2D, 3D and Russian volume effects. Each set is matched to the natural eye shape and client expectations.',
      ru: 'Стилизация ресниц — это процедура, которая подчеркнёт глубину вашего взгляда без необходимости ежедневного нанесения туши. В салоне Катажина Бруи в Белостоке мы предлагаем различные техники — от классического наращивания до эффектов 2D, 3D и русского объёма. Каждый набор подбирается под естественную форму глаза и ожидания клиентки.',
    },
    procedureSteps: [
      {
        title: { pl: 'Konsultacja i dobór efektu', en: 'Consultation & effect selection', ru: 'Консультация и подбор эффекта' },
        description: { pl: 'Omawiamy pożądany efekt — naturalny, dramatyczny czy lisi. Dobieramy długość, grubość i skręt rzęs do kształtu Twoich oczu.', en: 'We discuss the desired effect — natural, dramatic or fox eye. We select lash length, thickness and curl to match your eye shape.', ru: 'Обсуждаем желаемый эффект — натуральный, драматичный или лисий. Подбираем длину, толщину и изгиб ресниц под форму ваших глаз.' },
      },
      {
        title: { pl: 'Przygotowanie rzęs naturalnych', en: 'Natural lash preparation', ru: 'Подготовка натуральных ресниц' },
        description: { pl: 'Oczyszczamy rzęsy ze śladów makijażu i sebum. Nakładamy plastry ochronne na dolne rzęsy, aby izolować każde oko.', en: 'We cleanse lashes of makeup residue and sebum. Protective pads are applied to lower lashes to isolate each eye.', ru: 'Очищаем ресницы от остатков макияжа и кожного жира. Накладываем защитные патчи на нижние ресницы для изоляции каждого глаза.' },
      },
      {
        title: { pl: 'Aplikacja rzęs', en: 'Lash application', ru: 'Наращивание ресниц' },
        description: { pl: 'Każda sztuczna rzęsa jest przyklejana do naturalnej za pomocą specjalnego kleju medycznego. Zabieg trwa 1,5–2,5 godziny w zależności od wybranej techniki.', en: 'Each artificial lash is bonded to a natural one using specialized medical-grade adhesive. The procedure takes 1.5–2.5 hours depending on the technique.', ru: 'Каждая искусственная ресница приклеивается к натуральной с помощью специального медицинского клея. Процедура длится 1,5–2,5 часа в зависимости от техники.' },
      },
      {
        title: { pl: 'Kontrola i utrwalenie', en: 'Final check & setting', ru: 'Проверка и закрепление' },
        description: { pl: 'Sprawdzamy równomierność aplikacji, rozdzielamy sklejone rzęsy i utrwalamy efekt. Przekazujemy wskazówki dotyczące pielęgnacji.', en: 'We check application uniformity, separate any stuck lashes and set the result. We provide aftercare guidelines.', ru: 'Проверяем равномерность нанесения, разделяем склеенные ресницы и закрепляем результат. Даём рекомендации по уходу.' },
      },
    ],
    contraindications: [
      { pl: 'Alergia na klej cyjanoakrylowy', en: 'Allergy to cyanoacrylate adhesive', ru: 'Аллергия на цианоакрилатный клей' },
      { pl: 'Infekcje oczu (zapalenie spojówek, jęczmień)', en: 'Eye infections (conjunctivitis, stye)', ru: 'Инфекции глаз (конъюнктивит, ячмень)' },
      { pl: 'Chemioterapia lub radioterapia', en: 'Chemotherapy or radiotherapy', ru: 'Химиотерапия или лучевая терапия' },
      { pl: 'Choroby skóry powiek (egzema, łuszczyca)', en: 'Eyelid skin diseases (eczema, psoriasis)', ru: 'Заболевания кожи век (экзема, псориаз)' },
      { pl: 'Niedawny zabieg laserowy na oczy', en: 'Recent eye laser surgery', ru: 'Недавняя лазерная операция на глаза' },
    ],
    pricingLink: {
      text: { pl: 'Zobacz cennik stylizacji rzęs', en: 'View lash styling price list', ru: 'Смотреть прайс-лист стилизации ресниц' },
      url: '/prices',
    },
    showEffectsGallery: true,
  },

  // 3. Laminacja brwi
  {
    slug: 'laminacja-brwi-bialystok',
    category: 'Pielęgnacja brwi',
    imageKey: 'browCare',
    hero: {
      title: {
        pl: 'Laminacja i Pielęgnacja Brwi w Białymstoku',
        en: 'Brow Lamination & Care in Białystok',
        ru: 'Ламинирование и уход за бровями в Белостоке',
      },
      subtitle: {
        pl: 'Laminacja, henna, regulacja, botox brwi — idealny kształt bez makijażu.',
        en: 'Lamination, henna, shaping, brow botox — perfect shape without makeup.',
        ru: 'Ламинирование, хна, коррекция, ботокс бровей — идеальная форма без макияжа.',
      },
    },
    seo: {
      title: {
        pl: 'Laminacja Brwi Białystok — Henna, Regulacja, Botox | Katarzyna Brui',
        en: 'Brow Lamination Białystok — Henna, Shaping, Botox | Katarzyna Brui',
        ru: 'Ламинирование бровей Белосток — Хна, Коррекция, Ботокс | Катажина Бруи',
      },
      description: {
        pl: 'Profesjonalna laminacja brwi, henna pudrowa, regulacja i botox brwi w Białymstoku. Idealnie ułożone brwi do 8 tygodni. Umów wizytę w salonie Katarzyna Brui.',
        en: 'Professional brow lamination, powder henna, shaping and brow botox in Białystok. Perfectly styled brows for up to 8 weeks. Book at Katarzyna Brui salon.',
        ru: 'Профессиональное ламинирование бровей, хна, коррекция и ботокс бровей в Белостоке. Идеально уложенные брови до 8 недель. Запишитесь в салон Катажина Бруи.',
      },
      keywords: {
        pl: 'stylizacja brwi Białystok, laminacja brwi Białystok, henna pudrowa Białystok, regulacja brwi Białystok, architektura i geometria brwi, farbka do brwi, botoks brwi, nitkowanie brwi Białystok, najlepsza stylizacja brwi opinie, cena laminacji brwi',
        en: 'brow lamination Białystok, brow henna, brow shaping, brow botox, brow care, powder henna, brow styling',
        ru: 'ламинирование бровей Белосток, хна бровей, коррекция бровей, ботокс бровей, уход за бровями',
      },
    },
    intro: {
      pl: 'Zadbane brwi to podstawa wyrazistego spojrzenia. W salonie Katarzyna Brui w Białymstoku oferujemy kompleksową pielęgnację brwi — od profesjonalnej regulacji i koloryzacji henną pudrową, przez laminację nadającą idealny kształt, aż po botox brwi odżywiający i wzmacniający włoski. Każdy zabieg dostosowujemy indywidualnie do kształtu Twojej twarzy.',
      en: 'Well-groomed brows are the foundation of an expressive gaze. At Katarzyna Brui salon in Białystok, we offer comprehensive brow care — from professional shaping and powder henna coloring, through lamination for the perfect shape, to brow botox that nourishes and strengthens the hairs. Each treatment is individually tailored to your face shape.',
      ru: 'Ухоженные брови — основа выразительного взгляда. В салоне Катажина Бруи в Белостоке мы предлагаем комплексный уход за бровями — от профессиональной коррекции и окрашивания хной, через ламинирование для идеальной формы, до ботокса бровей, питающего и укрепляющего волоски. Каждую процедуру подбираем индивидуально.',
    },
    benefits: [
      { pl: 'Efekt idealnie ułożonych brwi do 8 tygodni', en: 'Perfectly styled brows for up to 8 weeks', ru: 'Идеально уложенные брови до 8 недель' },
      { pl: 'Naturalne produkty do koloryzacji', en: 'Natural coloring products', ru: 'Натуральные продукты для окрашивания' },
      { pl: 'Indywidualny dobór kształtu do twarzy', en: 'Individual shape selection for your face', ru: 'Индивидуальный подбор формы к лицу' },
      { pl: 'Bezbolesna regulacja woskiem i pęsetą', en: 'Painless wax and tweezer shaping', ru: 'Безболезненная коррекция воском и пинцетом' },
    ],
    faq: [
      {
        question: 'Czym jest laminacja brwi i ile trwa efekt?',
        question_en: 'What is brow lamination and how long does it last?',
        question_ru: 'Что такое ламинирование бровей и сколько держится эффект?',
        answer: 'Laminacja brwi to zabieg, który nadaje brwiom pożądany kształt i kierunek. Efekt utrzymuje się od 6 do 8 tygodni. Zabieg jest bezbolesny i trwa około 45 minut.',
        answer_en: 'Brow lamination is a treatment that gives brows the desired shape and direction. The effect lasts 6 to 8 weeks. The treatment is painless and takes about 45 minutes.',
        answer_ru: 'Ламинирование бровей — это процедура, которая придаёт бровям желаемую форму и направление. Эффект сохраняется от 6 до 8 недель. Процедура безболезненна и длится около 45 минут.',
      },
      {
        question: 'Czy henna brwi jest bezpieczna?',
        question_en: 'Is brow henna safe?',
        question_ru: 'Безопасна ли хна для бровей?',
        answer: 'Tak, stosujemy certyfikowaną hennę pudrową, która jest bezpieczna dla skóry. Przed zabiegiem wykonujemy test alergiczny. Henna nadaje naturalny kolor i utrzymuje się 2-4 tygodnie.',
        answer_en: 'Yes, we use certified powder henna that is safe for the skin. We perform an allergy test before the treatment. Henna gives a natural color and lasts 2-4 weeks.',
        answer_ru: 'Да, мы используем сертифицированную хну, безопасную для кожи. Перед процедурой проводим тест на аллергию. Хна придаёт натуральный цвет и держится 2-4 недели.',
      },
      {
        question: 'Ile kosztuje laminacja brwi w Białymstoku?',
        question_en: 'How much does brow lamination cost in Białystok?',
        question_ru: 'Сколько стоит ламинирование бровей в Белостоке?',
        answer: 'Ceny laminacji brwi w naszym salonie zaczynają się od 120 PLN. Pakiet laminacja + henna + regulacja dostępny jest w promocyjnej cenie. Szczegóły w cenniku usług.',
        answer_en: 'Brow lamination prices at our salon start from 120 PLN. A lamination + henna + shaping package is available at a promotional price. See our services price list for details.',
        answer_ru: 'Цены на ламинирование бровей в нашем салоне начинаются от 120 PLN. Пакет ламинирование + хна + коррекция доступен по акционной цене. Подробности в прайс-листе.',
      },
      {
        question: 'Jak przygotować się do laminacji brwi?',
        question_en: 'How to prepare for brow lamination?',
        question_ru: 'Как подготовиться к ламинированию бровей?',
        answer: 'Przed zabiegiem nie reguluj brwi przez 2-3 tygodnie, aby stylistka mogła nadać im optymalny kształt. Unikaj opalania twarzy i peelingów w okolicy brwi na 48 godzin przed wizytą. Przyjdź z czystą skórą bez makijażu w strefie brwi.',
        answer_en: 'Do not shape or pluck your brows for 2-3 weeks before the treatment, so the stylist can create the optimal shape. Avoid facial tanning and peels around the brow area 48 hours before your appointment. Come with clean skin and no makeup in the brow zone.',
        answer_ru: 'Не выщипывайте брови за 2-3 недели до процедуры, чтобы стилист мог придать им оптимальную форму. Избегайте загара лица и пилингов в области бровей за 48 часов до визита. Приходите с чистой кожей без макияжа в зоне бровей.',
      },
      {
        question: 'Jakie są przeciwwskazania do laminacji brwi?',
        question_en: 'What are the contraindications for brow lamination?',
        question_ru: 'Какие противопоказания к ламинированию бровей?',
        answer: 'Laminacja brwi nie jest zalecana przy: aktywnych stanach zapalnych skóry w okolicy brwi, alergiach na składniki preparatu (zalecamy test uczuleniowy), świeżym makijażu permanentnym brwi (należy odczekać min. 4 tygodnie), ciąży (pierwszy trymestr) oraz po niedawnych zabiegach laserowych twarzy.',
        answer_en: 'Brow lamination is not recommended for: active skin inflammation in the brow area, allergies to product ingredients (we recommend a patch test), fresh permanent brow makeup (wait at least 4 weeks), first trimester of pregnancy, and after recent facial laser treatments.',
        answer_ru: 'Ламинирование бровей не рекомендуется при: активных воспалениях кожи в области бровей, аллергии на компоненты препарата (рекомендуем тест на аллергию), свежем перманентном макияже бровей (подождите минимум 4 недели), первом триместре беременности и после недавних лазерных процедур лица.',
      },
      {
        question: 'Jak pielęgnować brwi po laminacji?',
        question_en: 'How to care for brows after lamination?',
        question_ru: 'Как ухаживать за бровями после ламинирования?',
        answer: 'Przez 24 godziny po zabiegu nie moczyć brwi, nie stosować makijażu ani kremów w okolicy brwi. Nie dotykaj i nie pocieraj brwi. Po tym czasie możesz nakładać olejek do brwi, który odżywi włoski i przedłuży efekt. Unikaj sauny i basenu przez 48 godzin.',
        answer_en: 'Do not wet your brows, apply makeup or creams around the brow area for 24 hours after the treatment. Avoid touching or rubbing your brows. After that time, you can apply brow oil to nourish the hairs and extend the effect. Avoid saunas and swimming pools for 48 hours.',
        answer_ru: 'В течение 24 часов после процедуры не мочите брови, не наносите макияж и кремы в области бровей. Не трогайте и не трите брови. После этого можно наносить масло для бровей, которое питает волоски и продлевает эффект. Избегайте сауны и бассейна в течение 48 часов.',
      },
    ],
    cta: {
      text: {
        pl: 'Chcesz idealne brwi? Zarezerwuj wizytę!',
        en: 'Want perfect brows? Book your visit!',
        ru: 'Хотите идеальные брови? Запишитесь!',
      },
      link: '/services',
    },
    extendedIntro: {
      pl: 'Laminacja brwi to nowoczesny zabieg modelowania, który nadaje brwiom pożądany kształt i kierunek włosków. W połączeniu z koloryzacją i odżywianiem keratyną zapewnia efekt zadbanych, pełnych brwi na 6–8 tygodni. To idealna alternatywa dla osób, które chcą piękne brwi bez makijażu permanentnego.',
      en: 'Brow lamination is a modern shaping treatment that gives brows the desired shape and hair direction. Combined with tinting and keratin nourishment, it provides the effect of well-groomed, full brows for 6–8 weeks. It\'s the perfect alternative for those who want beautiful brows without permanent makeup.',
      ru: 'Ламинирование бровей — это современная процедура моделирования, которая придаёт бровям желаемую форму и направление волосков. В сочетании с окрашиванием и кератиновым питанием обеспечивает эффект ухоженных, густых бровей на 6–8 недель. Это идеальная альтернатива для тех, кто хочет красивые брови без перманентного макияжа.',
    },
    procedureSteps: [
      {
        title: { pl: 'Oczyszczenie i analiza', en: 'Cleansing & analysis', ru: 'Очищение и анализ' },
        description: { pl: 'Oczyszczamy skórę brwi z makijażu i sebum. Analizujemy naturalny wzrost i omawiamy pożądany kształt.', en: 'We cleanse brow skin of makeup and sebum. We analyze the natural growth pattern and discuss the desired shape.', ru: 'Очищаем кожу бровей от макияжа и кожного жира. Анализируем естественный рост и обсуждаем желаемую форму.' },
      },
      {
        title: { pl: 'Nałożenie składu zmiękczającego', en: 'Softening solution application', ru: 'Нанесение смягчающего состава' },
        description: { pl: 'Nakładamy specjalny skład, który zmiękcza włoski i pozwala nadać im nowy kierunek. Czas działania: 8–12 minut.', en: 'We apply a special formula that softens the hairs and allows reshaping their direction. Processing time: 8–12 minutes.', ru: 'Наносим специальный состав, который смягчает волоски и позволяет изменить их направление. Время воздействия: 8–12 минут.' },
      },
      {
        title: { pl: 'Modelowanie i utrwalenie', en: 'Shaping & setting', ru: 'Моделирование и фиксация' },
        description: { pl: 'Układamy włoski w pożądanym kierunku i nakładamy skład utrwalający. Opcjonalnie wykonujemy koloryzację henną lub farbą.', en: 'We shape the hairs in the desired direction and apply a setting solution. Optionally, we perform tinting with henna or dye.', ru: 'Укладываем волоски в нужном направлении и наносим фиксирующий состав. По желанию выполняем окрашивание хной или краской.' },
      },
      {
        title: { pl: 'Odżywienie keratyną', en: 'Keratin nourishment', ru: 'Кератиновое питание' },
        description: { pl: 'Na zakończenie nakładamy odżywkę keratynową, która wzmacnia i nawilża włoski. Efekt jest widoczny od razu po zabiegu.', en: 'To finish, we apply a keratin conditioner that strengthens and moisturizes the hairs. The effect is visible immediately after treatment.', ru: 'В завершение наносим кератиновый кондиционер, который укрепляет и увлажняет волоски. Эффект виден сразу после процедуры.' },
      },
    ],
    contraindications: [
      { pl: 'Świeży makijaż permanentny brwi (poniżej 4 tygodni)', en: 'Fresh permanent brow makeup (under 4 weeks)', ru: 'Свежий перманентный макияж бровей (менее 4 недель)' },
      { pl: 'Stany zapalne skóry w okolicy brwi', en: 'Skin inflammation around the brow area', ru: 'Воспаления кожи в области бровей' },
      { pl: 'Alergia na składniki preparatów do laminacji', en: 'Allergy to lamination product ingredients', ru: 'Аллергия на компоненты препаратов для ламинирования' },
      { pl: 'Ciąża (I trymestr)', en: 'Pregnancy (1st trimester)', ru: 'Беременность (I триместр)' },
      { pl: 'Rany lub podrażnienia w okolicy brwi', en: 'Wounds or irritation in the brow area', ru: 'Раны или раздражения в области бровей' },
    ],
    pricingLink: {
      text: { pl: 'Zobacz cennik zabiegów na brwi', en: 'View brow treatment price list', ru: 'Смотреть прайс-лист процедур для бровей' },
      url: '/prices',
    },
    showEffectsGallery: true,
  },

  // 4. Peeling węglowy
  {
    slug: 'peeling-weglowy-bialystok',
    category: 'Peeling węglowy',
    imageKey: 'carbonPeeling',
    hero: {
      title: {
        pl: 'Peeling Węglowy w Białymstoku',
        en: 'Carbon Peeling in Białystok',
        ru: 'Карбоновый пилинг в Белостоке',
      },
      subtitle: {
        pl: 'Głębokie oczyszczanie, odmładzanie i redukcja porów laserowym peelingiem węglowym.',
        en: 'Deep cleansing, rejuvenation and pore reduction with laser carbon peeling.',
        ru: 'Глубокое очищение, омоложение и сужение пор лазерным карбоновым пилингом.',
      },
    },
    seo: {
      title: {
        pl: 'Peeling Węglowy Białystok — Laserowe Oczyszczanie Skóry | Katarzyna Brui',
        en: 'Carbon Peeling Białystok — Laser Skin Cleansing | Katarzyna Brui',
        ru: 'Карбоновый пилинг Белосток — Лазерное очищение кожи | Катажина Бруи',
      },
      description: {
        pl: 'Peeling węglowy laserowy w Białymstoku. Głębokie oczyszczanie, redukcja porów, odmładzanie skóry. Natychmiastowy efekt po jednym zabiegu. Umów wizytę — Salon Katarzyna Brui.',
        en: 'Laser carbon peeling in Białystok. Deep cleansing, pore reduction, skin rejuvenation. Immediate results after one treatment. Book now — Katarzyna Brui Salon.',
        ru: 'Лазерный карбоновый пилинг в Белостоке. Глубокое очищение, сужение пор, омоложение кожи. Мгновенный результат после одной процедуры. Запишитесь — Салон Катажина Бруи.',
      },
      keywords: {
        pl: 'peeling węglowy Białystok, carbon peeling Białystok, laserowy peeling węglowy, czarna lalka, zabieg bankietowy, oczyszczanie twarzy laserem, peeling węglowy efekty, peeling węglowy cena, peeling węglowy opinie, peeling węglowy na trądzik, zwężanie porów',
        en: 'carbon peeling Białystok, laser skin cleansing, carbon peel price, facial cleansing Białystok',
        ru: 'карбоновый пилинг Белосток, лазерное очищение кожи, карбоновый пилинг цена, очищение лица Белосток',
      },
    },
    intro: {
      pl: 'Peeling węglowy to nowoczesny zabieg laserowy, który w jednej sesji oczyszcza, wygładza i odmładza skórę. W salonie Katarzyna Brui w Białymstoku wykonujemy go z użyciem profesjonalnego lasera Nd:YAG. Zabieg jest bezbolesny i nie wymaga rekonwalescencji — możesz wrócić do codziennych zajęć natychmiast po wizycie. Idealny dla osób z rozszerzonymi porami, trądzikiem lub matową cerą.',
      en: 'Carbon peeling is a modern laser treatment that cleanses, smooths and rejuvenates the skin in one session. At Katarzyna Brui salon in Białystok, we perform it using a professional Nd:YAG laser. The treatment is painless and requires no downtime — you can return to daily activities immediately. Perfect for enlarged pores, acne or dull skin.',
      ru: 'Карбоновый пилинг — это современная лазерная процедура, которая за одну сессию очищает, разглаживает и омолаживает кожу. В салоне Катажина Бруи в Белостоке мы выполняем её с использованием профессионального лазера Nd:YAG. Процедура безболезненна и не требует восстановления — вы можете вернуться к обычным делам сразу после визита.',
    },
    benefits: [
      { pl: 'Natychmiastowy efekt po pierwszym zabiegu', en: 'Immediate results after first treatment', ru: 'Мгновенный результат после первой процедуры' },
      { pl: 'Bezbolesny — bez okresu rekonwalescencji', en: 'Painless — no downtime required', ru: 'Безболезненно — без периода восстановления' },
      { pl: 'Redukcja porów i wygładzenie skóry', en: 'Pore reduction and skin smoothing', ru: 'Сужение пор и разглаживание кожи' },
      { pl: 'Stymulacja produkcji kolagenu', en: 'Stimulation of collagen production', ru: 'Стимуляция выработки коллагена' },
    ],
    faq: [
      {
        question: 'Dla kogo jest peeling węglowy?',
        question_en: 'Who is carbon peeling for?',
        question_ru: 'Для кого подходит карбоновый пилинг?',
        answer: 'Peeling węglowy jest idealny dla osób z rozszerzonymi porami, skórą trądzikową, przebarwieniami, matową cerą oraz oznakami starzenia. Nadaje się dla każdego typu skóry.',
        answer_en: 'Carbon peeling is ideal for people with enlarged pores, acne-prone skin, discoloration, dull complexion and signs of aging. It is suitable for all skin types.',
        answer_ru: 'Карбоновый пилинг идеален для людей с расширенными порами, склонной к акне кожей, пигментацией, тусклым цветом лица и признаками старения. Подходит для всех типов кожи.',
      },
      {
        question: 'Ile zabiegów peelingu węglowego potrzeba?',
        question_en: 'How many carbon peeling treatments are needed?',
        question_ru: 'Сколько процедур карбонового пилинга нужно?',
        answer: 'Efekt widoczny jest już po pierwszym zabiegu. Dla optymalnych rezultatów zalecamy serię 4-6 zabiegów w odstępach 2-3 tygodniowych.',
        answer_en: 'Results are visible after the first treatment. For optimal results, we recommend a series of 4-6 treatments at 2-3 week intervals.',
        answer_ru: 'Результат виден уже после первой процедуры. Для оптимальных результатов рекомендуем серию из 4-6 процедур с интервалом 2-3 недели.',
      },
      {
        question: 'Ile kosztuje peeling węglowy w Białymstoku?',
        question_en: 'How much does carbon peeling cost in Białystok?',
        question_ru: 'Сколько стоит карбоновый пилинг в Белостоке?',
        answer: 'Cena pojedynczego zabiegu peelingu węglowego to 150-250 PLN. Oferujemy również pakiety zabiegowe w atrakcyjnych cenach. Szczegóły w cenniku.',
        answer_en: 'A single carbon peeling treatment costs 150-250 PLN. We also offer treatment packages at attractive prices. See our price list for details.',
        answer_ru: 'Стоимость одной процедуры карбонового пилинга составляет 150-250 PLN. Мы также предлагаем пакеты процедур по привлекательным ценам. Подробности в прайс-листе.',
      },
      {
        question: 'Jak przygotować się do peelingu węglowego?',
        question_en: 'How to prepare for carbon peeling?',
        question_ru: 'Как подготовиться к карбоновому пилингу?',
        answer: 'Na 3-5 dni przed zabiegiem unikaj opalania, solarium i samoopalaczy. Nie stosuj retinolu, kwasów AHA/BHA ani silnych peelingów. W dniu zabiegu przyjdź z czystą skórą bez makijażu. Jeśli stosujesz leki dermatologiczne (np. izotretynoinę), poinformuj nas podczas rezerwacji.',
        answer_en: 'Avoid sunbathing, tanning beds and self-tanners 3-5 days before the treatment. Do not use retinol, AHA/BHA acids or strong peels. Come with clean, makeup-free skin on the day of the treatment. If you take dermatological medications (e.g. isotretinoin), let us know when booking.',
        answer_ru: 'За 3-5 дней до процедуры избегайте загара, солярия и автозагара. Не используйте ретинол, кислоты AHA/BHA и сильные пилинги. В день процедуры приходите с чистой кожей без макияжа. Если принимаете дерматологические препараты (например, изотретиноин), сообщите нам при записи.',
      },
      {
        question: 'Jakie są przeciwwskazania do peelingu węglowego?',
        question_en: 'What are the contraindications for carbon peeling?',
        question_ru: 'Какие противопоказания к карбоновому пилингу?',
        answer: 'Przeciwwskazania obejmują: aktywne stany zapalne skóry (opryszczka, ropne trądzik), świeżą opaleniznę, ciążę, przyjmowanie leków fotouczulających, aktywne infekcje skórne, rany otwarte w obszarze zabiegowym oraz stosowanie izotretynoiny w ciągu ostatnich 6 miesięcy.',
        answer_en: 'Contraindications include: active skin inflammation (herpes, pustular acne), fresh suntan, pregnancy, photosensitizing medications, active skin infections, open wounds in the treatment area, and isotretinoin use within the last 6 months.',
        answer_ru: 'Противопоказания включают: активные воспаления кожи (герпес, гнойные акне), свежий загар, беременность, приём фотосенсибилизирующих препаратов, активные кожные инфекции, открытые раны в зоне обработки и применение изотретиноина в течение последних 6 месяцев.',
      },
      {
        question: 'Jak wygląda skóra po peelingu węglowym i jaka jest rekonwalescencja?',
        question_en: 'What does skin look like after carbon peeling and what is the recovery?',
        question_ru: 'Как выглядит кожа после карбонового пилинга и какой период восстановления?',
        answer: 'Bezpośrednio po zabiegu skóra może być lekko zaczerwieniona — to normalna reakcja, która ustępuje w ciągu 1-2 godzin. Nie ma okresu rekonwalescencji — możesz wrócić do codziennych aktywności od razu. Przez 48 godzin stosuj krem z SPF 50 i unikaj bezpośredniego słońca. Efekt rozświetlonej, gładkiej cery widać już po pierwszej sesji.',
        answer_en: 'The skin may be slightly red right after the treatment — this is a normal reaction that subsides within 1-2 hours. There is no downtime — you can return to daily activities immediately. Use SPF 50 cream and avoid direct sunlight for 48 hours. The effect of radiant, smooth skin is visible after the first session.',
        answer_ru: 'Сразу после процедуры кожа может быть слегка покрасневшей — это нормальная реакция, которая проходит в течение 1-2 часов. Периода восстановления нет — вы можете вернуться к обычным делам сразу. В течение 48 часов используйте крем с SPF 50 и избегайте прямых солнечных лучей. Эффект сияющей, гладкой кожи заметен уже после первой процедуры.',
      },
    ],
    cta: {
      text: {
        pl: 'Chcesz promienną cerę? Zarezerwuj zabieg!',
        en: 'Want radiant skin? Book your treatment!',
        ru: 'Хотите сияющую кожу? Запишитесь на процедуру!',
      },
      link: '/services',
    },
    extendedIntro: {
      pl: 'Peeling węglowy (carbon peeling) to innowacyjny zabieg laserowy, który łączy oczyszczanie, złuszczanie i odmładzanie skóry. Specjalna pasta węglowa nałożona na skórę absorbuje zanieczyszczenia i sebum, a następnie laser Nd:YAG precyzyjnie ją odparowuje, pobudzając jednocześnie produkcję kolagenu. Efekt: matowa, czysta i promienna cera od pierwszego zabiegu.',
      en: 'Carbon peeling is an innovative laser treatment that combines cleansing, exfoliation and skin rejuvenation. A special carbon paste applied to the skin absorbs impurities and sebum, then an Nd:YAG laser precisely vaporizes it while stimulating collagen production. Result: matte, clean and radiant skin from the very first session.',
      ru: 'Карбоновый пилинг — это инновационная лазерная процедура, которая сочетает очищение, отшелушивание и омоложение кожи. Специальная карбоновая паста, нанесённая на кожу, абсорбирует загрязнения и кожное сало, затем лазер Nd:YAG точно её испаряет, одновременно стимулируя выработку коллагена. Результат: матовая, чистая и сияющая кожа уже после первой процедуры.',
    },
    procedureSteps: [
      {
        title: { pl: 'Oczyszczenie skóry', en: 'Skin cleansing', ru: 'Очищение кожи' },
        description: { pl: 'Dokładnie oczyszczamy skórę twarzy z makijażu, sebum i zanieczyszczeń. Przygotowujemy skórę do zabiegu.', en: 'We thoroughly cleanse facial skin of makeup, sebum and impurities. We prepare the skin for treatment.', ru: 'Тщательно очищаем кожу лица от макияжа, кожного жира и загрязнений. Подготавливаем кожу к процедуре.' },
      },
      {
        title: { pl: 'Nałożenie pasty węglowej', en: 'Carbon paste application', ru: 'Нанесение карбоновой пасты' },
        description: { pl: 'Równomiernie nakładamy cienką warstwę pasty węglowej na całą twarz. Pasta wnika w pory, absorbując zanieczyszczenia i nadmiar sebum.', en: 'We evenly apply a thin layer of carbon paste to the entire face. The paste penetrates pores, absorbing impurities and excess sebum.', ru: 'Равномерно наносим тонкий слой карбоновой пасты на всё лицо. Паста проникает в поры, абсорбируя загрязнения и избыток кожного сала.' },
      },
      {
        title: { pl: 'Zabieg laserowy', en: 'Laser treatment', ru: 'Лазерная обработка' },
        description: { pl: 'Laser Nd:YAG o długości fali 1064 nm odparowuje pastę wraz z zanieczyszczeniami. Energia lasera stymuluje produkcję kolagenu i zwęża pory. Zabieg trwa 15–20 minut.', en: 'Nd:YAG laser with 1064 nm wavelength vaporizes the paste along with impurities. Laser energy stimulates collagen production and tightens pores. The treatment takes 15–20 minutes.', ru: 'Лазер Nd:YAG с длиной волны 1064 нм испаряет пасту вместе с загрязнениями. Энергия лазера стимулирует выработку коллагена и сужает поры. Процедура длится 15–20 минут.' },
      },
      {
        title: { pl: 'Pielęgnacja końcowa', en: 'Final care', ru: 'Завершающий уход' },
        description: { pl: 'Nakładamy maskę kojącą i krem z filtrem SPF. Skóra jest odświeżona i promienna natychmiast po zabiegu.', en: 'We apply a soothing mask and SPF cream. Skin is refreshed and radiant immediately after treatment.', ru: 'Наносим успокаивающую маску и крем с SPF. Кожа выглядит свежей и сияющей сразу после процедуры.' },
      },
    ],
    contraindications: [
      { pl: 'Aktywna opryszczka', en: 'Active herpes', ru: 'Активный герпес' },
      { pl: 'Ciąża i karmienie piersią', en: 'Pregnancy and breastfeeding', ru: 'Беременность и кормление грудью' },
      { pl: 'Świeża opalenizna lub oparzenie słoneczne', en: 'Fresh tan or sunburn', ru: 'Свежий загар или солнечный ожог' },
      { pl: 'Stosowanie retinolu w ciągu ostatnich 7 dni', en: 'Retinol use within the last 7 days', ru: 'Применение ретинола в течение последних 7 дней' },
      { pl: 'Trądzik ropny w aktywnej fazie', en: 'Active pustular acne', ru: 'Активные гнойные акне' },
      { pl: 'Przyjmowanie izotretynoiny (Accutane)', en: 'Taking isotretinoin (Accutane)', ru: 'Приём изотретиноина (Аккутан)' },
    ],
    pricingLink: {
      text: { pl: 'Zobacz cennik peelingu węglowego', en: 'View carbon peeling price list', ru: 'Смотреть прайс-лист карбонового пилинга' },
      url: '/prices',
    },
    showEffectsGallery: true,
  },

  // 5. Usuwanie tatuażu
  {
    slug: 'usuwanie-tatuazu-bialystok',
    category: 'Laserowe usuwanie',
    imageKey: 'tattooRemoval',
    hero: {
      title: {
        pl: 'Laserowe Usuwanie Tatuażu w Białymstoku',
        en: 'Laser Tattoo Removal in Białystok',
        ru: 'Лазерное удаление тату в Белостоке',
      },
      subtitle: {
        pl: 'Bezpieczne usuwanie tatuażu i makijażu permanentnego laserem Nd:YAG.',
        en: 'Safe removal of tattoos and permanent makeup with Nd:YAG laser.',
        ru: 'Безопасное удаление тату и перманентного макияжа лазером Nd:YAG.',
      },
    },
    seo: {
      title: {
        pl: 'Usuwanie Tatuażu Białystok — Laser Nd:YAG | Katarzyna Brui',
        en: 'Tattoo Removal Białystok — Nd:YAG Laser | Katarzyna Brui',
        ru: 'Удаление тату Белосток — Лазер Nd:YAG | Катажина Бруи',
      },
      description: {
        pl: 'Laserowe usuwanie tatuażu i makijażu permanentnego w Białymstoku. Skuteczny laser Nd:YAG, bezpieczna procedura. Konsultacja gratis. Salon Katarzyna Brui.',
        en: 'Laser tattoo and permanent makeup removal in Białystok. Effective Nd:YAG laser, safe procedure. Free consultation. Katarzyna Brui Salon.',
        ru: 'Лазерное удаление тату и перманентного макияжа в Белостоке. Эффективный лазер Nd:YAG, безопасная процедура. Консультация бесплатно. Салон Катажина Бруи.',
      },
      keywords: {
        pl: 'usuwanie tatuażu Białystok, laserowe usuwanie tatuażu Białystok, usuwanie makijażu permanentnego Białystok, laserowe usuwanie pmu Białystok, ile kosztuje usunięcie tatuażu Białystok, laserowe usuwanie tatuażu cena, usuwanie nieudanego makijażu permanentnego',
        en: 'tattoo removal Białystok, laser tattoo removal, permanent makeup removal, Nd:YAG laser',
        ru: 'удаление тату Белосток, лазерное удаление тату, удаление перманентного макияжа, лазер Nd:YAG',
      },
    },
    intro: {
      pl: 'Chcesz usunąć niechciany tatuaż lub stary makijaż permanentny? W salonie Katarzyna Brui w Białymstoku oferujemy laserowe usuwanie z użyciem nowoczesnego lasera Nd:YAG. Laser skutecznie rozbija pigment w skórze, a organizm naturalnie go eliminuje. Zabieg jest bezpieczny i wykonywany pod kontrolą doświadczonego specjalisty. Każdą sesję poprzedzamy oceną i planem leczenia.',
      en: 'Want to remove an unwanted tattoo or old permanent makeup? At Katarzyna Brui salon in Białystok, we offer laser removal using a modern Nd:YAG laser. The laser effectively breaks down pigment in the skin, and the body naturally eliminates it. The procedure is safe and performed by an experienced specialist. Each session is preceded by an assessment and treatment plan.',
      ru: 'Хотите удалить нежелательную тату или старый перманентный макияж? В салоне Катажина Бруи в Белостоке мы предлагаем лазерное удаление с использованием современного лазера Nd:YAG. Лазер эффективно разрушает пигмент в коже, а организм естественным образом его выводит. Процедура безопасна и проводится под контролем опытного специалиста.',
    },
    benefits: [
      { pl: 'Nowoczesny laser Nd:YAG', en: 'Modern Nd:YAG laser', ru: 'Современный лазер Nd:YAG' },
      { pl: 'Usuwa tatuaże i makijaż permanentny', en: 'Removes tattoos and permanent makeup', ru: 'Удаляет тату и перманентный макияж' },
      { pl: 'Bezpieczna i kontrolowana procedura', en: 'Safe and controlled procedure', ru: 'Безопасная и контролируемая процедура' },
      { pl: 'Indywidualny plan leczenia', en: 'Individual treatment plan', ru: 'Индивидуальный план лечения' },
    ],
    faq: [
      {
        question: 'Ile sesji potrzeba, żeby usunąć tatuaż?',
        question_en: 'How many sessions are needed to remove a tattoo?',
        question_ru: 'Сколько сеансов нужно для удаления тату?',
        answer: 'Liczba sesji zależy od rozmiaru, koloru i głębokości tatuażu. Zazwyczaj potrzeba 3-8 sesji w odstępach 6-8 tygodniowych. Podczas konsultacji ocenimy i przedstawimy plan.',
        answer_en: 'The number of sessions depends on the size, color and depth of the tattoo. Usually 3-8 sessions are needed at 6-8 week intervals. We will assess and present a plan during consultation.',
        answer_ru: 'Количество сеансов зависит от размера, цвета и глубины тату. Обычно нужно 3-8 сеансов с интервалом 6-8 недель. На консультации мы оценим и представим план.',
      },
      {
        question: 'Czy usuwanie tatuażu boli?',
        question_en: 'Is tattoo removal painful?',
        question_ru: 'Больно ли удалять тату?',
        answer: 'Odczucia podczas zabiegu porównywane są do lekkiego pieczenia lub strzelania gumką. Stosujemy krem znieczulający, który minimalizuje dyskomfort.',
        answer_en: 'The sensation during treatment is compared to a slight burning or rubber band snapping. We use numbing cream to minimize discomfort.',
        answer_ru: 'Ощущения во время процедуры сравнимы с лёгким жжением или щелчком резинки. Мы используем обезболивающий крем для минимизации дискомфорта.',
      },
      {
        question: 'Ile kosztuje usuwanie tatuażu w Białymstoku?',
        question_en: 'How much does tattoo removal cost in Białystok?',
        question_ru: 'Сколько стоит удаление тату в Белостоке?',
        answer: 'Cena zależy od rozmiaru tatuażu. Małe tatuaże od 150 PLN za sesję, większe od 250 PLN. Oferujemy pakiety na pełny cykl usuwania w promocyjnej cenie.',
        answer_en: 'The price depends on tattoo size. Small tattoos from 150 PLN per session, larger ones from 250 PLN. We offer packages for the full removal cycle at promotional prices.',
        answer_ru: 'Цена зависит от размера тату. Маленькие тату от 150 PLN за сеанс, большие от 250 PLN. Предлагаем пакеты на полный цикл удаления по акционной цене.',
      },
      {
        question: 'Jak przygotować się do sesji laserowego usuwania tatuażu?',
        question_en: 'How to prepare for a laser tattoo removal session?',
        question_ru: 'Как подготовиться к сеансу лазерного удаления тату?',
        answer: 'Na 2 tygodnie przed sesją unikaj opalania obszaru z tatuażem. Nie stosuj kremów samoopalających. W dniu zabiegu skóra powinna być czysta i sucha — bez kremów, balsamów ani makijażu. Unikaj aspiryny i ibuprofenu 48 godzin przed wizytą, ponieważ zwiększają ryzyko siniaków.',
        answer_en: 'Avoid tanning the tattooed area for 2 weeks before the session. Do not use self-tanning creams. On the day of the treatment, the skin should be clean and dry — no creams, lotions or makeup. Avoid aspirin and ibuprofen 48 hours before your appointment, as they increase the risk of bruising.',
        answer_ru: 'За 2 недели до сеанса избегайте загара в области тату. Не используйте кремы для автозагара. В день процедуры кожа должна быть чистой и сухой — без кремов, лосьонов и макияжа. Избегайте аспирина и ибупрофена за 48 часов до визита, так как они увеличивают риск синяков.',
      },
      {
        question: 'Jakie są przeciwwskazania do laserowego usuwania tatuażu?',
        question_en: 'What are the contraindications for laser tattoo removal?',
        question_ru: 'Какие противопоказания к лазерному удалению тату?',
        answer: 'Przeciwwskazania obejmują: ciążę i karmienie piersią, świeżą opaleniznę lub oparzenie słoneczne, aktywne infekcje skóry w okolicy tatuażu, choroby autoimmunologiczne, przyjmowanie leków fotouczulających, skłonność do bliznowców (keloidów) oraz niestabilną cukrzycę.',
        answer_en: 'Contraindications include: pregnancy and breastfeeding, fresh tan or sunburn, active skin infections in the tattoo area, autoimmune diseases, photosensitizing medications, tendency to keloid scarring, and unstable diabetes.',
        answer_ru: 'Противопоказания включают: беременность и кормление грудью, свежий загар или солнечный ожог, активные инфекции кожи в области тату, аутоиммунные заболевания, приём фотосенсибилизирующих препаратов, склонность к келоидным рубцам и нестабильный сахарный диабет.',
      },
      {
        question: 'Jak pielęgnować skórę po laserowym usuwaniu tatuażu?',
        question_en: 'How to care for skin after laser tattoo removal?',
        question_ru: 'Как ухаживать за кожей после лазерного удаления тату?',
        answer: 'Po zabiegu mogą pojawić się zaczerwienienie, obrzęk i drobne pęcherzyki — to normalna reakcja. Stosuj maść nawilżającą (np. panthenol) i okrywaj obszar sterylnym opatrunkiem przez 3-5 dni. Nie drap i nie usuwaj strupków. Chroni skórę przed słońcem kremem SPF 50 przez minimum 4 tygodnie. Unikaj sauny, basenu i intensywnego wysiłku przez 48 godzin.',
        answer_en: 'Redness, swelling and small blisters may appear after the treatment — this is a normal reaction. Apply moisturizing ointment (e.g. panthenol) and cover the area with a sterile dressing for 3-5 days. Do not scratch or remove scabs. Protect the skin from the sun with SPF 50 for at least 4 weeks. Avoid saunas, pools and intense exercise for 48 hours.',
        answer_ru: 'После процедуры могут появиться покраснение, отёк и мелкие пузырьки — это нормальная реакция. Наносите увлажняющую мазь (например, пантенол) и закрывайте область стерильной повязкой 3-5 дней. Не расчёсывайте и не удаляйте корочки. Защищайте кожу от солнца кремом SPF 50 минимум 4 недели. Избегайте сауны, бассейна и интенсивных нагрузок 48 часов.',
      },
    ],
    cta: {
      text: {
        pl: 'Chcesz pozbyć się tatuażu? Umów konsultację!',
        en: 'Want to get rid of a tattoo? Book a consultation!',
        ru: 'Хотите избавиться от тату? Запишитесь на консультацию!',
      },
      link: '/services',
    },
    extendedIntro: {
      pl: 'Laserowe usuwanie tatuażu to bezpieczna i skuteczna metoda pozbycia się niechcianego tatuażu lub makijażu permanentnego. W salonie w Białymstoku stosujemy laser Nd:YAG, który rozbija cząsteczki pigmentu na mikroskopijne fragmenty, usuwane następnie przez naturalny układ odpornościowy organizmu. Liczba sesji zależy od wielkości, kolorów i głębokości tatuażu.',
      en: 'Laser tattoo removal is a safe and effective method for getting rid of unwanted tattoos or permanent makeup. At our salon in Białystok, we use an Nd:YAG laser that breaks down pigment particles into microscopic fragments, which are then removed by the body\'s natural immune system. The number of sessions depends on the size, colors and depth of the tattoo.',
      ru: 'Лазерное удаление тату — это безопасный и эффективный метод избавления от нежелательной татуировки или перманентного макияжа. В нашем салоне в Белостоке мы используем лазер Nd:YAG, который разбивает частицы пигмента на микроскопические фрагменты, которые затем выводятся естественной иммунной системой организма. Количество сеансов зависит от размера, цветов и глубины тату.',
    },
    procedureSteps: [
      {
        title: { pl: 'Ocena tatuażu i konsultacja', en: 'Tattoo assessment & consultation', ru: 'Оценка тату и консультация' },
        description: { pl: 'Oceniamy wielkość, kolor i głębokość tatuażu. Określamy przybliżoną liczbę sesji potrzebnych do pełnego usunięcia. Wykonujemy test na małym fragmencie skóry.', en: 'We assess the tattoo size, color and depth. We estimate the approximate number of sessions needed for complete removal. We perform a patch test on a small skin area.', ru: 'Оцениваем размер, цвет и глубину тату. Определяем приблизительное количество сеансов для полного удаления. Проводим тест на небольшом участке кожи.' },
      },
      {
        title: { pl: 'Znieczulenie obszaru', en: 'Area numbing', ru: 'Обезболивание области' },
        description: { pl: 'Nakładamy krem znieczulający na obszar zabiegu. Czas oczekiwania: 20–30 minut dla komfortowego przebiegu sesji.', en: 'We apply numbing cream to the treatment area. Waiting time: 20–30 minutes for a comfortable session.', ru: 'Наносим обезболивающий крем на область процедуры. Время ожидания: 20–30 минут для комфортного прохождения сеанса.' },
      },
      {
        title: { pl: 'Sesja laserowa', en: 'Laser session', ru: 'Лазерный сеанс' },
        description: { pl: 'Laser emituje krótkie impulsy świetlne, które przenikają przez skórę i rozbijają pigment. Sesja trwa 10–30 minut w zależności od rozmiaru tatuażu.', en: 'The laser emits short light pulses that penetrate the skin and break down the pigment. Session takes 10–30 minutes depending on tattoo size.', ru: 'Лазер излучает короткие световые импульсы, которые проникают через кожу и разрушают пигмент. Сеанс длится 10–30 минут в зависимости от размера тату.' },
      },
      {
        title: { pl: 'Chłodzenie i pielęgnacja', en: 'Cooling & aftercare', ru: 'Охлаждение и уход' },
        description: { pl: 'Po zabiegu stosujemy chłodzenie skóry i nakładamy specjalistyczną maść. Kolejna sesja możliwa po 6–8 tygodniach, gdy skóra w pełni się zregeneruje.', en: 'After treatment, we cool the skin and apply a specialized ointment. The next session is possible after 6–8 weeks, once the skin has fully recovered.', ru: 'После процедуры охлаждаем кожу и наносим специальную мазь. Следующий сеанс возможен через 6–8 недель, когда кожа полностью восстановится.' },
      },
    ],
    contraindications: [
      { pl: 'Ciąża i karmienie piersią', en: 'Pregnancy and breastfeeding', ru: 'Беременность и кормление грудью' },
      { pl: 'Świeża opalenizna lub samoopalacz', en: 'Fresh tan or self-tanner', ru: 'Свежий загар или автозагар' },
      { pl: 'Aktywne stany zapalne skóry w okolicy tatuażu', en: 'Active skin inflammation near the tattoo', ru: 'Активные воспаления кожи вблизи тату' },
      { pl: 'Tendencja do powstawania keloidów', en: 'Tendency to keloid formation', ru: 'Склонность к образованию келоидов' },
      { pl: 'Przyjmowanie leków fotouczulających', en: 'Taking photosensitizing medications', ru: 'Приём фотосенсибилизирующих препаратов' },
      { pl: 'Padaczka', en: 'Epilepsy', ru: 'Эпилепсия' },
    ],
    pricingLink: {
      text: { pl: 'Zobacz cennik usuwania tatuażu', en: 'View tattoo removal price list', ru: 'Смотреть прайс-лист удаления тату' },
      url: '/prices',
    },
    showEffectsGallery: true,
  },

  // 6. Manicure
  {
    slug: 'manicure-bialystok',
    category: 'Manicure i pedicure',
    imageKey: 'manicure',
    hero: {
      title: {
        pl: 'Manicure Hybrydowy i Żelowy w Białymstoku',
        en: 'Gel & Hybrid Manicure in Białystok',
        ru: 'Гибридный и гелевый маникюр в Белостоке',
      },
      subtitle: {
        pl: 'Manicure klasyczny, hybrydowy, żelowy i japoński. Piękne dłonie każdego dnia.',
        en: 'Classic, hybrid, gel and Japanese manicure. Beautiful hands every day.',
        ru: 'Классический, гибридный, гелевый и японский маникюр. Красивые руки каждый день.',
      },
    },
    seo: {
      title: {
        pl: 'Manicure Białystok — Hybrydowy, Żelowy, Klasyczny | Katarzyna Brui',
        en: 'Manicure Białystok — Hybrid, Gel, Classic | Katarzyna Brui',
        ru: 'Маникюр Белосток — Гибридный, Гелевый, Классический | Катажина Бруи',
      },
      description: {
        pl: 'Profesjonalny manicure hybrydowy, żelowy, klasyczny i japoński w Białymstoku. Trwałe kolory, zadbane dłonie. Umów wizytę online — Salon Katarzyna Brui.',
        en: 'Professional hybrid, gel, classic and Japanese manicure in Białystok. Lasting colors, well-groomed hands. Book online — Katarzyna Brui Salon.',
        ru: 'Профессиональный гибридный, гелевый, классический и японский маникюр в Белостоке. Стойкие цвета, ухоженные руки. Запишитесь онлайн — Салон Катажина Бруи.',
      },
      keywords: {
        pl: 'manicure Białystok, paznokcie Białystok, manicure hybrydowy Białystok, manicure żelowy Białystok, uzupełnianie paznokci żelowych, manicure japoński, manicure klasyczny, manicure męski Białystok, pedicure Białystok, pedicure hybrydowy, pedicure leczniczy, paznokcie Białystok centrum, najlepszy manicure Białystok opinie, cennik manicure',
        en: 'manicure Białystok, hybrid manicure, gel manicure, classic manicure, Japanese manicure, nails Białystok',
        ru: 'маникюр Белосток, гибридный маникюр, гелевый маникюр, классический маникюр, японский маникюр, ногти Белосток',
      },
    },
    intro: {
      pl: 'Salon Katarzyna Brui w Białymstoku oferuje profesjonalny manicure w różnych technikach. Niezależnie czy preferujesz klasyczny manicure, trwały hybrydowy, żelowe wzmocnienie czy odżywczy manicure japoński — zadbamy o Twoje dłonie z najwyższą starannością. Używamy produktów renomowanych marek, gwarantujących piękny i trwały efekt.',
      en: 'Katarzyna Brui Salon in Białystok offers professional manicure in various techniques. Whether you prefer classic manicure, long-lasting hybrid, gel reinforcement or nourishing Japanese manicure — we will take care of your hands with the utmost precision. We use products from reputable brands, guaranteeing a beautiful and lasting effect.',
      ru: 'Салон Катажина Бруи в Белостоке предлагает профессиональный маникюр в различных техниках. Будь то классический маникюр, стойкий гибридный, гелевое укрепление или питательный японский маникюр — мы позаботимся о ваших руках с высочайшей тщательностью. Используем продукцию проверенных марок.',
    },
    benefits: [
      { pl: 'Szeroki wybór kolorów i technik', en: 'Wide range of colors and techniques', ru: 'Широкий выбор цветов и техник' },
      { pl: 'Produkty premium — trwałość do 3 tygodni', en: 'Premium products — lasts up to 3 weeks', ru: 'Премиум-продукция — стойкость до 3 недель' },
      { pl: 'Sterylne narzędzia — bezpieczeństwo', en: 'Sterile tools — safety guaranteed', ru: 'Стерильные инструменты — безопасность' },
      { pl: 'Manicure japoński — odżywienie naturalnych paznokci', en: 'Japanese manicure — nourishing natural nails', ru: 'Японский маникюр — питание натуральных ногтей' },
    ],
    faq: [
      {
        question: 'Ile kosztuje manicure hybrydowy w Białymstoku?',
        question_en: 'How much does hybrid manicure cost in Białystok?',
        question_ru: 'Сколько стоит гибридный маникюр в Белостоке?',
        answer: 'Ceny manicure hybrydowego zaczynają się od 80 PLN. Manicure klasyczny od 50 PLN, żelowy od 100 PLN. Aktualny cennik dostępny na stronie z usługami.',
        answer_en: 'Hybrid manicure prices start from 80 PLN. Classic manicure from 50 PLN, gel from 100 PLN. Current prices available on our services page.',
        answer_ru: 'Цены на гибридный маникюр начинаются от 80 PLN. Классический маникюр от 50 PLN, гелевый от 100 PLN. Актуальный прайс-лист на странице услуг.',
      },
      {
        question: 'Jak długo trwa manicure hybrydowy?',
        question_en: 'How long does hybrid manicure take?',
        question_ru: 'Сколько длится гибридный маникюр?',
        answer: 'Manicure hybrydowy trwa średnio 60-90 minut, w zależności od stanu paznokci i wybranego zdobienia. Efekt utrzymuje się do 3 tygodni.',
        answer_en: 'Hybrid manicure takes 60-90 minutes on average, depending on nail condition and chosen design. The effect lasts up to 3 weeks.',
        answer_ru: 'Гибридный маникюр длится в среднем 60-90 минут, в зависимости от состояния ногтей и выбранного дизайна. Эффект сохраняется до 3 недель.',
      },
      {
        question: 'Czym różni się manicure hybrydowy od żelowego?',
        question_en: 'What is the difference between hybrid and gel manicure?',
        question_ru: 'Чем отличается гибридный маникюр от гелевого?',
        answer: 'Manicure hybrydowy jest lżejszy i bardziej naturalny, idealny do codziennego noszenia. Żelowy jest grubszy i mocniejszy — polecany dla osób z łamliwymi paznokciami, które potrzebują wzmocnienia.',
        answer_en: 'Hybrid manicure is lighter and more natural, ideal for everyday wear. Gel is thicker and stronger — recommended for people with brittle nails who need reinforcement.',
        answer_ru: 'Гибридный маникюр легче и естественнее, идеален для повседневной носки. Гелевый толще и прочнее — рекомендуется для людей с ломкими ногтями, которым нужно укрепление.',
      },
      {
        question: 'Jak przygotować paznokcie do manicure hybrydowego?',
        question_en: 'How to prepare nails for hybrid manicure?',
        question_ru: 'Как подготовить ногти к гибридному маникюру?',
        answer: 'Nie obcinaj skórek samodzielnie przed wizytą — zrobi to stylistka. Jeśli masz stary lakier hybrydowy, możesz go zostawić — zdejmiemy go na miejscu. Unikaj nawilżających kremów do rąk bezpośrednio przed wizytą, ponieważ tłuste paznokcie gorzej trzymają lakier. Jeśli masz uszkodzone lub łamliwe paznokcie, poinformuj nas — dobierzemy odpowiednią pielęgnację.',
        answer_en: 'Do not cut cuticles yourself before the appointment — the stylist will handle this. If you have old hybrid polish, you can leave it — we will remove it on site. Avoid moisturizing hand creams right before your visit, as oily nails hold polish less well. If you have damaged or brittle nails, let us know — we will select appropriate care.',
        answer_ru: 'Не срезайте кутикулу самостоятельно перед визитом — это сделает стилист. Если у вас старое гибридное покрытие, можете его оставить — мы снимем его на месте. Избегайте увлажняющих кремов для рук непосредственно перед визитом, так как жирные ногти хуже держат лак. Если ногти повреждены или ломкие, сообщите нам — подберём подходящий уход.',
      },
      {
        question: 'Czy manicure hybrydowy ma przeciwwskazania?',
        question_en: 'Are there contraindications for hybrid manicure?',
        question_ru: 'Есть ли противопоказания к гибридному маникюру?',
        answer: 'Manicure hybrydowy nie jest zalecany przy: grzybicy paznokci (wymaga wcześniejszego leczenia), alergiach na składniki lakierów hybrydowych (np. HEMA), otwartych ranach lub stanach zapalnych wokół paznokci, bardzo cienkiej i uszkodzonej płytce paznokcia (zalecamy najpierw odbudowę). Podczas wizyty ocenimy stan paznokci i dobierzemy optymalny zabieg.',
        answer_en: 'Hybrid manicure is not recommended for: nail fungus (requires prior treatment), allergies to hybrid polish ingredients (e.g. HEMA), open wounds or inflammation around nails, very thin and damaged nail plate (we recommend rebuilding first). During the visit, we will assess nail condition and select the optimal treatment.',
        answer_ru: 'Гибридный маникюр не рекомендуется при: грибке ногтей (требует предварительного лечения), аллергии на компоненты гибридных лаков (например, HEMA), открытых ранах или воспалениях вокруг ногтей, очень тонкой и повреждённой ногтевой пластине (рекомендуем сначала восстановление). Во время визита мы оценим состояние ногтей и подберём оптимальную процедуру.',
      },
      {
        question: 'Jak dbać o paznokcie po manicure hybrydowym?',
        question_en: 'How to care for nails after hybrid manicure?',
        question_ru: 'Как ухаживать за ногтями после гибридного маникюра?',
        answer: 'Noś rękawiczki przy pracach domowych z detergentami. Stosuj olejek do skórek codziennie — odżywi paznokcie i przedłuży trwałość manicure. Nie odklejaj lakieru hybrydowego siłą — uszkodzi to płytkę paznokcia. Przychodź na zdejmowanie lub wymianę co 2-3 tygodnie, aby paznokcie mogły oddychać i zachować zdrowy wygląd.',
        answer_en: 'Wear gloves when doing housework with detergents. Apply cuticle oil daily — it nourishes nails and extends manicure durability. Do not peel off hybrid polish by force — it will damage the nail plate. Come for removal or replacement every 2-3 weeks to let nails breathe and maintain a healthy appearance.',
        answer_ru: 'Носите перчатки при домашних работах с моющими средствами. Наносите масло для кутикулы ежедневно — оно питает ногти и продлевает стойкость маникюра. Не отдирайте гибридный лак силой — это повредит ногтевую пластину. Приходите на снятие или замену каждые 2-3 недели, чтобы ногти могли дышать и сохранять здоровый вид.',
      },
    ],
    cta: {
      text: {
        pl: 'Czas na piękne paznokcie? Umów wizytę!',
        en: 'Time for beautiful nails? Book now!',
        ru: 'Время для красивых ногтей? Запишитесь!',
      },
      link: '/services',
    },
    extendedIntro: {
      pl: 'Profesjonalny manicure hybrydowy to nie tylko piękne paznokcie — to również dbałość o zdrowie płytki paznokciowej i skórek. W salonie Katarzyna Brui w Białymstoku oferujemy manicure klasyczny, hybrydowy oraz żelowy z użyciem wysokiej jakości produktów. Efekt utrzymuje się do 3 tygodni bez odpryskiwania, a kolory dobieramy z bogatej palety ponad 200 odcieni.',
      en: 'Professional gel manicure is not just about beautiful nails — it\'s also about caring for nail plate and cuticle health. At Katarzyna Brui salon in Białystok, we offer classic, gel polish and gel nail manicure using high-quality products. The effect lasts up to 3 weeks without chipping, with colors selected from a rich palette of over 200 shades.',
      ru: 'Профессиональный гель-лак маникюр — это не только красивые ногти, но и забота о здоровье ногтевой пластины и кутикулы. В салоне Катажина Бруи в Белостоке мы предлагаем классический, гель-лаковый и гелевый маникюр с использованием высококачественных продуктов. Эффект сохраняется до 3 недель без сколов, а цвета подбираются из богатой палитры более 200 оттенков.',
    },
    procedureSteps: [
      {
        title: { pl: 'Przygotowanie paznokci', en: 'Nail preparation', ru: 'Подготовка ногтей' },
        description: { pl: 'Usuwamy stary lakier, nadajemy kształt paznokciom piłką i przygotowujemy płytkę do nowego manicure.', en: 'We remove old polish, shape nails with a file and prepare the nail plate for a new manicure.', ru: 'Снимаем старый лак, придаём форму ногтям пилкой и подготавливаем ногтевую пластину к новому маникюру.' },
      },
      {
        title: { pl: 'Pielęgnacja skórek', en: 'Cuticle care', ru: 'Уход за кутикулой' },
        description: { pl: 'Delikatnie usuwamy skórki za pomocą frezarki lub klasycznie nożyczkami. Nakładamy olejek odżywczy na skórki wokół paznokci.', en: 'We gently remove cuticles using an e-file or classically with scissors. We apply nourishing oil to the cuticles around the nails.', ru: 'Аккуратно удаляем кутикулу фрезой или классически ножницами. Наносим питательное масло на кутикулу вокруг ногтей.' },
      },
      {
        title: { pl: 'Aplikacja lakieru hybrydowego', en: 'Gel polish application', ru: 'Нанесение гель-лака' },
        description: { pl: 'Nakładamy bazę, dwie warstwy wybranego koloru i top coat, utwardzając każdą warstwę pod lampą UV/LED. Oferujemy ponad 200 odcieni do wyboru.', en: 'We apply base coat, two layers of chosen color and top coat, curing each layer under UV/LED lamp. We offer over 200 shades to choose from.', ru: 'Наносим базу, два слоя выбранного цвета и топ, полимеризуя каждый слой под UV/LED лампой. Предлагаем более 200 оттенков на выбор.' },
      },
      {
        title: { pl: 'Nawilżenie i wykończenie', en: 'Moisturizing & finishing', ru: 'Увлажнение и завершение' },
        description: { pl: 'Nakładamy krem nawilżający i olejek na skórki. Sprawdzamy równomierność pokrycia i estetykę wykonania.', en: 'We apply moisturizing cream and cuticle oil. We check coverage evenness and aesthetic finish.', ru: 'Наносим увлажняющий крем и масло для кутикулы. Проверяем равномерность покрытия и эстетику выполнения.' },
      },
    ],
    contraindications: [
      { pl: 'Infekcje grzybicze paznokci', en: 'Fungal nail infections', ru: 'Грибковые инфекции ногтей' },
      { pl: 'Otwarte rany lub stany zapalne wokół paznokci', en: 'Open wounds or inflammation around nails', ru: 'Открытые раны или воспаления вокруг ногтей' },
      { pl: 'Alergia na składniki lakierów hybrydowych (HEMA)', en: 'Allergy to gel polish components (HEMA)', ru: 'Аллергия на компоненты гель-лака (HEMA)' },
      { pl: 'Łuszczyca paznokci', en: 'Nail psoriasis', ru: 'Псориаз ногтей' },
    ],
    pricingLink: {
      text: { pl: 'Zobacz cennik manicure', en: 'View manicure price list', ru: 'Смотреть прайс-лист маникюра' },
      url: '/prices',
    },
    showEffectsGallery: true,
  },

  // 7. Pedicure
  {
    slug: 'pedicure-bialystok',
    category: 'Manicure i pedicure',
    imageKey: 'manicure',
    hero: {
      title: {
        pl: 'Pedicure w Białymstoku',
        en: 'Pedicure in Białystok',
        ru: 'Педикюр в Белостоке',
      },
      subtitle: {
        pl: 'Pedicure klasyczny, hybrydowy i leczniczy. Zadbane stopy przez cały rok.',
        en: 'Classic, hybrid and therapeutic pedicure. Well-groomed feet all year round.',
        ru: 'Классический, гибридный и лечебный педикюр. Ухоженные стопы круглый год.',
      },
    },
    seo: {
      title: {
        pl: 'Pedicure Białystok — Klasyczny, Hybrydowy, Leczniczy | Katarzyna Brui',
        en: 'Pedicure Białystok — Classic, Hybrid, Therapeutic | Katarzyna Brui',
        ru: 'Педикюр Белосток — Классический, Гибридный, Лечебный | Катажина Бруи',
      },
      description: {
        pl: 'Profesjonalny pedicure klasyczny, hybrydowy i leczniczy w Białymstoku. Pielęgnacja stóp, usuwanie zrogowaceń, trwałe lakierowanie. Umów wizytę — Salon Katarzyna Brui.',
        en: 'Professional classic, hybrid and therapeutic pedicure in Białystok. Foot care, callus removal, lasting polish. Book now — Katarzyna Brui Salon.',
        ru: 'Профессиональный классический, гибридный и лечебный педикюр в Белостоке. Уход за стопами, удаление мозолей, стойкое покрытие. Запишитесь — Салон Катажина Бруи.',
      },
      keywords: {
        pl: 'pedicure Białystok, pedicure hybrydowy Białystok, pedicure klasyczny, pedicure leczniczy Białystok, pielęgnacja stóp Białystok, pedicure cena Białystok',
        en: 'pedicure Białystok, hybrid pedicure, classic pedicure, therapeutic pedicure, foot care Białystok',
        ru: 'педикюр Белосток, гибридный педикюр, классический педикюр, лечебный педикюр, уход за стопами Белосток',
      },
    },
    intro: {
      pl: 'Salon Katarzyna Brui w Białymstoku zapewnia profesjonalny pedicure w komfortowych warunkach. Oferujemy pedicure klasyczny z dokładnym opracowaniem stóp, pedicure hybrydowy z trwałym lakierowaniem oraz pedicure leczniczy dla osób z problemami skórnymi. Każdy zabieg obejmuje kąpiel, usunięcie zrogowaceń, pielęgnację skórek i paznokci oraz relaksujący masaż stóp.',
      en: 'Katarzyna Brui Salon in Białystok provides professional pedicure in comfortable conditions. We offer classic pedicure with thorough foot treatment, hybrid pedicure with lasting polish, and therapeutic pedicure for those with skin concerns. Each treatment includes a soak, callus removal, cuticle and nail care, and a relaxing foot massage.',
      ru: 'Салон Катажина Бруи в Белостоке предоставляет профессиональный педикюр в комфортных условиях. Мы предлагаем классический педикюр с тщательной обработкой стоп, гибридный педикюр со стойким покрытием и лечебный педикюр для людей с кожными проблемами. Каждая процедура включает ванночку, удаление мозолей, уход за кутикулой и ногтями, а также расслабляющий массаж стоп.',
    },
    benefits: [
      { pl: 'Kompleksowa pielęgnacja stóp i paznokci', en: 'Comprehensive foot and nail care', ru: 'Комплексный уход за стопами и ногтями' },
      { pl: 'Sterylne narzędzia i jednorazowe pilniki', en: 'Sterile tools and disposable files', ru: 'Стерильные инструменты и одноразовые пилки' },
      { pl: 'Relaksujący masaż stóp w cenie', en: 'Relaxing foot massage included', ru: 'Расслабляющий массаж стоп включён' },
      { pl: 'Pedicure leczniczy — pomoc przy wrastających paznokciach', en: 'Therapeutic pedicure — help with ingrown nails', ru: 'Лечебный педикюр — помощь при вросших ногтях' },
    ],
    faq: [
      {
        question: 'Ile kosztuje pedicure w Białymstoku?',
        question_en: 'How much does pedicure cost in Białystok?',
        question_ru: 'Сколько стоит педикюр в Белостоке?',
        answer: 'Ceny pedicure zaczynają się od 80 PLN za pedicure klasyczny. Pedicure hybrydowy od 100 PLN, leczniczy od 120 PLN. Aktualny cennik na stronie usług.',
        answer_en: 'Pedicure prices start from 80 PLN for classic pedicure. Hybrid pedicure from 100 PLN, therapeutic from 120 PLN. Current prices on our services page.',
        answer_ru: 'Цены на педикюр начинаются от 80 PLN за классический педикюр. Гибридный педикюр от 100 PLN, лечебный от 120 PLN. Актуальный прайс-лист на странице услуг.',
      },
      {
        question: 'Jak często powinnam robić pedicure?',
        question_en: 'How often should I get a pedicure?',
        question_ru: 'Как часто нужно делать педикюр?',
        answer: 'Zalecamy pedicure co 3-4 tygodnie, aby utrzymać zdrowy i estetyczny wygląd stóp. W sezonie letnim warto robić pedicure częściej — co 2-3 tygodnie.',
        answer_en: 'We recommend a pedicure every 3-4 weeks to maintain healthy and aesthetic-looking feet. In summer, more frequent sessions every 2-3 weeks are advised.',
        answer_ru: 'Мы рекомендуем педикюр каждые 3-4 недели для поддержания здорового и эстетичного вида стоп. В летний сезон стоит делать педикюр чаще — каждые 2-3 недели.',
      },
      {
        question: 'Czym różni się pedicure leczniczy od klasycznego?',
        question_en: 'What is the difference between therapeutic and classic pedicure?',
        question_ru: 'Чем отличается лечебный педикюр от классического?',
        answer: 'Pedicure leczniczy jest przeznaczony dla osób z problemami takimi jak wrastające paznokcie, grzybica, zgrubiałe paznokcie czy nadmierne zrogowacenia. Obejmuje specjalistyczne opracowanie z użyciem frezarki i preparatów leczniczych.',
        answer_en: 'Therapeutic pedicure is designed for people with problems such as ingrown nails, fungal infections, thickened nails or excessive calluses. It includes specialized treatment using a milling cutter and therapeutic products.',
        answer_ru: 'Лечебный педикюр предназначен для людей с проблемами: вросшие ногти, грибок, утолщённые ногти или чрезмерные мозоли. Включает специализированную обработку фрезером и лечебными препаратами.',
      },
      {
        question: 'Jak przygotować się do pedicure?',
        question_en: 'How to prepare for a pedicure?',
        question_ru: 'Как подготовиться к педикюру?',
        answer: 'Nie obcinaj paznokci ani skórek samodzielnie przed wizytą. Jeśli to możliwe, przyjdź w wygodnym obuwiu (szczególnie latem), aby nie przytłaczać świeżo zrobionych paznokci. Jeśli masz grzybicę lub wrastające paznokcie, poinformuj nas przy rezerwacji — dobierzemy odpowiedni zabieg. Nie musisz wcześniej moczyć stóp — kąpiel jest częścią zabiegu.',
        answer_en: 'Do not trim nails or cuticles yourself before the visit. If possible, come in comfortable shoes (especially in summer) to avoid pressing freshly done nails. If you have a fungal infection or ingrown nails, let us know when booking — we will select the appropriate treatment. No need to soak your feet beforehand — the soak is part of the treatment.',
        answer_ru: 'Не подстригайте ногти и не обрезайте кутикулу самостоятельно перед визитом. По возможности приходите в удобной обуви (особенно летом), чтобы не давить на свежеобработанные ногти. Если у вас грибок или вросшие ногти, сообщите при записи — подберём подходящую процедуру. Предварительно замачивать стопы не нужно — ванночка входит в процедуру.',
      },
      {
        question: 'Dla kogo jest pedicure leczniczy i kiedy warto go wybrać?',
        question_en: 'Who is therapeutic pedicure for and when is it worth choosing?',
        question_ru: 'Для кого предназначен лечебный педикюр и когда его стоит выбрать?',
        answer: 'Pedicure leczniczy jest idealny dla osób z wrastającymi paznokciami, grzybicą, pękającymi piętami, nadmiernymi zrogowaceniami lub odciskami. Polecamy go także diabetykom i seniorom, u których stopy wymagają szczególnie delikatnej i fachowej opieki. Jeśli standardowy pedicure nie rozwiązuje Twoich problemów ze stopami, pedicure leczniczy będzie odpowiednim wyborem.',
        answer_en: 'Therapeutic pedicure is ideal for people with ingrown nails, fungal infections, cracked heels, excessive calluses or corns. We also recommend it for diabetics and seniors whose feet require particularly gentle and professional care. If standard pedicure does not solve your foot problems, therapeutic pedicure is the right choice.',
        answer_ru: 'Лечебный педикюр идеален для людей с вросшими ногтями, грибком, потрескавшимися пятками, чрезмерными мозолями или натоптышами. Рекомендуем его также диабетикам и пожилым людям, стопы которых требуют особенно бережного и профессионального ухода. Если стандартный педикюр не решает ваших проблем со стопами, лечебный педикюр будет правильным выбором.',
      },
      {
        question: 'Jak dbać o stopy po pedicure?',
        question_en: 'How to care for feet after pedicure?',
        question_ru: 'Как ухаживать за стопами после педикюра?',
        answer: 'Stosuj krem nawilżający do stóp codziennie wieczorem — najlepiej z mocznikiem, który zapobiega rogowaceniu. Noś wygodne, przewiewne obuwie. Unikaj chodzenia boso po publicznych miejscach (basen, siłownia), aby zapobiec infekcjom grzybiczym. Jeśli masz lakier hybrydowy na paznokciach stóp, nie odklejaj go — przychodź na profesjonalne zdejmowanie co 3-4 tygodnie.',
        answer_en: 'Apply moisturizing foot cream every evening — preferably with urea, which prevents callus formation. Wear comfortable, breathable shoes. Avoid walking barefoot in public places (pool, gym) to prevent fungal infections. If you have hybrid polish on toenails, do not peel it off — come for professional removal every 3-4 weeks.',
        answer_ru: 'Наносите увлажняющий крем для стоп каждый вечер — желательно с мочевиной, которая предотвращает огрубение. Носите удобную, дышащую обувь. Избегайте хождения босиком в общественных местах (бассейн, спортзал), чтобы предотвратить грибковые инфекции. Если на ногтях стоп гибридный лак, не отдирайте его — приходите на профессиональное снятие каждые 3-4 недели.',
      },
    ],
    cta: {
      text: {
        pl: 'Czas zadbać o stopy? Zarezerwuj pedicure!',
        en: 'Time to care for your feet? Book a pedicure!',
        ru: 'Время позаботиться о стопах? Запишитесь на педикюр!',
      },
      link: '/services',
    },
    extendedIntro: {
      pl: 'Pedicure to nie tylko estetyka — to przede wszystkim zdrowie stóp. W salonie Katarzyna Brui w Białymstoku oferujemy pedicure klasyczny, hybrydowy oraz specjalistyczny z użyciem frezarki. Zadbamy o zrogowacenia, pękające pięty i wrastające paznokcie, a na koniec nałożymy piękny kolor. Regularne zabiegi pedicure zapobiegają problemom podologicznym i zapewniają komfort na co dzień.',
      en: 'Pedicure is not just about aesthetics — it\'s primarily about foot health. At Katarzyna Brui salon in Białystok, we offer classic, gel polish and specialized machine pedicure. We take care of calluses, cracked heels and ingrown nails, finishing with a beautiful color. Regular pedicure treatments prevent podological problems and ensure daily comfort.',
      ru: 'Педикюр — это не только эстетика, но прежде всего здоровье стоп. В салоне Катажина Бруи в Белостоке мы предлагаем классический, гель-лаковый и аппаратный педикюр. Позаботимся о натоптышах, трещинах на пятках и вросших ногтях, а в завершение нанесём красивый цвет. Регулярные процедуры педикюра предотвращают подологические проблемы и обеспечивают ежедневный комфорт.',
    },
    procedureSteps: [
      {
        title: { pl: 'Kąpiel stóp i zmiękczanie', en: 'Foot soak & softening', ru: 'Ванночка для ног и размягчение' },
        description: { pl: 'Moczymy stopy w ciepłej kąpieli z dodatkiem olejków eterycznych. Zmiękczamy skórę i przygotowujemy do dalszych etapów zabiegu.', en: 'We soak feet in a warm bath with essential oils. We soften the skin and prepare it for the next treatment stages.', ru: 'Замачиваем стопы в тёплой ванночке с эфирными маслами. Размягчаем кожу и подготавливаем к дальнейшим этапам процедуры.' },
      },
      {
        title: { pl: 'Usuwanie zrogowaceń i opracowanie stóp', en: 'Callus removal & foot work', ru: 'Удаление натоптышей и обработка стоп' },
        description: { pl: 'Usuwamy zrogowacenia, modzele i suche skórki za pomocą frezarki lub tarki podologicznej. Dbamy o pięty i boczne partie stóp.', en: 'We remove calluses, corns and dry skin using an e-file or podological rasp. We care for heels and sides of feet.', ru: 'Удаляем натоптыши, мозоли и сухую кожу с помощью фрезы или подологической тёрки. Ухаживаем за пятками и боковыми частями стоп.' },
      },
      {
        title: { pl: 'Pielęgnacja paznokci i skórek', en: 'Nail & cuticle care', ru: 'Уход за ногтями и кутикулой' },
        description: { pl: 'Nadajemy kształt paznokciom, usuwamy skórki i opracowujemy płytkę paznokciową. W razie potrzeby korygujemy wrastające paznokcie.', en: 'We shape the nails, remove cuticles and prepare the nail plate. If needed, we correct ingrown nails.', ru: 'Придаём форму ногтям, удаляем кутикулу и обрабатываем ногтевую пластину. При необходимости корректируем вросшие ногти.' },
      },
      {
        title: { pl: 'Lakierowanie i nawilżenie', en: 'Polish & moisturizing', ru: 'Покрытие лаком и увлажнение' },
        description: { pl: 'Nakładamy lakier klasyczny lub hybrydowy w wybranym kolorze. Na koniec aplikujemy intensywnie nawilżający krem do stóp i masaż relaksacyjny.', en: 'We apply classic or gel polish in the chosen color. Finally, we apply an intensely moisturizing foot cream and a relaxing massage.', ru: 'Наносим классический или гель-лак выбранного цвета. В завершение наносим интенсивно увлажняющий крем для стоп и расслабляющий массаж.' },
      },
    ],
    contraindications: [
      { pl: 'Głębokie infekcje grzybicze stóp', en: 'Deep fungal foot infections', ru: 'Глубокие грибковые инфекции стоп' },
      { pl: 'Otwarte rany na stopach', en: 'Open wounds on feet', ru: 'Открытые раны на стопах' },
      { pl: 'Cukrzyca z zaawansowaną neuropatią', en: 'Diabetes with advanced neuropathy', ru: 'Сахарный диабет с выраженной нейропатией' },
      { pl: 'Zaawansowana niewydolność żylna', en: 'Advanced venous insufficiency', ru: 'Выраженная венозная недостаточность' },
      { pl: 'Ostre zapalenie skóry stóp', en: 'Acute foot skin inflammation', ru: 'Острое воспаление кожи стоп' },
    ],
    pricingLink: {
      text: { pl: 'Zobacz cennik pedicure', en: 'View pedicure price list', ru: 'Смотреть прайс-лист педикюра' },
      url: '/prices',
    },
    showEffectsGallery: true,
  },

  // 8. Szkolenia
  {
    slug: 'szkolenia-kosmetyczne-bialystok',
    category: '',
    imageKey: 'permanentMakeup',
    hero: {
      title: {
        pl: 'Szkolenia Kosmetyczne w Białymstoku',
        en: 'Beauty Training Courses in Białystok',
        ru: 'Косметологические курсы в Белостоке',
      },
      subtitle: {
        pl: 'Profesjonalne kursy makijażu permanentnego, stylizacji rzęs, brwi i manicure.',
        en: 'Professional courses in permanent makeup, lash styling, brows and manicure.',
        ru: 'Профессиональные курсы перманентного макияжа, стилизации ресниц, бровей и маникюра.',
      },
    },
    seo: {
      title: {
        pl: 'Szkolenia Kosmetyczne Białystok — Makijaż Permanentny, Rzęsy | Katarzyna Brui',
        en: 'Beauty Training Białystok — Permanent Makeup, Lashes | Katarzyna Brui',
        ru: 'Косметологические курсы Белосток — Перманентный макияж, Ресницы | Катажина Бруи',
      },
      description: {
        pl: 'Profesjonalne szkolenia kosmetyczne w Białymstoku: makijaż permanentny, stylizacja rzęs, laminacja brwi, manicure. Certyfikat, praktyka na modelkach. Salon Katarzyna Brui.',
        en: 'Professional beauty training in Białystok: permanent makeup, lash styling, brow lamination, manicure. Certificate, practice on models. Katarzyna Brui Salon.',
        ru: 'Профессиональные косметологические курсы в Белостоке: перманентный макияж, стилизация ресниц, ламинирование бровей, маникюр. Сертификат, практика на моделях. Салон Катажина Бруи.',
      },
      keywords: {
        pl: 'szkolenia kosmetyczne Białystok, kurs makijażu permanentnego, szkolenie rzęsy, szkolenie brwi, kurs manicure Białystok, szkolenie linergistka',
        en: 'beauty training Białystok, permanent makeup course, lash course, brow course, manicure course Białystok',
        ru: 'косметологические курсы Белосток, курс перманентного макияжа, курс ресниц, курс бровей, курс маникюра Белосток',
      },
    },
    intro: {
      pl: 'Salon Katarzyna Brui w Białymstoku prowadzi profesjonalne szkolenia kosmetyczne dla początkujących i zaawansowanych. Nasze kursy obejmują makijaż permanentny, stylizację rzęs, laminację brwi oraz manicure. Każde szkolenie łączy teorię z intensywną praktyką na modelkach. Po ukończeniu otrzymujesz certyfikat i pełne wsparcie w rozpoczęciu kariery.',
      en: 'Katarzyna Brui Salon in Białystok conducts professional beauty training courses for beginners and advanced students. Our courses cover permanent makeup, lash styling, brow lamination and manicure. Each course combines theory with intensive practice on models. Upon completion, you receive a certificate and full support to start your career.',
      ru: 'Салон Катажина Бруи в Белостоке проводит профессиональные косметологические курсы для начинающих и опытных мастеров. Наши курсы охватывают перманентный макияж, стилизацию ресниц, ламинирование бровей и маникюр. Каждый курс сочетает теорию с интенсивной практикой на моделях. По окончании вы получаете сертификат и полную поддержку.',
    },
    benefits: [
      { pl: 'Certyfikat ukończenia kursu', en: 'Course completion certificate', ru: 'Сертификат об окончании курса' },
      { pl: 'Praktyka na modelkach pod okiem trenera', en: 'Practice on models under trainer supervision', ru: 'Практика на моделях под наблюдением тренера' },
      { pl: 'Materiały szkoleniowe i starter kit w cenie', en: 'Training materials and starter kit included', ru: 'Учебные материалы и стартовый набор включены' },
      { pl: 'Małe grupy — indywidualne podejście', en: 'Small groups — individual approach', ru: 'Маленькие группы — индивидуальный подход' },
      { pl: 'Wsparcie po szkoleniu — konsultacje i mentoring', en: 'Post-training support — consultations and mentoring', ru: 'Поддержка после обучения — консультации и менторство' },
    ],
    faq: [
      {
        question: 'Ile kosztuje szkolenie z makijażu permanentnego?',
        question_en: 'How much does permanent makeup training cost?',
        question_ru: 'Сколько стоит курс перманентного макияжа?',
        answer: 'Ceny szkoleń zaczynają się od 3000 PLN. W cenę wliczone są materiały szkoleniowe, starter kit, praktyka na modelkach i certyfikat. Szczegóły na stronie szkoleń.',
        answer_en: 'Training prices start from 3000 PLN. The price includes training materials, starter kit, practice on models and a certificate. Details on our training page.',
        answer_ru: 'Цены на обучение начинаются от 3000 PLN. В стоимость включены учебные материалы, стартовый набор, практика на моделях и сертификат. Подробности на странице курсов.',
      },
      {
        question: 'Czy potrzebuję doświadczenia, żeby zapisać się na kurs?',
        question_en: 'Do I need experience to sign up for a course?',
        question_ru: 'Нужен ли опыт для записи на курс?',
        answer: 'Nie, nasze szkolenia są dostosowane zarówno dla początkujących, jak i osób z doświadczeniem. Szkolenie od podstaw zawiera wszystko, czego potrzebujesz, aby rozpocząć pracę w branży.',
        answer_en: 'No, our courses are adapted for both beginners and experienced people. The beginner course covers everything you need to start working in the industry.',
        answer_ru: 'Нет, наши курсы адаптированы как для начинающих, так и для опытных мастеров. Курс с нуля включает всё необходимое для начала работы в индустрии.',
      },
      {
        question: 'Jak długo trwa szkolenie?',
        question_en: 'How long does the training take?',
        question_ru: 'Сколько длится обучение?',
        answer: 'Czas trwania zależy od kursu. Szkolenie z makijażu permanentnego trwa 3-5 dni, kurs stylizacji rzęs 2-3 dni, a kurs manicure 2-3 dni. Dokładne informacje na stronie każdego kursu.',
        answer_en: 'Duration depends on the course. Permanent makeup training takes 3-5 days, lash styling course 2-3 days, manicure course 2-3 days. Exact details on each course page.',
        answer_ru: 'Продолжительность зависит от курса. Обучение перманентному макияжу длится 3-5 дней, курс стилизации ресниц 2-3 дня, курс маникюра 2-3 дня. Подробности на странице каждого курса.',
      },
      {
        question: 'Czy po szkoleniu otrzymam certyfikat?',
        question_en: 'Will I receive a certificate after the training?',
        question_ru: 'Получу ли я сертификат после обучения?',
        answer: 'Tak, każda uczestniczka otrzymuje immienny certyfikat ukończenia szkolenia w języku polskim i angielskim. Certyfikat potwierdza zdobyte umiejętności i jest honorowany w branży beauty. Dodatkowo oferujemy wsparcie mentorskie po kursie — możesz konsultować z nami swoje pierwsze prace.',
        answer_en: 'Yes, each participant receives a personalized training completion certificate in Polish and English. The certificate confirms acquired skills and is recognized in the beauty industry. Additionally, we offer mentoring support after the course — you can consult us about your first works.',
        answer_ru: 'Да, каждая участница получает именной сертификат об окончании обучения на польском и английском языках. Сертификат подтверждает полученные навыки и признаётся в индустрии красоты. Дополнительно мы предлагаем менторскую поддержку после курса — вы можете консультироваться с нами по своим первым работам.',
      },
      {
        question: 'Jakie materiały i narzędzia są zapewnione na szkoleniu?',
        question_en: 'What materials and tools are provided during the training?',
        question_ru: 'Какие материалы и инструменты предоставляются на обучении?',
        answer: 'W cenę szkolenia wliczone są wszystkie materiały potrzebne do nauki: pigmenty, igły, ćwiczebne skórki (lateksowe), sprzęt i jednorazowe akcesoria. Otrzymujesz również starter kit z podstawowymi narzędziami do samodzielnej pracy po kursie. Nie musisz kupować niczego dodatkowego, aby rozpocząć szkolenie.',
        answer_en: 'All learning materials are included in the training price: pigments, needles, practice skins (latex), equipment and disposable accessories. You also receive a starter kit with basic tools for independent work after the course. You do not need to buy anything extra to begin the training.',
        answer_ru: 'В стоимость обучения включены все необходимые материалы: пигменты, иглы, тренировочные кожи (латексные), оборудование и одноразовые принадлежности. Вы также получаете стартовый набор с основными инструментами для самостоятельной работы после курса. Вам не нужно покупать ничего дополнительно для начала обучения.',
      },
      {
        question: 'Czy szkolenie obejmuje praktykę na modelkach?',
        question_en: 'Does the training include practice on models?',
        question_ru: 'Включает ли обучение практику на моделях?',
        answer: 'Tak, każde szkolenie składa się z części teoretycznej i praktycznej. Ćwiczysz najpierw na sztucznej skórce pod okiem instruktora, a następnie wykonujesz zabieg na prawdziwej modelce. Modelki są zapewnione przez nas. Dzięki temu kończysz kurs z realnym doświadczeniem i gotowością do pracy z klientkami.',
        answer_en: 'Yes, every training consists of theoretical and practical parts. You first practice on artificial skin under the instructor\'s guidance, then perform the procedure on a real model. Models are provided by us. This way you finish the course with real experience and readiness to work with clients.',
        answer_ru: 'Да, каждое обучение состоит из теоретической и практической части. Сначала вы тренируетесь на искусственной коже под руководством инструктора, затем выполняете процедуру на настоящей модели. Моделей обеспечиваем мы. Таким образом, вы заканчиваете курс с реальным опытом и готовностью к работе с клиентами.',
      },
    ],
    cta: {
      text: {
        pl: 'Chcesz zostać profesjonalistką? Zapisz się na szkolenie!',
        en: 'Want to become a professional? Sign up for training!',
        ru: 'Хотите стать профессионалом? Запишитесь на курс!',
      },
      link: '/training',
    },
    extendedIntro: {
      pl: 'Nasze szkolenia kosmetyczne w Białymstoku to kompleksowe programy skierowane zarówno do początkujących, jak i praktyków chcących podnieść kwalifikacje. Prowadzone przez Katarzynę Brui — doświadczoną kosmetyczkę z wieloletnią praktyką — kursy łączą solidną teorię z intensywną praktyką na modelkach. Po ukończeniu otrzymujesz certyfikat i wsparcie mentorskie.',
      en: 'Our beauty trainings in Białystok are comprehensive programs designed for both beginners and practitioners looking to upgrade their skills. Led by Katarzyna Brui — an experienced cosmetician with years of practice — courses combine solid theory with intensive hands-on practice on models. Upon completion, you receive a certificate and mentoring support.',
      ru: 'Наши косметические курсы в Белостоке — это комплексные программы, предназначенные как для начинающих, так и для практикующих специалистов, желающих повысить квалификацию. Под руководством Катажины Бруи — опытного косметолога с многолетней практикой — курсы сочетают основательную теорию с интенсивной практикой на моделях. По окончании вы получаете сертификат и менторскую поддержку.',
    },
    procedureSteps: [
      {
        title: { pl: 'Zgłoszenie i konsultacja', en: 'Enrollment & consultation', ru: 'Запись и консультация' },
        description: { pl: 'Kontaktujesz się z nami, omawiamy Twoje doświadczenie i cele. Dobieramy odpowiedni poziom szkolenia i ustalamy termin.', en: 'You contact us, we discuss your experience and goals. We select the appropriate training level and set the date.', ru: 'Вы связываетесь с нами, мы обсуждаем ваш опыт и цели. Подбираем подходящий уровень обучения и назначаем дату.' },
      },
      {
        title: { pl: 'Część teoretyczna', en: 'Theoretical part', ru: 'Теоретическая часть' },
        description: { pl: 'Poznajemy teorię: anatomię, kolorystykę, techniki, zasady higieny i bezpieczeństwa. Każda uczestniczka otrzymuje materiały szkoleniowe.', en: 'We cover theory: anatomy, color science, techniques, hygiene and safety rules. Each participant receives training materials.', ru: 'Изучаем теорию: анатомию, колористику, техники, правила гигиены и безопасности. Каждая участница получает учебные материалы.' },
      },
      {
        title: { pl: 'Praktyka na modelkach', en: 'Practice on models', ru: 'Практика на моделях' },
        description: { pl: 'Pod okiem instruktora wykonujesz zabiegi na prawdziwych modelkach. Modelki zapewniamy my — Ty skupiasz się na nauce.', en: 'Under instructor supervision, you perform treatments on real models. We provide the models — you focus on learning.', ru: 'Под руководством инструктора выполняете процедуры на настоящих моделях. Моделей обеспечиваем мы — вы сосредоточитесь на обучении.' },
      },
      {
        title: { pl: 'Certyfikat i wsparcie', en: 'Certificate & support', ru: 'Сертификат и поддержка' },
        description: { pl: 'Otrzymujesz certyfikat ukończenia szkolenia (PL/EN) i starter kit z narzędziami. Po kursie oferujemy wsparcie mentorskie — konsultuj z nami swoje pierwsze prace.', en: 'You receive a training completion certificate (PL/EN) and a starter kit with tools. After the course, we offer mentoring support — consult us about your first works.', ru: 'Получаете сертификат об окончании обучения (PL/EN) и стартовый набор инструментов. После курса предлагаем менторскую поддержку — консультируйтесь с нами по первым работам.' },
      },
    ],
    showEffectsGallery: false,
  },
];

export const LANDING_PAGE_SLUGS: string[] = LANDING_PAGES.map(p => p.slug);

export const getLandingPageBySlug = (slug: string): LandingPageConfig | undefined =>
  LANDING_PAGES.find(p => p.slug === slug);
