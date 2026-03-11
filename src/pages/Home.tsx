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
import { CategoryVideoCard } from '../components/CategoryVideoCard';
import { prerenderReady } from '../utils/prerenderReady';

interface CategoryInfo {
  name: string;
  count: number;
  image: string;
  videoUrl?: string | null;
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
        supabase.from('services').select('category').eq('is_hidden', false).order('category'),
        supabase.from('service_categories').select('name, sort_order, image_url, video_url').order('sort_order'),
      ]);

      if (servicesRes.error) {
        throw servicesRes.error;
      }

      const categoryMap = new Map<string, number>();
      servicesRes.data.forEach((s: { category: string }) => {
        categoryMap.set(s.category, (categoryMap.get(s.category) || 0) + 1);
      });

      const orderMap = new Map<string, number>();
      const imageMap = new Map<string, string>();
      const videoMap = new Map<string, string>();
      if (catOrderRes.data) {
        catOrderRes.data.forEach((c: { name: string; sort_order: number; image_url: string | null; video_url: string | null }) => {
          orderMap.set(c.name, c.sort_order);
          if (c.image_url) imageMap.set(c.name, c.image_url);
          if (c.video_url) videoMap.set(c.name, c.video_url);
        });
      }

      const cats: CategoryInfo[] = Array.from(categoryMap.entries())
        .map(([name, count]) => ({
          name,
          count,
          image: imageMap.get(name) || getStaticImageForCategory(name),
          videoUrl: videoMap.get(name) || null,
        }))
        .sort((a, b) => (orderMap.get(a.name) ?? 999) - (orderMap.get(b.name) ?? 999));

      setCategories(cats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load services';
      setError(message);
      console.error('Error loading services:', err);
    } finally {
      setLoading(false);
      // Delay to let sub-components (BlogTeaser, Reviews) mount and fetch their data
      setTimeout(prerenderReady, 1000);
    }
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

  return (
    <div className="min-h-screen bg-neutral-50">
      <SEO
        title={(t as any).home_seo?.title || 'Salon Kosmetyczny Białystok'}
        description={(t as any).home_seo?.description || 'Salon kosmetyczny Katarzyna Brui w Białymstoku. Makijaż permanentny brwi i ust, stylizacja rzęs, laminacja brwi, peeling węglowy, manicure. Rezerwacja online.'}
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
            'reviewCount': '384',
            'bestRating': '5',
            'worstRating': '1',
            'url': 'https://booksy.com/pl-pl/162206_katarzyna-brui_salon-kosmetyczny_5869_bialystok'
          },
          'sameAs': [
            'https://www.facebook.com/p/Katarzyna-Brui-Permanent-100081111466742/',
            'https://www.instagram.com/katarzyna.brui_',
            'https://booksy.com/pl-pl/162206_katarzyna-brui_salon-kosmetyczny_5869_bialystok'
          ]
        }}
      />
      <header className="relative h-screen">
        {/* Hero image — semantic <img> for Google Image indexing */}
        <img
          src="/og-image2.jpg"
          alt="Salon kosmetyczny Katarzyna Brui Białystok – makijaż permanentny brwi, stylizacja rzęs, laminacja brwi"
          className="absolute inset-0 w-full h-full object-cover"
          fetchPriority="high"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
        <div className="absolute inset-0 flex flex-col justify-center items-center px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 text-center">
            {t.welcomeTitle}
          </h1>
          <p className="mt-6 text-lg sm:text-xl md:text-2xl text-white/90 max-w-xl text-center">
            {t.welcomeSubtitle}
          </p>
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="flex items-center space-x-4 justify-center">
              <a
                href="https://booksy.com/pl-pl/162206_katarzyna-brui_salon-kosmetyczny_5869_bialystok"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/100 transition-all cursor-pointer inline-block"
              >
                <span className="text-amber-500 text-2xl font-semibold">5.0</span>
                <span className="text-gray-800 ml-2">/ 5.0</span>
                <div className="text-sm text-gray-600">
                  <span>384 </span>
                  <span>{t.reviewsLabel}</span>
                </div>
              </a>
              <button
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-300 bg-[length:200%_auto] animate-shimmer text-white px-8 py-3 rounded-lg font-medium hover:scale-105 transition-transform"
              >
                {t.bookNow}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">{t.aboutTitle}</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                {t.aboutText}
              </p>
            </div>
            <div className="flex-1 w-full max-w-md">
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <video
                  className="w-full"
                  autoPlay
                  muted
                  loop
                  playsInline
                >
                  <source src="/intro-video.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!loading && !error && <main className="max-w-7xl mx-auto py-16 sm:px-6 lg:px-8">
        <div id="services" className="px-4 sm:px-0 scroll-mt-20">
          <h2 className="text-3xl font-semibold text-gray-900 mb-2 text-center">
            {t.ourCategories}
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            {t.categoriesDescription}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(cat => (
              <CategoryVideoCard
                key={cat.name}
                displayName={getCategoryName(cat.name, language, (t as any).categories)}
                count={cat.count}
                image={cat.image}
                videoUrl={cat.videoUrl}
                servicesCountLabel={t.servicesCount}
                ctaLabel={t.viewCategoryServices}
                onClick={() => navigate(`/services/${encodeURIComponent(cat.name)}`)}
              />
            ))}
          </div>

          {/* VideoObject structured data for categories with videos */}
          {categories.some(c => c.videoUrl) && (
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(
              categories
                .filter(c => c.videoUrl)
                .map(c => ({
                  '@context': 'https://schema.org',
                  '@type': 'VideoObject',
                  name: getCategoryName(c.name, language, (t as any).categories),
                  description: `${getCategoryName(c.name, language, (t as any).categories)} – salon kosmetyczny Katarzyna Brui, Białystok`,
                  thumbnailUrl: c.image,
                  contentUrl: c.videoUrl,
                  uploadDate: '2026-03-01',
                }))
            )}} />
          )}
        </div>

        {/* Training callout */}
        <section className="py-20 bg-amber-50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t.training_page?.header || t.training}
            </h2>
            <p className="text-gray-600 mb-6">
              {t.training_page?.intro}
            </p>
            <button
              onClick={() => navigate('/training')}
              className="bg-amber-500 text-white px-6 py-3 rounded-full hover:bg-amber-600 transition-colors"
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

        <div className="mt-24 bg-gradient-to-br from-amber-50 to-white shadow-lg rounded-xl p-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-8 text-center">
            {t.contact.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div className="text-center">
              <h3 className="text-xl font-medium text-amber-600 mb-4">
                {t.contact.address}
              </h3>
              <p className="text-gray-600">
                ul. Młynowa 46, Lok U11<br />
                15-404, Białystok<br />
                Tel: <a href="tel:880435102" className="text-amber-600 hover:text-amber-700">880 435 102</a><br />
                Katarzyna
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-medium text-amber-600 mb-4">
                {t.contact.openingHours.title}
              </h3>
              <p className="text-gray-600">
                {t.contact.openingHours.weekdays}<br />
                {t.contact.openingHours.saturday}<br />
                {t.contact.openingHours.sunday}
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-medium text-amber-600 mb-4">
                {t.contact.socialMedia.title}
              </h3>
              <div className="flex justify-center space-x-4 mb-4">
                <a
                  href="https://www.facebook.com/p/Katarzyna-Brui-Permanent-100081111466742/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:text-amber-700 transition-colors"
                >
                  <FaFacebook size={28} />
                </a>
                <a
                  href="https://www.instagram.com/katarzyna.brui_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:text-amber-700 transition-colors"
                >
                  <FaInstagram size={28} />
                </a>
              </div>
              <p className="text-gray-600">{t.contact.socialMedia.followUs}</p>
            </div>
          </div>
          <MapLocation />
        </div>
      </main>}

    </div>
  );
};