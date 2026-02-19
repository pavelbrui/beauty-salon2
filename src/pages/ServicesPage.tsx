import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { Service } from '../types';
import { ServiceSection } from '../components/ServiceSection';
import { BookingModal } from '../components/BookingModal';
import { serviceImages } from '../assets/images';
import { SEO } from '../components/SEO';
import { getCategoryName } from '../utils/serviceTranslation';

export const ServicesPage: React.FC = () => {
  const { category } = useParams();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [, setIsLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();

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
        return serviceImages.lashes;
      case 'laserowe usuwanie':
        return serviceImages.tattooRemoval;
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

  return (
    <div className="pt-16 min-h-screen bg-neutral-50">
      <SEO
        title="Usługi"
        description="Cennik usług salonu Katarzyna Brui: makijaż permanentny brwi i ust, stylizacja rzęs, laminacja brwi, peeling węglowy, laserowe usuwanie tatuażu. Białystok."
        canonical="/services"
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
    </div>
  );
};