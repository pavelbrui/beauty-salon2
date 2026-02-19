import React from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { Service } from '../types';
import { ServiceCard } from '../components/ServiceCard';
import { serviceImages } from '../assets/images';

export const ServicesPage: React.FC = () => {
  const [services, setServices] = React.useState<Service[]>([]);
  const { language } = useLanguage();
  const t = translations[language];

  React.useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
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

  return (
    <div className="pt-16 min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.services}</h1>
        
        {Array.from(new Set(services.map(s => s.category))).map(category => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services
                .filter(service => service.category === category)
                .map(service => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};