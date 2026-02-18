import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { ServiceList } from '../components/ServiceList';
import { Service } from '../types';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';

export const AppointmentsPage: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = React.useState<string>('');
  const [services, setServices] = React.useState<Service[]>([]);
  const [loading, setLoading] = React.useState(true);

  // If navigated with ?service=, redirect directly to booking page
  useEffect(() => {
    const serviceId = searchParams.get('service');
    if (serviceId) {
      navigate(`/booking/${serviceId}`, { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('category');

      if (error) throw error;
      if (data) setServices(data);
    } catch (err) {
      console.error('Error loading services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    navigate(`/booking/${service.id}`);
  };

  const filteredServices = selectedCategory
    ? services.filter(s => s.category === selectedCategory)
    : services;

  const categories = [...new Set(services.map(s => s.category))];

  return (
    <div className="pt-16 min-h-screen bg-neutral-50 overflow-x-hidden">
      <SEO
        title="Rezerwacja Wizyty"
        description="Zarezerwuj wizytę online w salonie kosmetycznym Katarzyna Brui w Białymstoku. Wybierz usługę, termin i umów się bez dzwonienia!"
        canonical="/appointments"
      />
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {t.appointments}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600 mb-6">{t.pleaseSelectService}</p>
                <ServiceList
                  services={filteredServices}
                  onServiceSelect={handleServiceSelect}
                  selectedService={null}
                />
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filtry</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategoria
                </label>
                <select
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Wszystkie</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};