import { ContentBlock } from '../../types';

export interface BlogPostTemplate {
  title: string;
  title_en: string;
  title_ru: string;
  slug: string;
  category: string;
  excerpt: string;
  excerpt_en: string;
  excerpt_ru: string;
  content_blocks: ContentBlock[];
}

export const blogTemplates: BlogPostTemplate[] = [
  {
    title: 'Nowy artykuł o makijażu permanentnym',
    title_en: 'New permanent makeup article',
    title_ru: 'Новая статья о перманентном макияже',
    slug: 'nowy-artykul-makijaz-permanentny',
    category: 'permanent_makeup',
    excerpt: 'Dowiedz się więcej o makijażu permanentnym w salonie Katarzyna Brui w Białymstoku.',
    excerpt_en: 'Learn more about permanent makeup at Katarzyna Brui salon in Bialystok.',
    excerpt_ru: 'Узнайте больше о перманентном макияже в салоне Катажина Бруй в Белостоке.',
    content_blocks: [
      { id: 'tpl1-1', type: 'text', text: 'Wprowadzenie do artykułu...', text_en: 'Article introduction...', text_ru: 'Введение в статью...' },
      { id: 'tpl1-2', type: 'heading', text: 'Sekcja główna', text_en: 'Main section', text_ru: 'Основной раздел', level: 2 },
      { id: 'tpl1-3', type: 'text', text: 'Treść sekcji głównej...', text_en: 'Main section content...', text_ru: 'Содержание основного раздела...' },
      { id: 'tpl1-4', type: 'heading', text: 'Podsumowanie', text_en: 'Summary', text_ru: 'Итоги', level: 2 },
      { id: 'tpl1-5', type: 'text', text: 'Zapraszamy do salonu Katarzyna Brui przy ul. Młynowej 46 w Białymstoku!', text_en: 'Visit Katarzyna Brui salon at ul. Mlynowa 46 in Bialystok!', text_ru: 'Приглашаем в салон Катажина Бруй по ул. Млынова 46 в Белостоке!' },
    ] as ContentBlock[],
  },
  {
    title: 'Nowy artykuł o brwiach i rzęsach',
    title_en: 'New brows & lashes article',
    title_ru: 'Новая статья о бровях и ресницах',
    slug: 'nowy-artykul-brwi-rzesy',
    category: 'brows_lashes',
    excerpt: 'Poznaj nasze zabiegi stylizacji brwi i rzęs w Białymstoku.',
    excerpt_en: 'Discover our brow and lash styling treatments in Bialystok.',
    excerpt_ru: 'Откройте для себя наши процедуры по уходу за бровями и ресницами в Белостоке.',
    content_blocks: [
      { id: 'tpl2-1', type: 'text', text: 'Wprowadzenie...', text_en: 'Introduction...', text_ru: 'Введение...' },
      { id: 'tpl2-2', type: 'heading', text: 'Na czym polega zabieg?', text_en: 'What does the treatment involve?', text_ru: 'В чем заключается процедура?', level: 2 },
      { id: 'tpl2-3', type: 'text', text: 'Opis zabiegu...', text_en: 'Treatment description...', text_ru: 'Описание процедуры...' },
    ] as ContentBlock[],
  },
  {
    title: 'Nowy artykuł o manicure',
    title_en: 'New manicure article',
    title_ru: 'Новая статья о маникюре',
    slug: 'nowy-artykul-manicure',
    category: 'manicure',
    excerpt: 'Odkryj najnowsze trendy manicure w naszym salonie w Białymstoku.',
    excerpt_en: 'Discover the latest manicure trends at our salon in Bialystok.',
    excerpt_ru: 'Откройте для себя последние тренды маникюра в нашем салоне в Белостоке.',
    content_blocks: [
      { id: 'tpl3-1', type: 'text', text: 'Wprowadzenie...', text_en: 'Introduction...', text_ru: 'Введение...' },
      { id: 'tpl3-2', type: 'heading', text: 'Trendy sezonu', text_en: 'Season trends', text_ru: 'Тренды сезона', level: 2 },
      { id: 'tpl3-3', type: 'text', text: 'Opis trendów...', text_en: 'Trends description...', text_ru: 'Описание трендов...' },
    ] as ContentBlock[],
  },
  {
    title: 'Nowy artykuł z poradami',
    title_en: 'New tips article',
    title_ru: 'Новая статья с советами',
    slug: 'nowy-artykul-porady',
    category: 'tips',
    excerpt: 'Praktyczne porady kosmetyczne od specjalistek salonu Katarzyna Brui.',
    excerpt_en: 'Practical beauty tips from Katarzyna Brui salon specialists.',
    excerpt_ru: 'Практические косметические советы от специалистов салона Катажина Бруй.',
    content_blocks: [
      { id: 'tpl4-1', type: 'text', text: 'Wprowadzenie...', text_en: 'Introduction...', text_ru: 'Введение...' },
      { id: 'tpl4-2', type: 'heading', text: 'Nasze wskazówki', text_en: 'Our tips', text_ru: 'Наши советы', level: 2 },
      { id: 'tpl4-3', type: 'list', items: ['Wskazówka 1', 'Wskazówka 2', 'Wskazówka 3'], items_en: ['Tip 1', 'Tip 2', 'Tip 3'], items_ru: ['Совет 1', 'Совет 2', 'Совет 3'], style: 'check' as const },
    ] as ContentBlock[],
  },
];

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[ąa]/g, 'a').replace(/[ćc]/g, 'c').replace(/[ęe]/g, 'e')
    .replace(/[łl]/g, 'l').replace(/[ńn]/g, 'n').replace(/[óo]/g, 'o')
    .replace(/[śs]/g, 's').replace(/[źżz]/g, 'z')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};
