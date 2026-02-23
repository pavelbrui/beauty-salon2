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
      
      if (servicesRes.error) {
        throw servicesRes.error;
      }

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
        .map(([name, count]) => ({
          name,
          count,
          image: getDefaultImageForCategory(name),
        }))
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

  const scrollToReviews = () => {
    document.getElementById('reviews')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Studio Urody Białystok"
        description="Studio urody Anna Nowak w Białymstoku. Makijaż permanentny brwi i ust, stylizacja rzęs, laminacja brwi, peeling węglowy, manicure. Rezerwacja online. ul. Młynowa 46. Tel: 880 435 102."
        canonical="/"
        keywords={[
          'salon kosmetyczny Białystok',
          'makijaż permanentny Białystok',
          'kosmetyczka Białystok',
          'przedłużanie rzęs Białystok',
          'manicure hybrydowy Białystok',
          'laminacja brwi Białystok',
          'laminacja rzęs Białystok',
          'peeling węglowy Białystok',
          'microblading Białystok',
          'stylizacja rzęs Białystok',
          'usuwanie tatuażu Białystok',
          'zabiegi kosmetyczne Białystok',
          'najlepszy salon kosmetyczny Białystok',
          'henna brwi Białystok',
          'lifting rzęs Białystok',
          'Anna Nowak'
        ]}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'BeautySalon',
          'name': 'Studio Urody Anna Nowak',
          'image': [
            'https://katarzynabrui.pl/og-image.jpg',
            'https://katarzynabrui.pl/og-image2.jpg'
          ],
          'url': 'https://katarzynabrui.pl',
          'telephone': '+48880435102',
          'priceRange': '$$',
          'address': {
            '@type': 'PostalAddress',
            'streetAddress': 'ul. Młynowa 46, Lok U11',
            'addressLocality': 'Białystok',
            'postalCode': '15-404',
            'addressCountry': 'PL'
          },
          'geo': {
            '@type': 'GeoCoordinates',
            'latitude': 53.1274782,
            'longitude': 23.1462283
          },
          'openingHoursSpecification': [
            {
              '@type': 'OpeningHoursSpecification',
              'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              'opens': '09:00',
              'closes': '20:00'
            },
            {
              '@type': 'OpeningHoursSpecification',
              'dayOfWeek': 'Saturday',
              'opens': '09:00',
              'closes': '16:00'
            }
          ],
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': '5.0',
            'reviewCount': '380',
            'bestRating': '5',
            'worstRating': '1'
          },
          'sameAs': [
            'https://www.facebook.com/p/Katarzyna-Brui-Permanent-100081111466742/',
            'https://www.instagram.com/katarzyna.brui_'
          ]
        }}
      />

      {/* Hero Section - Full screen with elegant overlay */}
      <header className="relative h-screen overflow-hidden">
        <img
          src="/og-image2.jpg"
          alt="Studio urody Anna Nowak Białystok – makijaż permanentny brwi, stylizacja rzęs, laminacja brwi"
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-rose-900/30 via-rose-900/20 to-rose-950/60" />
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
        
        <div className="absolute inset-0 flex flex-col justify-center items-center px-4">
          <div className="text-center max-w-3xl">
            <p className="text-rose-200 text-sm sm:text-base uppercase tracking-[0.3em] mb-4 font-medium">
              Beauty Studio
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight">
              {t.welcomeTitle}
            </h1>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-rose-400 to-transparent mx-auto mb-6" />
            <p className="text-lg sm:text-xl text-white/80 max-w-xl mx-auto font-light leading-relaxed">
              {t.welcomeSubtitle}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center">
              <button
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-3.5 rounded-full font-medium transition-all hover:shadow-xl hover:shadow-rose-500/30 hover:scale-105"
              >
                {t.bookNow}
              </button>
              <button
                onClick={scrollToReviews}
                className="group bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-full hover:bg-white/20 transition-all"
              >
                <span className="text-rose-300 text-xl font-semibold">5.0</span>
                <span className="text-white/70 ml-2">/ 5.0</span>
                <span className="text-white/50 ml-2 text-sm">· 380 {t.reviewsLabel}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/60 rounded-full" />
          </div>
        </div>
      </header>
      
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {/* About Section - Elegant with serif headers */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-rose-500 text-sm uppercase tracking-[0.2em] mb-3 font-medium">
              {language === 'pl' ? 'O nas' : language === 'ru' ? 'О нас' : 'About us'}
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 mb-8">{t.aboutTitle}</h2>
            <div className="w-16 h-0.5 bg-rose-300 mx-auto mb-8" />
            <p className="text-lg text-gray-500 leading-relaxed font-light">
              {t.aboutText}
            </p>
          </div>
        </div>
      </section>

      {!loading && !error && <main>
        {/* Services Section */}
        <section className="py-20 bg-rose-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div id="services" className="scroll-mt-20">
              <div className="text-center mb-16">
                <p className="text-rose-500 text-sm uppercase tracking-[0.2em] mb-3 font-medium">
                  {language === 'pl' ? 'Nasze usługi' : language === 'ru' ? 'Наши услуги' : 'Our services'}
                </p>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 mb-4">
                  {t.ourCategories}
                </h2>
                <div className="w-16 h-0.5 bg-rose-300 mx-auto mb-6" />
                <p className="text-gray-500 max-w-2xl mx-auto font-light">
                  {t.categoriesDescription}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => navigate(`/services/${encodeURIComponent(cat.name)}`)}
                    className="group relative rounded-2xl overflow-hidden h-72 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 shadow-lg hover:shadow-2xl transition-all duration-500"
                  >
                    <img
                      src={cat.image}
                      alt={getCategoryName(cat.name, language, (t as any).categories)}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-rose-950/80 via-rose-900/20 to-transparent transition-all duration-300 group-hover:from-rose-950/90" />
                    <div className="absolute inset-0 flex flex-col justify-end p-7 text-left">
                      <h3 className="text-xl font-serif font-bold text-white mb-1">
                        {getCategoryName(cat.name, language, (t as any).categories)}
                      </h3>
                      <p className="text-rose-200/70 text-sm mb-3">
                        {cat.count} {t.servicesCount}
                      </p>
                      <span className="inline-flex items-center text-rose-300 text-sm font-medium transition-transform duration-300 group-hover:translate-x-2">
                        {t.viewCategoryServices}
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Training callout */}
        <section className="py-24 bg-gradient-to-br from-rose-50 to-fuchsia-50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-rose-500 text-sm uppercase tracking-[0.2em] mb-3 font-medium">
              {language === 'pl' ? 'Szkolenia' : language === 'ru' ? 'Обучение' : 'Training'}
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 mb-4">
              {t.training_page?.header || t.training}
            </h2>
            <div className="w-16 h-0.5 bg-rose-300 mx-auto mb-6" />
            <p className="text-gray-500 mb-8 font-light max-w-2xl mx-auto">
              {t.training_page?.intro}
            </p>
            <button
              onClick={() => navigate('/training')}
              className="bg-rose-500 text-white px-8 py-3.5 rounded-full hover:bg-rose-600 transition-all font-medium hover:shadow-lg hover:shadow-rose-500/25"
            >
              {t.training}
            </button>
          </div>
        </section>

        {/* Blog teaser */}
        <BlogTeaser />

        {/* Reviews Section */}
        <div id="reviews" className="scroll-mt-20">
          <Reviews />
        </div>

        {/* Contact Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-rose-50 via-white to-fuchsia-50 rounded-3xl shadow-xl border border-rose-100/50 p-8 sm:p-12">
              <div className="text-center mb-12">
                <p className="text-rose-500 text-sm uppercase tracking-[0.2em] mb-3 font-medium">
                  {language === 'pl' ? 'Kontakt' : language === 'ru' ? 'Контакт' : 'Contact'}
                </p>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 mb-4">
                  {t.contact.title}
                </h2>
                <div className="w-16 h-0.5 bg-rose-300 mx-auto" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                <div className="text-center">
                  <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                  </div>
                  <h3 className="text-lg font-serif font-semibold text-gray-900 mb-3">
                    {t.contact.address}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    ul. Młynowa 46, Lok U11<br />
                    15-404, Białystok<br />
                    Tel: <a href="tel:880435102" className="text-rose-600 hover:text-rose-700 font-medium">880 435 102</a><br />
                    Anna
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h3 className="text-lg font-serif font-semibold text-gray-900 mb-3">
                    {t.contact.openingHours.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {t.contact.openingHours.weekdays}<br />
                    {t.contact.openingHours.saturday}<br />
                    {t.contact.openingHours.sunday}
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                  </div>
                  <h3 className="text-lg font-serif font-semibold text-gray-900 mb-3">
                    {t.contact.socialMedia.title}
                  </h3>
                  <div className="flex justify-center space-x-4 mb-3">
                    <a
                      href="https://www.facebook.com/p/Katarzyna-Brui-Permanent-100081111466742/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 hover:bg-rose-500 hover:text-white transition-all"
                    >
                      <FaFacebook size={18} />
                    </a>
                    <a
                      href="https://www.instagram.com/katarzyna.brui_"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 hover:bg-rose-500 hover:text-white transition-all"
                    >
                      <FaInstagram size={18} />
                    </a>
                  </div>
                  <p className="text-gray-500 text-sm">{t.contact.socialMedia.followUs}</p>
                </div>
              </div>
              <MapLocation />
            </div>
          </div>
        </section>
      </main>}

    </div>
  );
};
