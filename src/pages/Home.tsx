import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ServiceCard } from '../components/ServiceCard';
import { AuthModal } from '../components/AuthModal';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { Service } from '../types';
import { heroImage, serviceImages } from '../assets/images';
import { Reviews } from '../components/Reviews';
import { MapLocation } from '../components/MapLocation';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { SEO } from '../components/SEO';
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import { UserCircleIcon } from '@heroicons/react/24/outline';

export const Home: React.FC = () => {
  const [services, setServices] = React.useState<Service[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<any>(null);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('services')
        .select('*, service_images(url)')
        .order('category');
      
      if (error) {
        throw error;
      }
      
      const servicesWithImages = data.map(service => ({
        ...service,
        imageUrl: service.service_images?.[0]?.url || getDefaultImageForCategory(service.category)
      }));
      
      setServices(servicesWithImages);
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
    <div className="min-h-screen bg-neutral-50">
      <SEO
        title="Strona Główna"
        description="Salon kosmetyczny Katarzyna Brui w Białymstoku. Makijaż permanentny brwi i ust, stylizacja rzęs, pielęgnacja brwi, peeling węglowy oraz szkolenia z makijażu permanentnego. Umów wizytę online! Tel: 880 435 102."
        canonical="/"
        keywords={[
          'salon kosmetyczny Białystok',
          'makijaż permanentny',
          'szkolenia makijażu permanentnego',
          'przedłużanie rzęs Białystok'
        ]}
      />
      <header
        className="relative h-screen bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4)), url(${heroImage})`
        }}
      >
        <div className="absolute inset-0 flex flex-col justify-center items-center px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 text-center">
            {t.welcomeTitle}
          </h1>
          <p className="mt-6 text-lg sm:text-xl md:text-2xl text-white/90 max-w-xl text-center">
            {t.welcomeSubtitle}
          </p>
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="flex items-center space-x-4 justify-center">
              <button
                onClick={scrollToReviews}
                className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/100 transition-all cursor-pointer"
              >
                <span className="text-amber-500 text-2xl font-semibold">5.0</span>
                <span className="text-gray-800 ml-2">/ 5.0</span>
                <div className="text-sm text-gray-600">
                  <span>380 </span>
                  <span>{t.reviewsLabel}</span>
                </div>
              </button>
              <button
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-300 bg-[length:200%_auto] animate-shimmer text-white px-8 py-3 rounded-lg font-medium hover:scale-105 transition-transform"
              >
                {t.bookNow}
              </button>
            </div>

            {!user ? (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-full hover:bg-white/30 transition-all text-sm"
              >
                <UserCircleIcon className="h-5 w-5" />
                {t.home?.loginPrompt || 'Zaloguj się lub utwórz konto'}
              </button>
            ) : (
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-full hover:bg-white/30 transition-all text-sm"
              >
                <UserCircleIcon className="h-5 w-5" />
                {t.profile}
              </button>
            )}
          </div>
        </div>
      </header>
      
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">{t.aboutTitle}</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {t.aboutText}
            </p>
          </div>
        </div>
      </section>

      {!loading && !error && <main className="max-w-7xl mx-auto py-16 sm:px-6 lg:px-8">
        <div id="services" className="px-4 sm:px-0 scroll-mt-20 overflow-hidden">
          <h2 className="text-3xl font-semibold text-gray-900 mb-2 text-center">
            {t.ourServices}
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            {t.servicesDescription}
          </p>
          
          <div className="flex overflow-x-auto pb-6 gap-6 snap-x snap-mandatory">
            {services.map(service => (
              <div key={service.id} className="snap-center shrink-0" style={{ width: '300px' }}>
                <ServiceCard
                  service={service}
                />
              </div>
            ))}
          </div>
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

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode="signin"
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />
    </div>
  );
};