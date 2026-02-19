import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { ServiceList } from '../components/ServiceList';
import { Service, Stylist } from '../types';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';

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

          <div className="lg:col-span-1 space-y-6">
            {/* Stylist filter */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t.stylistLabel}</h3>
              <div className="space-y-2">
                {/* "All stylists" option */}
                <button
                  onClick={() => handleStylistSelect('')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                    !selectedStylistId
                      ? 'bg-amber-50 ring-2 ring-amber-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    !selectedStylistId ? 'bg-amber-500' : 'bg-gray-200'
                  }`}>
                    <svg className={`w-5 h-5 ${!selectedStylistId ? 'text-white' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className={`text-sm font-medium ${!selectedStylistId ? 'text-amber-700' : 'text-gray-700'}`}>
                    {t.allStylistsFilter}
                  </span>
                </button>

                {/* Individual stylists */}
                {stylists.map((stylist) => (
                  <button
                    key={stylist.id}
                    onClick={() => handleStylistSelect(stylist.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                      selectedStylistId === stylist.id
                        ? 'bg-amber-50 ring-2 ring-amber-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                      {stylist.image_url ? (
                        <img
                          src={stylist.image_url}
                          alt={stylist.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = `<svg class="w-5 h-5 text-gray-400 m-auto mt-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`;
                          }}
                        />
                      ) : (
                        <svg className="w-5 h-5 text-gray-400 m-auto mt-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        selectedStylistId === stylist.id ? 'text-amber-700' : 'text-gray-900'
                      }`}>
                        {stylist.name}
                      </p>
                      {stylist.role && (
                        <p className="text-xs text-gray-500 truncate">{stylist.role}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
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
    </div>
  );
};
