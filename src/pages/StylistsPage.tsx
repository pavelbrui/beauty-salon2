import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Stylist {
  id: string;
  name: string;
  role: string;
  image_url: string;
  specialties: string[];
  description: string;
}

export const StylistsPage: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useNavigate();
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStylists();
  }, []);

  const loadStylists = async () => {
    try {
      const { data, error } = await supabase
        .from('stylists')
        .select('*')
        .order('name');

      if (error) throw error;
      setStylists(data || []);
    } catch (err) {
      console.error('Error loading stylists:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.stylists}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stylists.map((stylist) => (
            <div
              key={stylist.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition-all duration-300"
            >
              <div className="relative h-80">
                <img
                  src={stylist.image_url}
                  alt={stylist.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl font-semibold">{stylist.name}</h3>
                  <p className="text-amber-300">{stylist.role}</p>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {stylist.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
                <p className="text-gray-600">{stylist.description}</p>
                <button
                  onClick={() => navigate(`/appointments?stylist=${stylist.id}`)}
                  className="mt-4 w-full bg-amber-500 text-white py-3 px-6 rounded-lg font-medium 
                           hover:bg-amber-600 transition-colors shadow-sm"
                >
                  {t.bookNow}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};