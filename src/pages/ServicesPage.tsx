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
import { getCategoryName } from '../utils/serviceTranslation';

interface CategorySEO {
  title: string;
  description: string;
  keywords: string[];
}

const categorySEOData: Record<string, CategorySEO> = {
  'makijaż permanentny': {
    title: 'Makijaż Permanentny Białystok - Brwi, Usta, Oczy',
    description: 'Profesjonalny makijaż permanentny brwi, ust i oczu w Białymstoku. Microblading, metoda pudrowa, ombre. Bezpłatna konsultacja. Umów wizytę - Salon Katarzyna Brui.',
    keywords: [
      'makijaż permanentny Białystok',
      'makijaż permanentny brwi Białystok',
      'makijaż permanentny ust Białystok',
      'microblading Białystok',
      'makijaż permanentny brwi cena',
      'metoda pudrowa brwi Białystok',
      'makijaż permanentny oczu',
      'ombre brwi permanentne',
      'pigmentacja brwi Białystok',
      'linergistka Białystok',
      'korekta makijażu permanentnego',
      'najlepszy makijaż permanentny Białystok',
      'makijaż permanentny brwi metoda pudrowa',
      'ile kosztuje makijaż permanentny brwi',
    ],
  },
  'stylizacja rzęs': {
    title: 'Przedłużanie i Laminacja Rzęs Białystok',
    description: 'Profesjonalne przedłużanie rzęs 1:1, 2-3D, Russian Volume oraz laminacja i lifting rzęs w Białymstoku. Naturalne efekty. Umów wizytę - Salon Katarzyna Brui.',
    keywords: [
      'przedłużanie rzęs Białystok',
      'stylizacja rzęs Białystok',
      'rzęsy 1:1 Białystok',
      'rzęsy objętościowe Białystok',
      'przedłużanie rzęs 2D 3D Białystok',
      'przedłużanie rzęs cena Białystok',
      'uzupełnienie rzęs Białystok',
      'Russian Volume rzęsy Białystok',
      'rzęsy mokry efekt Białystok',
      'najlepsza stylizacja rzęs Białystok',
      'ile kosztuje przedłużanie rzęs',
      'salon rzęs Białystok',
    ],
  },
  'rzęsy': {
    title: 'Lifting i Botox Rzęs Białystok',
    description: 'Lifting rzęs, botox rzęs i henna rzęs w Białymstoku. Naturalnie podkręcone i odżywione rzęsy. Efekty do 8 tygodni. Umów wizytę - Salon Katarzyna Brui.',
    keywords: [
      'lifting rzęs Białystok',
      'laminacja rzęs Białystok',
      'botox rzęs Białystok',
      'henna rzęs Białystok',
      'lifting rzęs cena',
      'laminacja rzęs cena Białystok',
      'ile kosztuje lifting rzęs',
      'lifting rzęs efekty',
    ],
  },
  'pielęgnacja brwi': {
    title: 'Laminacja i Henna Brwi Białystok',
    description: 'Laminacja brwi, henna pudrowa, regulacja i stylizacja brwi w Białymstoku. Profesjonalna architektura brwi. Efekty do 6 tygodni. Umów wizytę online.',
    keywords: [
      'laminacja brwi Białystok',
      'henna brwi Białystok',
      'regulacja brwi Białystok',
      'laminacja brwi cena Białystok',
      'henna pudrowa brwi Białystok',
      'stylizacja brwi Białystok',
      'architektura brwi Białystok',
      'laminacja brwi + henna Białystok',
      'botox brwi Białystok',
      'ile kosztuje laminacja brwi',
      'jak długo utrzymuje się laminacja brwi',
      'najlepsza stylizacja brwi Białystok',
    ],
  },
  'peeling węglowy': {
    title: 'Peeling Węglowy Białystok - Carbon Peel',
    description: 'Laserowy peeling węglowy Black Doll w Białymstoku. Oczyszczanie porów, redukcja trądziku i przebarwień. Efekty po pierwszym zabiegu. Umów wizytę - Salon Katarzyna Brui.',
    keywords: [
      'peeling węglowy Białystok',
      'laserowy peeling węglowy Białystok',
      'carbon peel Białystok',
      'black doll zabieg Białystok',
      'peeling węglowy cena',
      'oczyszczanie twarzy laserowe Białystok',
      'peeling węglowy efekty',
      'peeling węglowy na trądzik',
      'laserowe oczyszczanie twarzy Białystok',
      'ile kosztuje peeling węglowy',
    ],
  },
  'laserowe usuwanie': {
    title: 'Laserowe Usuwanie Tatuażu Białystok',
    description: 'Laserowe usuwanie tatuaży i makijażu permanentnego w Białymstoku. Skuteczne zabiegi laserem. Konsultacja gratis. Umów wizytę - Salon Katarzyna Brui.',
    keywords: [
      'usuwanie tatuażu Białystok',
      'laserowe usuwanie tatuażu Białystok',
      'usuwanie makijażu permanentnego Białystok',
      'usuwanie tatuażu laserem cena',
      'usuwanie tatuażu laserem Białystok',
      'usuwanie makijażu permanentnego brwi',
      'usuwanie kresek permanentnych',
      'ile kosztuje usunięcie tatuażu',
      'laser Q-Switch Białystok',
      'redukcja tatuażu laserem Białystok',
    ],
  },
  'manicure': {
    title: 'Manicure Hybrydowy i Żelowy Białystok',
    description: 'Manicure hybrydowy, żelowy i klasyczny w Białymstoku. Profesjonalna stylizacja paznokci, trwałe zdobienia. Umów wizytę online - Salon Katarzyna Brui.',
    keywords: [
      'manicure Białystok',
      'manicure hybrydowy Białystok',
      'manicure żelowy Białystok',
      'manicure klasyczny Białystok',
      'paznokcie hybrydowe Białystok',
      'stylizacja paznokci Białystok',
      'manicure hybrydowy cena Białystok',
      'paznokcie żelowe Białystok',
      'salon paznokci Białystok',
      'najlepszy manicure Białystok',
      'zdobienia paznokci Białystok',
    ],
  },
  'pakiety': {
    title: 'Pakiety Zabiegów Kosmetycznych Białystok',
    description: 'Pakiety zabiegów kosmetycznych w atrakcyjnych cenach. Makijaż permanentny, rzęsy, brwi, peeling węglowy. Oszczędź z pakietem - Salon Katarzyna Brui Białystok.',
    keywords: [
      'pakiety zabiegów kosmetycznych Białystok',
      'pakiet makijaż permanentny',
      'pakiet przedłużanie rzęs + laminacja brwi',
      'pakiet peeling węglowy',
      'promocje salon kosmetyczny Białystok',
      'zabiegi w pakiecie taniej Białystok',
    ],
  },
};

const defaultSEO: CategorySEO = {
  title: 'Usługi Kosmetyczne Białystok | Cennik Zabiegów',
  description: 'Pełna oferta zabiegów kosmetycznych w Białymstoku: makijaż permanentny brwi i ust, stylizacja rzęs, laminacja brwi, peeling węglowy, manicure, laserowe usuwanie tatuażu. Cennik i rezerwacja online.',
  keywords: [
    'usługi kosmetyczne Białystok',
    'zabiegi kosmetyczne cennik',
    'makijaż permanentny Białystok cena',
    'stylizacja rzęs Białystok cena',
    'laminacja brwi Białystok',
    'peeling węglowy Białystok',
    'manicure Białystok',
    'laserowe usuwanie tatuażu Białystok',
    'salon kosmetyczny cennik Białystok',
    'pielęgnacja brwi Białystok',
  ],
};

export const ServicesPage: React.FC = () => {
  const { category } = useParams();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [, setIsLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useLocalizedNavigate();

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (services.length > 0) {
      const uniqueCategories = Array.from(new Set(services.map(s => s.category)));
      setCategories(uniqueCategories);
    }
  }, [services]);

  const loadServices = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('*, service_images(url)')
      .order('category');
    
    if (error) {
      console.error('Error loading services:', error);
      return;
    }
    
    const servicesWithImages = data.map(service => ({
      ...service,
      imageUrl: service.service_images?.[0]?.url || getDefaultImageForCategory(service.category)
    }));
    
    setServices(servicesWithImages);
    setIsLoading(false);
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

  const handleCategoryClick = (cat: string) => {
    navigate(`/services/${encodeURIComponent(cat)}`);
  };

  const handleBookService = (service: Service) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const seo = category ? (categorySEOData[category] || defaultSEO) : defaultSEO;

  // Pick a representative image for og:image based on current category
  const categoryImage = category
    ? getDefaultImageForCategory(category)
    : serviceImages.permanentMakeup;

  return (
    <main className="pt-16 min-h-screen bg-neutral-50">
      <SEO
        title={seo.title}
        description={seo.description}
        canonical={category ? `/services/${encodeURIComponent(category)}` : '/services'}
        image={categoryImage}
        keywords={seo.keywords}
      />
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">{t.services}</h1>
        
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <button
            onClick={() => navigate('/services')}
            className={`px-6 py-3 rounded-full transition-colors ${
              !category ? 'bg-amber-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {t.all}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-6 py-3 rounded-full transition-colors ${
                category === cat ? 'bg-amber-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
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

        {showBookingModal && selectedService && (
          <BookingModal
            service={selectedService}
            onClose={() => setShowBookingModal(false)}
          />
        )}
      </div>
    </main>
  );
};