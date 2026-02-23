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
    <div className="min-h-screen bg-cream-50">
      <SEO
        title="Salon Kosmetyczny Białystok"
        description="Salon kosmetyczny Katarzyna Brui w Białymstoku. Makijaż permanentny brwi i ust, stylizacja rzęs, laminacja brwi, peeling węglowy, manicure. Rezerwacja online. ul. Młynowa 46. Tel: 880 435 102."
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
          'Katarzyna Brui'
        ]}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'BeautySalon',
          'name': 'Salon Kosmetyczny Katarzyna Brui',
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
      <header className="relative min-h-[85vh] flex items-center">
        {/* Hero image — semantic <img> for Google Image indexing */}
        <img
          src="/og-image2.jpg"
          alt="Salon kosmetyczny Katarzyna Brui Białystok – makijaż permanentny brwi, stylizacja rzęs, laminacja brwi"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950/50 via-rose-900/30 to-black/40" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-lg">
            {t.welcomeTitle}
          </h1>
          <p className="mt-8 text-lg sm:text-xl md:text-2xl text-white/95 max-w-2xl mx-auto font-light">
            {t.welcomeSubtitle}
          </p>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-5">
            <button
              onClick={scrollToReviews}
              className="bg-white/95 backdrop-blur-md px-6 py-3 rounded-2xl hover:bg-white transition-all cursor-pointer shadow-lg shadow-black/10"
            >
              <span className="text-rose-500 text-2xl font-bold">5.0</span>
              <span className="text-stone-600 ml-2">/ 5.0</span>
              <div className="text-sm text-stone-500 mt-0.5">
                <span>380 </span>
                <span>{t.reviewsLabel}</span>
              </div>
            </button>
            <button
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-rose-400 via-rose-500 to-pink-500 text-white px-10 py-4 rounded-2xl font-semibold hover:scale-105 transition-all shadow-xl shadow-rose-500/25"
            >
              {t.bookNow}
            </button>
          </div>
        </div>
      </header>
      
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {/* About Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-stone-900 mb-10">{t.aboutTitle}</h2>
          <p className="text-lg md:text-xl text-stone-600 leading-relaxed">
            {t.aboutText}
          </p>
        </div>
      </section>

      {!loading && !error && <main className="max-w-7xl mx-auto py-16 sm:px-6 lg:px-8">
        <div id="services" className="px-4 sm:px-0 scroll-mt-20">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-stone-900 mb-3 text-center">
            {t.ourCategories}
          </h2>
          <p className="text-stone-600 text-center mb-14 max-w-2xl mx-auto">
            {t.categoriesDescription}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map(cat => (
              <button
                key={cat.name}
                onClick={() => navigate(`/services/${encodeURIComponent(cat.name)}`)}
                className="group relative rounded-3xl overflow-hidden h-72 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-4 focus:ring-offset-cream-50 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <img
                  src={cat.image}
                  alt={getCategoryName(cat.name, language, (t as any).categories)}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-all duration-300 group-hover:from-black/80" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-left">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {getCategoryName(cat.name, language, (t as any).categories)}
                  </h3>
                  <p className="text-white/70 text-sm mb-3">
                    {cat.count} {t.servicesCount}
                  </p>
                  <span className="inline-flex items-center text-rose-400 text-sm font-medium transition-transform duration-300 group-hover:translate-x-1">
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

        {/* Training callout */}
        <section className="py-24 bg-gradient-to-br from-rose-50 via-pink-50 to-cream-100 rounded-[3rem] mx-4 sm:mx-6 lg:mx-8 -mb-4">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-stone-900 mb-5">
              {t.training_page?.header || t.training}
            </h2>
            <p className="text-stone-600 mb-8 text-lg">
              {t.training_page?.intro}
            </p>
            <button
              onClick={() => navigate('/training')}
              className="bg-rose-500 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-rose-600 hover:scale-105 transition-all shadow-lg shadow-rose-500/20"
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

        <div className="mt-20 mx-4 sm:mx-6 lg:mx-8 bg-white rounded-[2rem] shadow-xl shadow-stone-200/50 p-12 md:p-16 border border-stone-100">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-stone-900 mb-12 text-center">
            {t.contact.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-14 mb-14">
            <div className="text-center">
              <h3 className="font-display text-xl font-semibold text-rose-600 mb-4">
                {t.contact.address}
              </h3>
              <p className="text-stone-600">
                ul. Młynowa 46, Lok U11<br />
                15-404, Białystok<br />
                Tel: <a href="tel:880435102" className="text-rose-600 hover:text-rose-700 font-medium">880 435 102</a><br />
                Katarzyna
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-display text-xl font-semibold text-rose-600 mb-4">
                {t.contact.openingHours.title}
              </h3>
              <p className="text-stone-600">
                {t.contact.openingHours.weekdays}<br />
                {t.contact.openingHours.saturday}<br />
                {t.contact.openingHours.sunday}
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-display text-xl font-semibold text-rose-600 mb-4">
                {t.contact.socialMedia.title}
              </h3>
              <div className="flex justify-center space-x-4 mb-4">
                <a
                  href="https://www.facebook.com/p/Katarzyna-Brui-Permanent-100081111466742/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-600 hover:text-rose-700 transition-colors"
                >
                  <FaFacebook size={28} />
                </a>
                <a
                  href="https://www.instagram.com/katarzyna.brui_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-600 hover:text-rose-700 transition-colors"
                >
                  <FaInstagram size={28} />
                </a>
              </div>
              <p className="text-stone-600">{t.contact.socialMedia.followUs}</p>
            </div>
          </div>
          <MapLocation />
        </div>
      </main>}

    </div>
  );
};