import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLocalizedNavigate } from '../hooks/useLocalizedPath';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { Service } from '../types';
import { ServiceSection } from '../components/ServiceSection';
import { BookingModal } from '../components/BookingModal';
import { serviceImages } from '../assets/images';
import { SEO } from '../components/SEO';
import { ServiceSchema, BreadcrumbSchema, BASE_URL } from '../components/schema';
import { getCategoryName } from '../utils/serviceTranslation';
import { getCategorySlug, getCategoryNameFromSlug } from '../utils/categorySlugMap';
import { prerenderReady } from '../utils/prerenderReady';
import { getBlogCategoriesForServiceCategory } from '../data/contentRelationships';
import { BlogPost } from '../types';
import { getLocalizedField } from '../utils/blockRenderer';
import { LocalizedLink } from '../components/LocalizedLink';

interface CategorySEO {
  title: string;
  description: string;
  keywords: string[];
}

interface MultiLangCategorySEO {
  pl: CategorySEO;
  en: CategorySEO;
  ru: CategorySEO;
}

const categorySEOData: Record<string, MultiLangCategorySEO> = {
  'makijaz-permanentny': {
    pl: {
      title: 'Makijaż Permanentny Białystok - Brwi, Usta, Oczy',
      description: 'Profesjonalny makijaż permanentny brwi, ust i oczu w Białymstoku. Microblading, metoda pudrowa, ombre. Bezpłatna konsultacja. Umów wizytę - Salon Katarzyna Brui.',
      keywords: ['makijaż permanentny Białystok', 'makijaż permanentny brwi Białystok', 'makijaż permanentny ust Białystok', 'microblading Białystok', 'makijaż permanentny brwi cena', 'metoda pudrowa brwi Białystok', 'ombre brwi permanentne', 'pigmentacja brwi Białystok', 'linergistka Białystok', 'najlepszy makijaż permanentny Białystok'],
    },
    en: {
      title: 'Permanent Makeup Białystok - Brows, Lips, Eyes',
      description: 'Professional permanent makeup for brows, lips and eyes in Białystok. Microblading, powder brows, ombre. Free consultation. Book now - Katarzyna Brui Salon.',
      keywords: ['permanent makeup Białystok', 'microblading Białystok', 'powder brows Białystok', 'permanent brow makeup', 'ombre brows', 'permanent lip makeup Białystok', 'best permanent makeup Białystok'],
    },
    ru: {
      title: 'Перманентный макияж Белосток - Брови, Губы, Глаза',
      description: 'Профессиональный перманентный макияж бровей, губ и глаз в Белостоке. Микроблейдинг, пудровая техника, омбре. Бесплатная консультация. Запишитесь - Салон Катажина Бруй.',
      keywords: ['перманентный макияж Белосток', 'микроблейдинг Белосток', 'пудровые брови Белосток', 'перманент бровей', 'перманент губ Белосток', 'омбре брови'],
    },
  },
  'stylizacja-rzes': {
    pl: {
      title: 'Przedłużanie i Laminacja Rzęs Białystok',
      description: 'Profesjonalne przedłużanie rzęs 1:1, 2-3D, Russian Volume oraz laminacja i lifting rzęs w Białymstoku. Naturalne efekty. Umów wizytę - Salon Katarzyna Brui.',
      keywords: ['przedłużanie rzęs Białystok', 'stylizacja rzęs Białystok', 'rzęsy 1:1 Białystok', 'rzęsy objętościowe Białystok', 'Russian Volume rzęsy Białystok', 'ile kosztuje przedłużanie rzęs', 'salon rzęs Białystok'],
    },
    en: {
      title: 'Lash Extensions & Lash Lift Białystok',
      description: 'Professional lash extensions 1:1, 2-3D, Russian Volume and lash lift in Białystok. Natural look. Book now - Katarzyna Brui Salon.',
      keywords: ['lash extensions Białystok', 'Russian Volume lashes Białystok', 'lash lift Białystok', 'eyelash extensions Poland', 'best lash extensions Białystok'],
    },
    ru: {
      title: 'Наращивание и ламинирование ресниц Белосток',
      description: 'Профессиональное наращивание ресниц 1:1, 2-3D, Russian Volume и ламинирование ресниц в Белостоке. Натуральный эффект. Запишитесь - Салон Катажина Бруй.',
      keywords: ['наращивание ресниц Белосток', 'ресницы Russian Volume Белосток', 'ламинирование ресниц Белосток', 'наращивание ресниц цена Белосток'],
    },
  },
  'rzesy': {
    pl: {
      title: 'Lifting i Botox Rzęs Białystok',
      description: 'Lifting rzęs, botox rzęs i henna rzęs w Białymstoku. Naturalnie podkręcone i odżywione rzęsy. Efekty do 8 tygodni. Umów wizytę - Salon Katarzyna Brui.',
      keywords: ['lifting rzęs Białystok', 'laminacja rzęs Białystok', 'botox rzęs Białystok', 'henna rzęs Białystok', 'lifting rzęs cena', 'ile kosztuje lifting rzęs'],
    },
    en: {
      title: 'Lash Lift & Lash Botox Białystok',
      description: 'Lash lift, lash botox and lash tinting in Białystok. Naturally curled and nourished lashes. Results up to 8 weeks. Book now - Katarzyna Brui Salon.',
      keywords: ['lash lift Białystok', 'lash botox Białystok', 'lash tinting Białystok', 'lash lamination Białystok'],
    },
    ru: {
      title: 'Лифтинг и ботокс ресниц Белосток',
      description: 'Лифтинг ресниц, ботокс ресниц и окрашивание ресниц в Белостоке. Естественно подкрученные и ухоженные ресницы. Эффект до 8 недель. Запишитесь - Салон Катажина Бруй.',
      keywords: ['лифтинг ресниц Белосток', 'ботокс ресниц Белосток', 'окрашивание ресниц Белосток', 'ламинирование ресниц Белосток'],
    },
  },
  'pielegnacja-brwi': {
    pl: {
      title: 'Laminacja i Henna Brwi Białystok',
      description: 'Laminacja brwi, henna pudrowa, regulacja i stylizacja brwi w Białymstoku. Profesjonalna architektura brwi. Efekty do 6 tygodni. Umów wizytę online.',
      keywords: ['laminacja brwi Białystok', 'henna brwi Białystok', 'regulacja brwi Białystok', 'architektura brwi Białystok', 'stylizacja brwi Białystok', 'ile kosztuje laminacja brwi'],
    },
    en: {
      title: 'Brow Lamination & Brow Tinting Białystok',
      description: 'Brow lamination, powder henna, shaping and styling in Białystok. Professional brow architecture. Results up to 6 weeks. Book online.',
      keywords: ['brow lamination Białystok', 'brow tinting Białystok', 'brow shaping Białystok', 'brow styling Białystok', 'henna brows Białystok'],
    },
    ru: {
      title: 'Ламинирование и окрашивание бровей Белосток',
      description: 'Ламинирование бровей, пудровая хна, коррекция и стилизация бровей в Белостоке. Профессиональная архитектура бровей. Эффект до 6 недель. Запишитесь онлайн.',
      keywords: ['ламинирование бровей Белосток', 'хна бровей Белосток', 'коррекция бровей Белосток', 'архитектура бровей Белосток'],
    },
  },
  'peeling-weglowy': {
    pl: {
      title: 'Peeling Węglowy Białystok - Carbon Peel',
      description: 'Laserowy peeling węglowy Black Doll w Białymstoku. Oczyszczanie porów, redukcja trądziku i przebarwień. Efekty po pierwszym zabiegu. Umów wizytę - Salon Katarzyna Brui.',
      keywords: ['peeling węglowy Białystok', 'carbon peel Białystok', 'laserowy peeling węglowy Białystok', 'black doll Białystok', 'peeling węglowy cena', 'ile kosztuje peeling węglowy'],
    },
    en: {
      title: 'Carbon Peel Białystok - Laser Carbon Peeling',
      description: 'Laser carbon peeling Black Doll in Białystok. Pore cleansing, acne and pigmentation reduction. Results after first treatment. Book now - Katarzyna Brui Salon.',
      keywords: ['carbon peel Białystok', 'laser carbon peeling Białystok', 'Black Doll facial Białystok', 'carbon facial Poland'],
    },
    ru: {
      title: 'Карбоновый пилинг Белосток - Carbon Peel',
      description: 'Лазерный карбоновый пилинг Black Doll в Белостоке. Очищение пор, уменьшение акне и пигментации. Результат после первой процедуры. Запишитесь - Салон Катажина Бруй.',
      keywords: ['карбоновый пилинг Белосток', 'лазерный карбоновый пилинг Белосток', 'Black Doll Белосток', 'карбоновый пилинг цена'],
    },
  },
  'laserowe-usuwanie': {
    pl: {
      title: 'Laserowe Usuwanie Tatuażu Białystok',
      description: 'Laserowe usuwanie tatuaży i makijażu permanentnego w Białymstoku. Skuteczne zabiegi laserem. Konsultacja gratis. Umów wizytę - Salon Katarzyna Brui.',
      keywords: ['usuwanie tatuażu Białystok', 'laserowe usuwanie tatuażu Białystok', 'usuwanie makijażu permanentnego Białystok', 'usuwanie tatuażu laserem cena', 'laser Q-Switch Białystok'],
    },
    en: {
      title: 'Laser Tattoo Removal Białystok',
      description: 'Laser tattoo and permanent makeup removal in Białystok. Effective laser treatments. Free consultation. Book now - Katarzyna Brui Salon.',
      keywords: ['tattoo removal Białystok', 'laser tattoo removal Białystok', 'permanent makeup removal Białystok', 'Q-Switch laser Białystok'],
    },
    ru: {
      title: 'Лазерное удаление тату Белосток',
      description: 'Лазерное удаление татуировок и перманентного макияжа в Белостоке. Эффективные процедуры лазером. Бесплатная консультация. Запишитесь - Салон Катажина Бруй.',
      keywords: ['удаление тату Белосток', 'лазерное удаление тату Белосток', 'удаление перманентного макияжа Белосток', 'лазер Q-Switch Белосток'],
    },
  },
  'manicure': {
    pl: {
      title: 'Manicure Hybrydowy i Żelowy Białystok',
      description: 'Manicure hybrydowy, żelowy i klasyczny w Białymstoku. Profesjonalna stylizacja paznokci, trwałe zdobienia. Umów wizytę online - Salon Katarzyna Brui.',
      keywords: ['manicure Białystok', 'manicure hybrydowy Białystok', 'manicure żelowy Białystok', 'paznokcie hybrydowe Białystok', 'stylizacja paznokci Białystok', 'najlepszy manicure Białystok'],
    },
    en: {
      title: 'Gel & Hybrid Manicure Białystok',
      description: 'Gel, hybrid and classic manicure in Białystok. Professional nail styling, lasting designs. Book online - Katarzyna Brui Salon.',
      keywords: ['manicure Białystok', 'gel manicure Białystok', 'hybrid manicure Białystok', 'nail salon Białystok', 'best manicure Białystok'],
    },
    ru: {
      title: 'Гибридный и гелевый маникюр Белосток',
      description: 'Гибридный, гелевый и классический маникюр в Белостоке. Профессиональная стилизация ногтей, стойкий дизайн. Запишитесь онлайн - Салон Катажина Бруй.',
      keywords: ['маникюр Белосток', 'гибридный маникюр Белосток', 'гелевый маникюр Белосток', 'ногти Белосток', 'лучший маникюр Белосток'],
    },
  },
  'pakiety': {
    pl: {
      title: 'Pakiety Zabiegów Kosmetycznych Białystok',
      description: 'Pakiety zabiegów kosmetycznych w atrakcyjnych cenach. Makijaż permanentny, rzęsy, brwi, peeling węglowy. Oszczędź z pakietem - Salon Katarzyna Brui Białystok.',
      keywords: ['pakiety zabiegów kosmetycznych Białystok', 'pakiet makijaż permanentny', 'pakiet przedłużanie rzęs', 'promocje salon kosmetyczny Białystok'],
    },
    en: {
      title: 'Beauty Treatment Packages Białystok',
      description: 'Beauty treatment packages at attractive prices. Permanent makeup, lashes, brows, carbon peeling. Save with a package - Katarzyna Brui Salon Białystok.',
      keywords: ['beauty packages Białystok', 'treatment packages Białystok', 'beauty deals Białystok', 'beauty salon promotions Poland'],
    },
    ru: {
      title: 'Пакеты косметических процедур Белосток',
      description: 'Пакеты косметических процедур по привлекательным ценам. Перманентный макияж, ресницы, брови, карбоновый пилинг. Сэкономьте с пакетом - Салон Катажина Бруй Белосток.',
      keywords: ['пакеты процедур Белосток', 'пакет перманентный макияж', 'акции салон красоты Белосток'],
    },
  },
};

const defaultSEOData: MultiLangCategorySEO = {
  pl: {
    title: 'Usługi Kosmetyczne Białystok | Cennik Zabiegów',
    description: 'Pełna oferta zabiegów kosmetycznych w Białymstoku: makijaż permanentny brwi i ust, stylizacja rzęs, laminacja brwi, peeling węglowy, manicure, laserowe usuwanie tatuażu. Cennik i rezerwacja online.',
    keywords: ['usługi kosmetyczne Białystok', 'zabiegi kosmetyczne cennik', 'makijaż permanentny Białystok cena', 'stylizacja rzęs Białystok cena', 'laminacja brwi Białystok', 'salon kosmetyczny cennik Białystok'],
  },
  en: {
    title: 'Beauty Services Białystok | Treatment Price List',
    description: 'Full range of beauty treatments in Białystok: permanent makeup, lash extensions, brow lamination, carbon peeling, manicure, laser tattoo removal. Prices and online booking.',
    keywords: ['beauty services Białystok', 'beauty treatments Białystok', 'permanent makeup price', 'lash extensions price', 'beauty salon price list Poland'],
  },
  ru: {
    title: 'Косметические услуги Белосток | Прайс-лист',
    description: 'Полный спектр косметических услуг в Белостоке: перманентный макияж, наращивание ресниц, ламинирование бровей, карбоновый пилинг, маникюр, лазерное удаление тату. Цены и запись онлайн.',
    keywords: ['косметические услуги Белосток', 'прайс лист косметические процедуры', 'перманентный макияж цена', 'наращивание ресниц цена Белосток'],
  },
};

export const ServicesPage: React.FC = () => {
  const { category: categorySlug } = useParams();
  const category = categorySlug ? getCategoryNameFromSlug(categorySlug) : undefined;
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [, setIsLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useLocalizedNavigate();

  const [categoryImageMap, setCategoryImageMap] = useState<Map<string, string>>(new Map());
  const [categoryVideoMap, setCategoryVideoMap] = useState<Map<string, string>>(new Map());
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (category) {
      const blogCategories = getBlogCategoriesForServiceCategory(category);
      if (blogCategories.length > 0) {
        supabase
          .from('blog_posts')
          .select('id, title, title_en, title_ru, slug, excerpt, excerpt_en, excerpt_ru, cover_image_url, published_at, reading_time_minutes, category')
          .eq('is_published', true)
          .in('category', blogCategories)
          .order('published_at', { ascending: false })
          .limit(3)
          .then(({ data }) => {
            if (data) setRelatedPosts(data as BlogPost[]);
            else setRelatedPosts([]);
          });
      } else {
        setRelatedPosts([]);
      }
    } else {
      setRelatedPosts([]);
    }
  }, [category]);

  useEffect(() => {
    if (services.length > 0) {
      sortCategoriesByOrder(Array.from(new Set(services.map(s => s.category))));
    }
  }, [services]);

  const sortCategoriesByOrder = async (cats: string[]) => {
    const { data } = await supabase
      .from('service_categories')
      .select('name, sort_order, image_url, video_url')
      .order('sort_order');

    if (data && data.length > 0) {
      const orderMap = new Map(data.map((c: { name: string; sort_order: number }) => [c.name, c.sort_order]));
      const imgMap = new Map<string, string>();
      const vidMap = new Map<string, string>();
      data.forEach((c: { name: string; image_url: string | null; video_url: string | null }) => {
        if (c.image_url) imgMap.set(c.name, c.image_url);
        if (c.video_url) vidMap.set(c.name, c.video_url);
      });
      setCategoryImageMap(imgMap);
      setCategoryVideoMap(vidMap);
      const sorted = [...cats].sort((a, b) => {
        const oa = orderMap.get(a) ?? 999;
        const ob = orderMap.get(b) ?? 999;
        return oa - ob;
      });
      setCategories(sorted);
    } else {
      setCategories(cats);
    }
  };

  const loadServices = async () => {
    setIsLoading(true);
    const [servicesRes, catRes] = await Promise.all([
      supabase.from('services').select('*, service_images(url)').eq('is_hidden', false).order('category'),
      supabase.from('service_categories').select('name, image_url'),
    ]);

    if (servicesRes.error) {
      console.error('Error loading services:', servicesRes.error);
      return;
    }

    const catImgMap = new Map<string, string>();
    if (catRes.data) {
      catRes.data.forEach((c: { name: string; image_url: string | null }) => {
        if (c.image_url) catImgMap.set(c.name, c.image_url);
      });
      setCategoryImageMap(catImgMap);
    }

    const servicesWithImages = servicesRes.data.map(service => ({
      ...service,
      imageUrl: service.service_images?.[0]?.url
        || catImgMap.get(service.category)
        || getStaticImageForCategory(service.category)
    }));

    setServices(servicesWithImages);
    setIsLoading(false);
    prerenderReady();
  };

  const getStaticImageForCategory = (category: string) => {
    switch (category.toLowerCase()) {
      case 'pielęgnacja brwi':
        return serviceImages.browCare;
      case 'makijaż permanentny':
        return serviceImages.permanentMakeup;
      case 'rzęsy':
      case 'stylizacja rzęs':
        return serviceImages.lashes;
      case 'laserowe usuwanie':
        return serviceImages.tattooRemoval;
      case 'manicure':
        return serviceImages.manicure;
      case 'peeling węglowy':
        return serviceImages.carbonPeeling;
      default:
        return serviceImages.browCare;
    }
  };

  const handleCategoryClick = (cat: string) => {
    navigate(`/services/${getCategorySlug(cat)}`);
  };

  const handleBookService = (service: Service) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const lang = language as 'pl' | 'en' | 'ru';
  const defaultLangSEO = defaultSEOData[lang];
  const translatedDefaultSEO: CategorySEO = {
    title: (t as any).services_seo?.title || defaultLangSEO.title,
    description: (t as any).services_seo?.description || defaultLangSEO.description,
    keywords: defaultLangSEO.keywords,
  };
  const catSEOEntry = categorySlug ? categorySEOData[categorySlug] : undefined;
  const seo = catSEOEntry ? catSEOEntry[lang] : translatedDefaultSEO;

  // Pick a representative image for og:image based on current category
  const categoryImage = category
    ? (categoryImageMap.get(category) || getStaticImageForCategory(category))
    : serviceImages.permanentMakeup;

  const visibleServices = category
    ? services.filter(s => s.category === category)
    : services;

  const catalogName = category
    ? `${getCategoryName(category, language, (t as any).categories)} – Salon Katarzyna Brui`
    : 'Usługi kosmetyczne – Salon Katarzyna Brui Białystok';
  const catalogUrl = `${BASE_URL}${categorySlug ? `/services/${categorySlug}` : '/services'}`;

  const homeName = language === 'en' ? 'Home' : language === 'ru' ? 'Главная' : 'Strona główna';
  const breadcrumbItems = category
    ? [
        { name: homeName, url: '/' },
        { name: t.services || 'Usługi', url: '/services' },
        { name: getCategoryName(category, language, (t as any).categories), url: `/services/${categorySlug}` },
      ]
    : [
        { name: homeName, url: '/' },
        { name: t.services || 'Usługi', url: '/services' },
      ];

  return (
    <main className="pt-16 min-h-screen bg-neutral-50">
      <SEO
        title={seo.title}
        description={seo.description}
        canonical={categorySlug ? `/services/${categorySlug}` : '/services'}
        image={categoryImage}
        keywords={seo.keywords}
      />
      <ServiceSchema
        catalogName={catalogName}
        url={catalogUrl}
        services={visibleServices.map(s => ({
          name: s.name,
          description: s.description || undefined,
          image: s.imageUrl || undefined,
          price: s.price,
        }))}
      />
      <BreadcrumbSchema items={breadcrumbItems} />
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center">{t.services}</h1>
        
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          <button
            onClick={() => navigate('/services')}
            className={`px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200 ${
              !category
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-600'
            }`}
          >
            {t.all}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200 ${
                category === cat
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-600'
              }`}
            >
              {getCategoryName(cat, language, (t as any).categories)}
            </button>
          ))}
        </div>
        
        <div className="space-y-16">
          {(category ? [category] : categories).map(cat => (
            <ServiceSection
              key={cat}
              category={cat}
              services={services.filter(s => s.category === cat)}
              onBookService={handleBookService}
            />
          ))}
        </div>

        {/* Related Articles for current category */}
        {category && relatedPosts.length > 0 && (
          <div className="mt-12 pt-10 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {((t as Record<string, unknown>).landing_pages as Record<string, string>)?.relatedArticles || 'Powiązane artykuły'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map(post => {
                const postTitle = getLocalizedField(post, 'title', language);
                const postExcerpt = getLocalizedField(post, 'excerpt', language);
                const formatDate = (dateStr?: string) => {
                  if (!dateStr) return '';
                  return new Date(dateStr).toLocaleDateString(
                    language === 'pl' ? 'pl-PL' : language === 'ru' ? 'ru-RU' : 'en-US',
                    { year: 'numeric', month: 'long', day: 'numeric' }
                  );
                };
                return (
                  <LocalizedLink
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="relative overflow-hidden h-48">
                      {post.cover_image_url ? (
                        <img
                          src={post.cover_image_url}
                          alt={postTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          width={400}
                          height={192}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600" />
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                        {postTitle}
                      </h3>
                      {postExcerpt && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{postExcerpt}</p>
                      )}
                      <p className="text-sm text-gray-500">{formatDate(post.published_at)}</p>
                    </div>
                  </LocalizedLink>
                );
              })}
            </div>
          </div>
        )}

        {showBookingModal && selectedService && (
          <BookingModal
            service={selectedService}
            onClose={() => setShowBookingModal(false)}
          />
        )}

        {/* VideoObject structured data for categories with videos */}
        {(() => {
          const videoCats = (category ? [category] : categories).filter(c => categoryVideoMap.get(c));
          if (videoCats.length === 0) return null;
          return (
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(
              videoCats.map(c => ({
                '@context': 'https://schema.org',
                '@type': 'VideoObject',
                name: language === 'en'
                  ? `${getCategoryName(c, language, (t as any).categories)} – Katarzyna Brui Beauty Salon`
                  : language === 'ru'
                  ? `${getCategoryName(c, language, (t as any).categories)} – Салон красоты Катажина Бруй`
                  : `${getCategoryName(c, language, (t as any).categories)} – Salon Katarzyna Brui Białystok`,
                description: language === 'en'
                  ? `${getCategoryName(c, language, (t as any).categories)} services at Katarzyna Brui beauty salon in Białystok.`
                  : language === 'ru'
                  ? `${getCategoryName(c, language, (t as any).categories)} – услуги салона красоты Катажина Бруй, Белосток.`
                  : `${getCategoryName(c, language, (t as any).categories)} – zabiegi w salonie kosmetycznym Katarzyna Brui, Białystok.`,
                thumbnailUrl: categoryImageMap.get(c) || getStaticImageForCategory(c),
                contentUrl: categoryVideoMap.get(c),
                uploadDate: '2025-01-01',
              }))
            )}} />
          );
        })()}
      </div>
    </main>
  );
};