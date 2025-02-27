import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { ServiceList } from '../components/ServiceList';
import { BookingCalendar } from '../components/BookingCalendar';
import { Service, TimeSlot } from '../types';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const AppointmentsPage: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedStylist, setSelectedStylist] = React.useState<string | null>(null);
  const [selectedService, setSelectedService] = React.useState<Service | null>(null);
  const [services, setServices] = React.useState<Service[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [stylists, setStylists] = React.useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const serviceId = searchParams.get('service');
    const stylistId = searchParams.get('stylist');
    
    if (serviceId) {
      loadServiceById(serviceId);
    }
    if (stylistId) {
      setSelectedStylist(stylistId);
    }
    loadStylists();
  }, [searchParams]);

  const loadStylists = async () => {
    try {
      const { data, error } = await supabase
        .from('stylists')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      if (data) {
        setStylists(data);
      }
    } catch (err) {
      console.error('Error loading stylists:', err);
    }
  };
  const loadServiceById = async (serviceId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();
    
    if (data) {
      setSelectedService(data);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    setError(null);
    try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('category');
    
    if (error) throw error;
    
    if (!error && data) {
      setServices(data);
    }
    } catch (err) {
      setError('Error loading services. Please try again.');
      console.error('Error loading services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    if (selectedService) {
      navigate(`/booking/${selectedService.id}?slot=${slot.id}`);
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-neutral-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {selectedService ? selectedService.name : t.appointments}
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {selectedService ? (
              <BookingCalendar
                service={selectedService}
                stylistId={selectedStylist}
                onSlotSelect={handleSlotSelect}
              />
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                {t.pleaseSelectService}
              </div>
            )}
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filtry</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategoria
                  </label>
                  <select
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    onChange={(e) => {
                      const category = e.target.value;
                      setSelectedService(null);
                      // Filter services by category
                    }}
                  >
                    <option value="">Wszystkie</option>
                    {Array.from(new Set(services.map(s => s.category))).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stylistka
                  </label>
                  <select
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    value={selectedStylist || ''}
                    onChange={(e) => setSelectedStylist(e.target.value || null)}
                  >
                    <option value="">Dowolna</option>
                    {stylists.map(stylist => (
                      <option key={stylist.id} value={stylist.id}>{stylist.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <ServiceList
              services={services}
              onServiceSelect={setSelectedService}
              selectedService={selectedService}
            />
          </div>
        </div>
      </div>
    </div>
  );
};