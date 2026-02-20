import { ContentBlock } from '../../types';

export interface TrainingTemplate {
  title: string;
  title_en: string;
  title_ru: string;
  slug: string;
  category: string;
  description: string;
  description_en: string;
  description_ru: string;
  price: string;
  price_en: string;
  price_ru: string;
  duration: string;
  duration_en: string;
  duration_ru: string;
  content_blocks: ContentBlock[];
}

export const trainingTemplates: TrainingTemplate[] = [
  {
    title: 'Makijaż Permanentny',
    title_en: 'Permanent Makeup',
    title_ru: 'Перманентный макияж',
    slug: 'makijaz-permanentny',
    category: 'permanent_makeup',
    description: 'Kompleksowe szkolenie z makijażu permanentnego — brwi, usta, kreska.',
    description_en: 'Comprehensive permanent makeup training — brows, lips, eyeliner.',
    description_ru: 'Комплексное обучение перманентному макияжу — брови, губы, стрелки.',
    price: 'od 3 500 PLN',
    price_en: 'from 3 500 PLN',
    price_ru: 'от 3 500 PLN',
    duration: '5 dni (40h)',
    duration_en: '5 days (40h)',
    duration_ru: '5 дней (40ч)',
    content_blocks: [
      { id: crypto.randomUUID(), type: 'heading', text: 'Dla kogo jest to szkolenie?', text_en: 'Who is this training for?', text_ru: 'Для кого это обучение?', level: 2 },
      { id: crypto.randomUUID(), type: 'text', text: 'Szkolenie skierowane jest zarówno do osób początkujących, jak i do praktyków pragnących poszerzyć swoje umiejętności o techniki makijażu permanentnego.', text_en: 'The training is designed for both beginners and practitioners looking to expand their skills with permanent makeup techniques.', text_ru: 'Обучение предназначено как для начинающих, так и для практиков, стремящихся расширить свои навыки техниками перманентного макияжа.' },
      { id: crypto.randomUUID(), type: 'heading', text: 'Program szkolenia', text_en: 'Training program', text_ru: 'Программа обучения', level: 2 },
      { id: crypto.randomUUID(), type: 'list', items: ['Teoria koloru i kolorystyka skóry', 'Technika pudrowa (Powder Brows)', 'Technika mikroblading', 'Makijaż permanentny ust', 'Kreska permanentna', 'Praca na modelkach'], items_en: ['Color theory and skin colorimetry', 'Powder Brows technique', 'Microblading technique', 'Permanent lip makeup', 'Permanent eyeliner', 'Work on live models'], items_ru: ['Теория цвета и колориметрия кожи', 'Техника пудровых бровей', 'Техника микроблейдинг', 'Перманентный макияж губ', 'Перманентные стрелки', 'Работа на моделях'], style: 'check' },
      { id: crypto.randomUUID(), type: 'heading', text: 'Co otrzymujesz?', text_en: 'What do you get?', text_ru: 'Что вы получаете?', level: 2 },
      { id: crypto.randomUUID(), type: 'list', items: ['Certyfikat ukończenia szkolenia', 'Starter kit z maszynką i pigmentami', 'Wsparcie mentorskie przez 3 miesiące'], items_en: ['Training completion certificate', 'Starter kit with machine and pigments', '3-month mentoring support'], items_ru: ['Сертификат об окончании обучения', 'Стартовый набор с аппаратом и пигментами', 'Менторская поддержка 3 месяца'], style: 'check' },
    ],
  },
  {
    title: 'Stylizacja Paznokci — Manikiur',
    title_en: 'Nail Styling — Manicure',
    title_ru: 'Стилизация ногтей — Маникюр',
    slug: 'manikiur',
    category: 'manicure',
    description: 'Profesjonalne szkolenie z manikiuru — techniki hybrydowe, żelowe i klasyczne.',
    description_en: 'Professional manicure training — hybrid, gel and classic techniques.',
    description_ru: 'Профессиональное обучение маникюру — гибридные, гелевые и классические техники.',
    price: 'od 2 000 PLN',
    price_en: 'from 2 000 PLN',
    price_ru: 'от 2 000 PLN',
    duration: '3 dni (24h)',
    duration_en: '3 days (24h)',
    duration_ru: '3 дня (24ч)',
    content_blocks: [
      { id: crypto.randomUUID(), type: 'heading', text: 'Dla kogo jest to szkolenie?', text_en: 'Who is this training for?', text_ru: 'Для кого это обучение?', level: 2 },
      { id: crypto.randomUUID(), type: 'text', text: 'Kurs jest idealny dla osób chcących rozpocząć pracę jako stylistka paznokci lub rozszerzyć swoją ofertę o profesjonalny manikiur.', text_en: 'The course is ideal for those who want to start working as a nail stylist or expand their services with professional manicure.', text_ru: 'Курс идеален для тех, кто хочет начать работу мастером маникюра или расширить свои услуги.' },
      { id: crypto.randomUUID(), type: 'heading', text: 'Program szkolenia', text_en: 'Training program', text_ru: 'Программа обучения', level: 2 },
      { id: crypto.randomUUID(), type: 'list', items: ['Budowa i choroby paznokcia', 'Manikiur klasyczny', 'Manikiur hybrydowy', 'Przedłużanie żelem', 'Zdobienia — french, ombre', 'Pielęgnacja skórek'], items_en: ['Nail structure and diseases', 'Classic manicure', 'Hybrid manicure', 'Gel extensions', 'Decorations — french, ombre', 'Cuticle care'], items_ru: ['Строение и заболевания ногтей', 'Классический маникюр', 'Гибридный маникюр', 'Наращивание гелем', 'Дизайн — френч, омбре', 'Уход за кутикулой'], style: 'check' },
      { id: crypto.randomUUID(), type: 'heading', text: 'Co otrzymujesz?', text_en: 'What do you get?', text_ru: 'Что вы получаете?', level: 2 },
      { id: crypto.randomUUID(), type: 'list', items: ['Certyfikat ukończenia kursu', 'Zestaw startowy z lampą UV/LED', 'Wsparcie po szkoleniu'], items_en: ['Course completion certificate', 'Starter kit with UV/LED lamp', 'Post-training support'], items_ru: ['Сертификат об окончании курса', 'Стартовый набор с UV/LED лампой', 'Поддержка после обучения'], style: 'check' },
    ],
  },
  {
    title: 'Stylizacja Brwi',
    title_en: 'Brow Styling',
    title_ru: 'Стилизация бровей',
    slug: 'brwi',
    category: 'brows',
    description: 'Szkolenie z profesjonalnej stylizacji brwi — henna, laminacja, geometria, microblading.',
    description_en: 'Professional brow styling training — henna, lamination, geometry, microblading.',
    description_ru: 'Обучение профессиональной стилизации бровей — хна, ламинирование, геометрия, микроблейдинг.',
    price: 'od 1 800 PLN',
    price_en: 'from 1 800 PLN',
    price_ru: 'от 1 800 PLN',
    duration: '2 dni (16h)',
    duration_en: '2 days (16h)',
    duration_ru: '2 дня (16ч)',
    content_blocks: [
      { id: crypto.randomUUID(), type: 'heading', text: 'Dla kogo jest to szkolenie?', text_en: 'Who is this training for?', text_ru: 'Для кого это обучение?', level: 2 },
      { id: crypto.randomUUID(), type: 'text', text: 'Szkolenie jest przeznaczone dla kosmetyczek, stylistek i osób chcących specjalizować się w usługach brwiowych.', text_en: 'The training is designed for beauticians, stylists and those who want to specialize in brow services.', text_ru: 'Обучение предназначено для косметологов, стилистов и тех, кто хочет специализироваться на услугах для бровей.' },
      { id: crypto.randomUUID(), type: 'heading', text: 'Program szkolenia', text_en: 'Training program', text_ru: 'Программа обучения', level: 2 },
      { id: crypto.randomUUID(), type: 'list', items: ['Geometria brwi — pomiary i symetria', 'Henna pudrowa i klasyczna', 'Laminacja brwi', 'Technika microblading', 'Koloryzacja brwi', 'Pielęgnacja pozabiegowa'], items_en: ['Brow geometry — measurements and symmetry', 'Powder and classic henna', 'Brow lamination', 'Microblading technique', 'Brow tinting', 'Post-treatment care'], items_ru: ['Геометрия бровей — измерения и симметрия', 'Пудровая и классическая хна', 'Ламинирование бровей', 'Техника микроблейдинг', 'Окрашивание бровей', 'Послепроцедурный уход'], style: 'check' },
      { id: crypto.randomUUID(), type: 'heading', text: 'Co otrzymujesz?', text_en: 'What do you get?', text_ru: 'Что вы получаете?', level: 2 },
      { id: crypto.randomUUID(), type: 'list', items: ['Certyfikat ukończenia szkolenia', 'Zestaw do henny i laminacji', 'Konsultacje po szkoleniu'], items_en: ['Training completion certificate', 'Henna and lamination kit', 'Post-training consultations'], items_ru: ['Сертификат об окончании обучения', 'Набор для хны и ламинирования', 'Консультации после обучения'], style: 'check' },
    ],
  },
  {
    title: 'Przedłużanie Rzęs',
    title_en: 'Eyelash Extensions',
    title_ru: 'Наращивание ресниц',
    slug: 'przedluzanie-rzes',
    category: 'lashes',
    description: 'Szkolenie z przedłużania rzęs — techniki 1:1, objętościowe i mega volume.',
    description_en: 'Eyelash extension training — 1:1, volume and mega volume techniques.',
    description_ru: 'Обучение наращиванию ресниц — техники 1:1, объёмные и мега объём.',
    price: 'od 2 500 PLN',
    price_en: 'from 2 500 PLN',
    price_ru: 'от 2 500 PLN',
    duration: '3 dni (24h)',
    duration_en: '3 days (24h)',
    duration_ru: '3 дня (24ч)',
    content_blocks: [
      { id: crypto.randomUUID(), type: 'heading', text: 'Dla kogo jest to szkolenie?', text_en: 'Who is this training for?', text_ru: 'Для кого это обучение?', level: 2 },
      { id: crypto.randomUUID(), type: 'text', text: 'Kurs przeznaczony jest dla osób chcących profesjonalnie zajmować się przedłużaniem rzęs — zarówno początkujących, jak i zaawansowanych.', text_en: 'The course is designed for those who want to professionally work with eyelash extensions — both beginners and advanced.', text_ru: 'Курс предназначен для тех, кто хочет профессионально заниматься наращиванием ресниц — как для начинающих, так и для продвинутых.' },
      { id: crypto.randomUUID(), type: 'heading', text: 'Program szkolenia', text_en: 'Training program', text_ru: 'Программа обучения', level: 2 },
      { id: crypto.randomUUID(), type: 'list', items: ['Technika klasyczna 1:1', 'Technika objętościowa 2D-6D', 'Technika Mega Volume', 'Dobór kształtu rzęs do oka', 'Izolacja i praca z kleiami', 'Praca na modelkach'], items_en: ['Classic 1:1 technique', 'Volume technique 2D-6D', 'Mega Volume technique', 'Lash shape selection for eye shape', 'Isolation and adhesive work', 'Work on live models'], items_ru: ['Классическая техника 1:1', 'Объёмная техника 2D-6D', 'Техника Мега Объём', 'Подбор формы ресниц к форме глаза', 'Изоляция и работа с клеями', 'Работа на моделях'], style: 'check' },
      { id: crypto.randomUUID(), type: 'heading', text: 'Co otrzymujesz?', text_en: 'What do you get?', text_ru: 'Что вы получаете?', level: 2 },
      { id: crypto.randomUUID(), type: 'list', items: ['Certyfikat ukończenia szkolenia', 'Profesjonalny zestaw startowy', 'Wsparcie mentorskie przez 2 miesiące'], items_en: ['Training completion certificate', 'Professional starter kit', '2-month mentoring support'], items_ru: ['Сертификат об окончании обучения', 'Профессиональный стартовый набор', 'Менторская поддержка 2 месяца'], style: 'check' },
    ],
  },
];

export const generateSlug = (text: string): string => {
  const polishMap: Record<string, string> = {
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
    'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'Ą': 'a', 'Ć': 'c', 'Ę': 'e', 'Ł': 'l', 'Ń': 'n',
    'Ó': 'o', 'Ś': 's', 'Ź': 'z', 'Ż': 'z',
  };
  return text
    .toLowerCase()
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, c => polishMap[c] || c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};
