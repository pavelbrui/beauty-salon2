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
    <div className="min-h-screen bg-dark">
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
      {/* Hero — full viewport, dramatic overlay */}
      <header className="relative min-h-screen flex flex-col justify-end">
        <img
          src="/og-image2.jpg"
          alt="Salon kosmetyczny Katarzyna Brui Białystok – makijaż permanentny brwi, stylizacja rzęs, laminacja brwi"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/80 to-dark/30" />
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 pb-24 pt-32">
          <div className="max-w-4xl">
            <p className="text-brand font-medium tracking-[0.3em] uppercase text-sm mb-4">
              Białystok
            </p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-cream leading-tight mb-6">
              {t.welcomeTitle}
            </h1>
            <p className="text-lg sm:text-xl text-cream-300 max-w-2xl mb-12">
              {t.welcomeSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <button
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-brand text-dark px-8 py-4 rounded-none font-semibold hover:bg-brand-400 transition-all duration-300 uppercase tracking-wider"
              >
                {t.bookNow}
              </button>
              <button
                onClick={scrollToReviews}
                className="flex items-center gap-3 px-6 py-4 border border-brand/50 text-cream hover:bg-brand/10 transition-all"
              >
                <span className="text-brand font-bold text-xl">5.0</span>
                <span className="text-cream-300">/ 5.0</span>
                <span className="text-cream-300 text-sm">380 {t.reviewsLabel}</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {/* About — dark section with gold accent */}
      <section className="py-24 bg-dark-100 border-y border-brand/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-cream mb-8">{t.aboutTitle}</h2>
          <p className="text-lg text-cream-300 leading-relaxed">
            {t.aboutText}
          </p>
        </div>
      </section>

      {!loading && !error && <main className="max-w-7xl mx-auto py-20 sm:px-6 lg:px-8">
        <div id="services" className="px-4 sm:px-0 scroll-mt-24">
          <div className="text-center mb-16">
            <p className="text-brand font-medium tracking-[0.2em] uppercase text-sm mb-3">{t.services}</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-cream mb-4">
              {t.ourCategories}
            </h2>
            <p className="text-cream-300 max-w-2xl mx-auto">
              {t.categoriesDescription}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => navigate(`/services/${encodeURIComponent(cat.name)}`)}
                className="group relative rounded-none overflow-hidden h-72 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-dark"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <img
                  src={cat.image}
                  alt={getCategoryName(cat.name, language, (t as any).categories)}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent transition-all duration-300 group-hover:from-dark/90" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-left border-l-4 border-transparent group-hover:border-brand transition-colors">
                  <h3 className="font-display text-xl font-bold text-cream mb-1">
                    {getCategoryName(cat.name, language, (t as any).categories)}
                  </h3>
                  <p className="text-cream-300 text-sm mb-3">
                    {cat.count} {t.servicesCount}
                  </p>
                  <span className="inline-flex items-center text-brand text-sm font-medium transition-transform duration-300 group-hover:translate-x-1">
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
        <section className="py-24 bg-dark-50 border-y border-brand/10 my-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-cream mb-4">
              {t.training_page?.header || t.training}
            </h2>
            <p className="text-cream-300 mb-8">
              {t.training_page?.intro}
            </p>
            <button
              onClick={() => navigate('/training')}
              className="bg-brand text-dark px-8 py-4 rounded-none font-semibold hover:bg-brand-400 transition-colors uppercase tracking-wider"
            >
              {t.training}
            </button>
          </div>
        </section>

        {/* Blog teaser */}
        <BlogTeaser />

        {/* Reviews Section */}
        <div id="reviews" className="scroll-mt-24">
          <Reviews />
        </div>

        {/* Contact block */}
        <div className="mt-24 bg-dark-100 border border-brand/20 p-12 sm:p-16">
          <h2 className="font-display text-3xl font-bold text-cream mb-12 text-center">
            {t.contact.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div className="text-center">
              <h3 className="font-display text-lg font-semibold text-brand mb-4">
                {t.contact.address}
              </h3>
              <p className="text-cream-300">
                ul. Młynowa 46, Lok U11<br />
                15-404, Białystok<br />
                Tel: <a href="tel:880435102" className="text-brand hover:text-brand-400 transition-colors">880 435 102</a><br />
                Katarzyna
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-display text-lg font-semibold text-brand mb-4">
                {t.contact.openingHours.title}
              </h3>
              <p className="text-cream-300">
                {t.contact.openingHours.weekdays}<br />
                {t.contact.openingHours.saturday}<br />
                {t.contact.openingHours.sunday}
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-display text-lg font-semibold text-brand mb-4">
                {t.contact.socialMedia.title}
              </h3>
              <div className="flex justify-center gap-6 mb-4">
                <a
                  href="https://www.facebook.com/p/Katarzyna-Brui-Permanent-100081111466742/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cream-300 hover:text-brand transition-colors"
                >
                  <FaFacebook size={28} />
                </a>
                <a
                  href="https://www.instagram.com/katarzyna.brui_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cream-300 hover:text-brand transition-colors"
                >
                  <FaInstagram size={28} />
                </a>
              </div>
              <p className="text-cream-300">{t.contact.socialMedia.followUs}</p>
            </div>
          </div>
          <MapLocation />
        </div>
      </main>}
    </div>
  );
};
