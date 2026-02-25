import React from 'react';
import { useLocalizedNavigate } from '../hooks/useLocalizedPath';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { serviceImages } from '../assets/images';
import { Reviews } from '../components/Reviews';
import { MapLocation } from '../components/MapLocation';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { SEO } from '../components/SEO';
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import { BlogTeaser } from '../components/BlogTeaser';
import { getCategoryName } from '../utils/serviceTranslation';

interface CategoryInfo {
  name: string;
  count: number;
  image: string;
}

export const Home: React.FC = () => {
  const [categories, setCategories] = React.useState<CategoryInfo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useLocalizedNavigate();

  React.useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const [servicesRes, catOrderRes] = await Promise.all([
        supabase.from('services').select('category').order('category'),
        supabase.from('service_categories').select('name, sort_order').order('sort_order'),
      ]);
      if (servicesRes.error) throw servicesRes.error;
      const categoryMap = new Map<string, number>();
      servicesRes.data.forEach((s: { category: string }) => {
        categoryMap.set(s.category, (categoryMap.get(s.category) || 0) + 1);
      });
      const orderMap = new Map<string, number>();
      if (catOrderRes.data) {
        catOrderRes.data.forEach((c: { name: string; sort_order: number }) => {
          orderMap.set(c.name, c.sort_order);
        });
      }
      const cats: CategoryInfo[] = Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count, image: getDefaultImageForCategory(name) }))
        .sort((a, b) => (orderMap.get(a.name) ?? 999) - (orderMap.get(b.name) ?? 999));
      setCategories(cats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load services';
      setError(message);
      console.error('Error loading services:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultImageForCategory = (category: string) => {
    switch (category.toLowerCase()) {
      case 'pielęgnacja brwi': return serviceImages.browCare;
      case 'makijaż permanentny': return serviceImages.permanentMakeup;
      case 'rzęsy': case 'stylizacja rzęs': return serviceImages.lashes;
      case 'laserowe usuwanie': return serviceImages.tattooRemoval;
      case 'manicure': return serviceImages.manicure;
      case 'peeling węglowy': return serviceImages.carbonPeeling;
      default: return serviceImages.browCare;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <SEO
        title="Studio Urody Białystok"
        description="Studio urody Anna Nowak w Białymstoku. Makijaż permanentny brwi i ust, stylizacja rzęs, laminacja brwi, peeling węglowy, manicure. Rezerwacja online. ul. Młynowa 46. Tel: 880 435 102."
        canonical="/"
        keywords={['salon kosmetyczny Białystok','makijaż permanentny Białystok','kosmetyczka Białystok','przedłużanie rzęs Białystok','manicure hybrydowy Białystok','laminacja brwi Białystok','Anna Nowak']}
        structuredData={{
          '@context': 'https://schema.org', '@type': 'BeautySalon',
          'name': 'Studio Urody Anna Nowak',
          'image': ['https://katarzynabrui.pl/og-image.jpg','https://katarzynabrui.pl/og-image2.jpg'],
          'url': 'https://katarzynabrui.pl', 'telephone': '+48880435102', 'priceRange': '$$',
          'address': { '@type': 'PostalAddress', 'streetAddress': 'ul. Młynowa 46, Lok U11', 'addressLocality': 'Białystok', 'postalCode': '15-404', 'addressCountry': 'PL' },
          'geo': { '@type': 'GeoCoordinates', 'latitude': 53.1274782, 'longitude': 23.1462283 },
          'aggregateRating': { '@type': 'AggregateRating', 'ratingValue': '5.0', 'reviewCount': '380', 'bestRating': '5', 'worstRating': '1' },
          'sameAs': ['https://www.facebook.com/p/Katarzyna-Brui-Permanent-100081111466742/','https://www.instagram.com/katarzyna.brui_']
        }}
      />

      {/* ──── HERO: Split screen ──── */}
      <header className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left side - content */}
        <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-32 lg:py-20 order-2 lg:order-1 bg-[#FAF9F7]">
          <div className="max-w-lg">
            <span className="inline-block text-[11px] uppercase tracking-[0.3em] text-rose-500 font-medium mb-6 border-l-2 border-rose-400 pl-3">
              Beauty Studio — Białystok
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-gray-900 leading-[1.1] mb-6">
              {t.welcomeTitle}
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-10 max-w-md">
              {t.aboutText}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gray-900 text-white text-[13px] uppercase tracking-[0.15em] font-medium px-8 py-4 hover:bg-rose-600 transition-all duration-500"
              >
                {t.bookNow}
              </button>
              <button
                onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="text-[13px] uppercase tracking-[0.15em] font-medium px-6 py-4 border border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-all duration-300"
              >
                <span className="text-rose-500 font-bold text-base">5.0</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-gray-400">380 {t.reviewsLabel}</span>
              </button>
            </div>
            {/* Stats strip */}
            <div className="mt-16 pt-8 border-t border-gray-200 grid grid-cols-3 gap-8">
              <div>
                <p className="text-3xl font-serif font-bold text-gray-900">380+</p>
                <p className="text-xs uppercase tracking-wider text-gray-400 mt-1">{t.reviewsLabel}</p>
              </div>
              <div>
                <p className="text-3xl font-serif font-bold text-gray-900">7+</p>
                <p className="text-xs uppercase tracking-wider text-gray-400 mt-1">{language === 'pl' ? 'lat doświadczenia' : language === 'ru' ? 'лет опыта' : 'years experience'}</p>
              </div>
              <div>
                <p className="text-3xl font-serif font-bold text-gray-900">50+</p>
                <p className="text-xs uppercase tracking-wider text-gray-400 mt-1">{t.servicesCount}</p>
              </div>
            </div>
          </div>
        </div>
        {/* Right side - image */}
        <div className="relative order-1 lg:order-2 min-h-[50vh] lg:min-h-screen">
          <img
            src="/og-image2.jpg"
            alt="Studio urody Anna Nowak Białystok – makijaż permanentny brwi, stylizacja rzęs, laminacja brwi"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F7] via-transparent to-transparent lg:bg-gradient-to-l lg:from-[#FAF9F7]/30 lg:via-transparent lg:to-transparent" />
        </div>
      </header>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && <main>
        {/* ──── SERVICES: Bento grid ──── */}
        <section id="services" className="scroll-mt-20 py-24 bg-white">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-16 gap-6">
              <div>
                <span className="text-[11px] uppercase tracking-[0.3em] text-rose-500 font-medium">{language === 'pl' ? 'Nasze usługi' : language === 'ru' ? 'Наши услуги' : 'Our services'}</span>
                <h2 className="text-4xl sm:text-5xl font-serif font-bold text-gray-900 mt-3">
                  {t.ourCategories}
                </h2>
              </div>
              <p className="text-gray-400 max-w-md text-sm leading-relaxed lg:text-right">
                {t.categoriesDescription}
              </p>
            </div>

            {/* Bento grid - asymmetric */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((cat, idx) => {
                const isLarge = idx === 0 || idx === 3;
                return (
                  <button
                    key={cat.name}
                    onClick={() => navigate(`/services/${encodeURIComponent(cat.name)}`)}
                    className={`group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${
                      isLarge ? 'sm:col-span-2 lg:col-span-2 h-80' : 'h-72'
                    }`}
                  >
                    <img
                      src={cat.image}
                      alt={getCategoryName(cat.name, language, (t as any).categories)}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[800ms] group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-500" />
                    <div className="absolute inset-0 flex flex-col justify-between p-8">
                      <span className="self-start text-[10px] uppercase tracking-[0.2em] text-white/70 bg-white/10 backdrop-blur-sm px-3 py-1.5 font-medium">
                        {cat.count} {t.servicesCount}
                      </span>
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-3">
                          {getCategoryName(cat.name, language, (t as any).categories)}
                        </h3>
                        <span className="inline-flex items-center text-white/80 text-xs uppercase tracking-[0.15em] font-medium group-hover:text-white transition-colors">
                          {t.viewCategoryServices}
                          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ──── ABOUT: Editorial side-by-side ──── */}
        <section className="py-24 bg-[#FAF9F7]">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
              <div className="lg:col-span-2 relative">
                <div className="aspect-[3/4] overflow-hidden">
                  <img src={serviceImages.permanentMakeup} alt="Studio Anna Nowak" className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 border-2 border-rose-300 hidden lg:block" />
              </div>
              <div className="lg:col-span-3 lg:pl-8">
                <span className="text-[11px] uppercase tracking-[0.3em] text-rose-500 font-medium">{language === 'pl' ? 'O nas' : language === 'ru' ? 'О нас' : 'About'}</span>
                <h2 className="text-4xl sm:text-5xl font-serif font-bold text-gray-900 mt-3 mb-8">{t.aboutTitle}</h2>
                <p className="text-gray-500 text-lg leading-[1.8] mb-8">{t.aboutText}</p>
                <div className="flex gap-12 pt-6 border-t border-gray-200">
                  <div>
                    <p className="text-3xl font-serif font-bold text-gray-900">5.0</p>
                    <p className="text-xs uppercase tracking-wider text-gray-400 mt-1">Booksy rating</p>
                  </div>
                  <div>
                    <p className="text-3xl font-serif font-bold text-gray-900">380+</p>
                    <p className="text-xs uppercase tracking-wider text-gray-400 mt-1">{t.reviewsLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ──── TRAINING: Full-width CTA banner ──── */}
        <section className="relative h-80 overflow-hidden">
          <img src={serviceImages.lashes} alt="Training" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gray-900/70" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-6">
              <span className="text-[11px] uppercase tracking-[0.3em] text-rose-400 font-medium">{language === 'pl' ? 'Szkolenia' : language === 'ru' ? 'Обучение' : 'Training'}</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-3 mb-6">
                {t.training_page?.header || t.training}
              </h2>
              <button
                onClick={() => navigate('/training')}
                className="text-[13px] uppercase tracking-[0.15em] font-medium px-8 py-4 border border-white text-white hover:bg-white hover:text-gray-900 transition-all duration-500"
              >
                {t.training}
              </button>
            </div>
          </div>
        </section>

        {/* Blog teaser */}
        <BlogTeaser />

        {/* Reviews */}
        <div id="reviews" className="scroll-mt-20">
          <Reviews />
        </div>

        {/* ──── CONTACT: Asymmetric layout ──── */}
        <section className="py-24 bg-white">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {/* Left: info */}
              <div>
                <span className="text-[11px] uppercase tracking-[0.3em] text-rose-500 font-medium">{language === 'pl' ? 'Kontakt' : language === 'ru' ? 'Контакт' : 'Contact'}</span>
                <h2 className="text-4xl sm:text-5xl font-serif font-bold text-gray-900 mt-3 mb-12">{t.contact.title}</h2>

                <div className="space-y-10">
                  <div className="flex gap-6">
                    <div className="w-12 h-12 bg-gray-900 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-sm uppercase tracking-wider font-semibold text-gray-900 mb-2">{t.contact.address}</h3>
                      <p className="text-gray-500 leading-relaxed">
                        ul. Młynowa 46, Lok U11<br />15-404, Białystok<br />
                        Tel: <a href="tel:880435102" className="text-rose-500 hover:text-rose-600 font-medium">880 435 102</a>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="w-12 h-12 bg-gray-900 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-sm uppercase tracking-wider font-semibold text-gray-900 mb-2">{t.contact.openingHours.title}</h3>
                      <p className="text-gray-500 leading-relaxed">
                        {t.contact.openingHours.weekdays}<br />{t.contact.openingHours.saturday}<br />{t.contact.openingHours.sunday}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="w-12 h-12 bg-gray-900 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-sm uppercase tracking-wider font-semibold text-gray-900 mb-2">{t.contact.socialMedia.title}</h3>
                      <div className="flex gap-3">
                        <a href="https://www.facebook.com/p/Katarzyna-Brui-Permanent-100081111466742/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-gray-200 flex items-center justify-center text-gray-500 hover:border-rose-500 hover:text-rose-500 transition-colors"><FaFacebook size={16} /></a>
                        <a href="https://www.instagram.com/katarzyna.brui_" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border border-gray-200 flex items-center justify-center text-gray-500 hover:border-rose-500 hover:text-rose-500 transition-colors"><FaInstagram size={16} /></a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: map */}
              <div className="bg-gray-50 p-1">
                <MapLocation />
              </div>
            </div>
          </div>
        </section>
      </main>}
    </div>
  );
};
