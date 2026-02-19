import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';
import { getStylistRole, getStylistSpecialties, getStylistDescription } from '../utils/serviceTranslation';

interface Stylist {
  id: string;
  name: string;
  role: string;
  role_en?: string;
  role_ru?: string;
  image_url: string;
  specialties: string[];
  specialties_en?: string[];
  specialties_ru?: string[];
  description: string;
  description_en?: string;
  description_ru?: string;
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
    <main className="pt-16 min-h-screen bg-neutral-50">
      <SEO
        title="Nasz Zespół"
        description="Poznaj zespół specjalistek salonu Katarzyna Brui w Białymstoku. Doświadczone kosmetyczki i stylistki brwi, rzęs i makijażu permanentnego."
        canonical="/stylists"
      />
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.stylists}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stylists.map((stylist) => (
            <div
              key={stylist.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition-all duration-300"
            >
              <div className="relative h-80 bg-gray-200">
                <img
                  src={stylist.image_url}
                  alt={stylist.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23d4d4d4"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl font-semibold">{stylist.name}</h3>
                  <p className="text-amber-300">{getStylistRole(stylist, language)}</p>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {getStylistSpecialties(stylist, language).map((specialty) => (
                    <span
                      key={specialty}
                      className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
                <p className="text-gray-600">{getStylistDescription(stylist, language)}</p>
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
    </main>
  );
};