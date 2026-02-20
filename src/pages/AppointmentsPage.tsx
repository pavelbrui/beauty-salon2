import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { ServiceList } from '../components/ServiceList';
import { UserBookings } from '../components/UserBookings';
import { Service, Stylist } from '../types';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';
import { StylistFilter } from '../components/StylistFilter';

export const AppointmentsPage: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStylistId, setSelectedStylistId] = useState<string>('');
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [stylistServiceIds, setStylistServiceIds] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // If navigated with ?service=, redirect directly to booking page
  useEffect(() => {
    const serviceId = searchParams.get('service');
    if (serviceId) {
      navigate(`/booking/${serviceId}`, { replace: true });
    }
  }, [searchParams, navigate]);

  // Read ?stylist= from URL on mount
  useEffect(() => {
    const stylistParam = searchParams.get('stylist');
    if (stylistParam) {
      setSelectedStylistId(stylistParam);
    }
  }, []);

  useEffect(() => {
    loadServices();
    loadStylists();
  }, []);

  // Load service assignments when stylist filter changes
  useEffect(() => {
    if (selectedStylistId) {
      loadStylistServices(selectedStylistId);
    } else {
      setStylistServiceIds(null);
    }
  }, [selectedStylistId]);

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

  const loadStylists = async () => {
    try {
      const { data, error } = await supabase
        .from('stylists')
        .select('*')
        .order('name');

      if (error) throw error;
      if (data) setStylists(data);
    } catch (err) {
      console.error('Error loading stylists:', err);
    }
  };

  const loadStylistServices = async (stylistId: string) => {
    try {
      const { data, error } = await supabase
        .from('stylist_service_assignments')
        .select('service_id')
        .eq('stylist_id', stylistId);

      if (error) throw error;
      if (data && data.length > 0) {
        setStylistServiceIds(data.map(a => a.service_id));
      } else {
        // No assignments — show all services
        setStylistServiceIds(null);
      }
    } catch (err) {
      console.error('Error loading stylist services:', err);
      setStylistServiceIds(null);
    }
  };

  const handleStylistSelect = (stylistId: string) => {
    setSelectedStylistId(stylistId);
    // Update URL params
    if (stylistId) {
      setSearchParams({ stylist: stylistId });
    } else {
      setSearchParams({});
    }
  };

  const handleServiceSelect = (service: Service) => {
    if (selectedStylistId) {
      navigate(`/booking/${service.id}?stylist=${selectedStylistId}`);
    } else {
      navigate(`/booking/${service.id}`);
    }
  };

  // Apply both filters
  let filteredServices = services;
  if (selectedCategory) {
    filteredServices = filteredServices.filter(s => s.category === selectedCategory);
  }
  if (stylistServiceIds) {
    filteredServices = filteredServices.filter(s => stylistServiceIds.includes(s.id));
  }

  const categories = [...new Set(services.map(s => s.category))];

  return (
    <main className="pt-16 min-h-screen bg-neutral-50 overflow-x-hidden">
      <SEO
        title="Rezerwacja Online - Umów Wizytę"
        description="Zarezerwuj wizytę online w salonie kosmetycznym Katarzyna Brui w Białymstoku. Wybierz zabieg, termin i stylistkę. Szybka i wygodna rezerwacja bez dzwonienia!"
        canonical="/appointments"
        keywords={[
          'rezerwacja online salon kosmetyczny Białystok',
          'umów wizytę kosmetyczka Białystok',
          'rezerwacja makijaż permanentny',
          'rezerwacja stylizacja rzęs',
          'zarezerwuj zabieg kosmetyczny Białystok'
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {t.appointments}
        </h1>

        {/* Show user's bookings if logged in */}
        {isLoggedIn && (
          <div className="mb-10">
            <UserBookings />
          </div>
        )}

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

          <div className="lg:col-span-1 space-y-6">
            {/* Stylist filter */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t.stylistLabel}</h3>
              <StylistFilter
                stylists={stylists}
                selectedId={selectedStylistId}
                onSelect={handleStylistSelect}
                allLabel={t.allStylistsFilter}
                layout="vertical"
                showRole
              />
            </div>

            {/* Category filter */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t.categoryLabel}</h3>
              <div>
                <select
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">{t.allCategories}</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
