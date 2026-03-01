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
        pl: 'makijaż permanentny Białystok, microblading Białystok, makijaż permanentny brwi, makijaż permanentny ust, metoda pudrowa brwi, ombre brwi, linergistka Białystok, najlepszy makijaż permanentny Białystok, makijaż permanentny cena',
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
    ],
    cta: {
      text: {
        pl: 'Chcesz naturalnie piękne brwi? Umów wizytę!',
        en: 'Want naturally beautiful brows? Book an appointment!',
        ru: 'Хотите естественно красивые брови? Запишитесь!',
      },
      link: '/services',
    },
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
        pl: 'przedłużanie rzęs Białystok, stylizacja rzęs Białystok, rzęsy 1:1, rzęsy objętościowe, laminacja rzęs Białystok, lifting rzęs Białystok, rzęsy 2D 3D, przedłużanie rzęs cena Białystok',
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
    ],
    cta: {
      text: {
        pl: 'Gotowa na piękne rzęsy? Zarezerwuj termin!',
        en: 'Ready for beautiful lashes? Book your appointment!',
        ru: 'Готовы к красивым ресницам? Запишитесь!',
      },
      link: '/services',
    },
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
        pl: 'laminacja brwi Białystok, henna brwi Białystok, regulacja brwi, botox brwi, pielęgnacja brwi Białystok, henna pudrowa, styling brwi',
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
    ],
    cta: {
      text: {
        pl: 'Chcesz idealne brwi? Zarezerwuj wizytę!',
        en: 'Want perfect brows? Book your visit!',
        ru: 'Хотите идеальные брови? Запишитесь!',
      },
      link: '/services',
    },
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
        pl: 'peeling węglowy Białystok, peeling węglowy cena, laserowe oczyszczanie skóry, carbon peeling, peeling laserowy Białystok, oczyszczanie twarzy Białystok',
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
    ],
    cta: {
      text: {
        pl: 'Chcesz promienną cerę? Zarezerwuj zabieg!',
        en: 'Want radiant skin? Book your treatment!',
        ru: 'Хотите сияющую кожу? Запишитесь на процедуру!',
      },
      link: '/services',
    },
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
        pl: 'usuwanie tatuażu Białystok, laserowe usuwanie tatuażu, usuwanie makijażu permanentnego, laser Nd:YAG, usuwanie tatuażu cena Białystok',
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
    ],
    cta: {
      text: {
        pl: 'Chcesz pozbyć się tatuażu? Umów konsultację!',
        en: 'Want to get rid of a tattoo? Book a consultation!',
        ru: 'Хотите избавиться от тату? Запишитесь на консультацию!',
      },
      link: '/services',
    },
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
        pl: 'manicure Białystok, manicure hybrydowy Białystok, manicure żelowy, manicure klasyczny, manicure japoński Białystok, paznokcie Białystok, manicure cena Białystok',
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
    ],
    cta: {
      text: {
        pl: 'Czas na piękne paznokcie? Umów wizytę!',
        en: 'Time for beautiful nails? Book now!',
        ru: 'Время для красивых ногтей? Запишитесь!',
      },
      link: '/services',
    },
  },

  // 7. Szkolenia
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
    ],
    cta: {
      text: {
        pl: 'Chcesz zostać profesjonalistką? Zapisz się na szkolenie!',
        en: 'Want to become a professional? Sign up for training!',
        ru: 'Хотите стать профессионалом? Запишитесь на курс!',
      },
      link: '/training',
    },
  },
];

export const LANDING_PAGE_SLUGS: string[] = LANDING_PAGES.map(p => p.slug);

export const getLandingPageBySlug = (slug: string): LandingPageConfig | undefined =>
  LANDING_PAGES.find(p => p.slug === slug);
