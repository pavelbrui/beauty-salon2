import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { useLocalizedNavigate } from '../hooks/useLocalizedPath';
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
  const navigate = useLocalizedNavigate();
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
      <div className="pt-16 min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <main className="pt-16 min-h-screen bg-white">
      <SEO
        title="Nasi Specjaliści - Kosmetyczki i Stylistki"
        description="Poznaj zespół doświadczonych kosmetyczek i stylistek studia Anna Nowak w Białymstoku. Specjalistki makijażu permanentnego, stylizacji rzęs i pielęgnacji brwi."
        canonical="/stylists"
        keywords={[
          'kosmetyczka Białystok',
          'stylistka rzęs Białystok',
          'linergistka Białystok',
          'specjalistka makijażu permanentnego',
          'specjalistka brwi Białystok',
          'najlepsza kosmetyczka Białystok'
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-rose-500 text-sm uppercase tracking-[0.2em] mb-3 font-medium">
            {language === 'pl' ? 'Nasz zespół' : language === 'ru' ? 'Наша команда' : 'Our team'}
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 mb-4">{t.stylists}</h1>
          <div className="w-16 h-0.5 bg-rose-300 mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stylists.map((stylist) => (
            <div
              key={stylist.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl overflow-hidden transition-all duration-500 border border-rose-100/50 group"
            >
              <div className="relative h-80 bg-rose-50">
                <img
                  src={stylist.image_url}
                  alt={`${stylist.name} – ${getStylistRole(stylist, language)}, studio Anna Nowak Białystok`}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23d4d4d4"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-rose-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl font-serif font-bold">{stylist.name}</h3>
                  <p className="text-rose-200 text-sm">{getStylistRole(stylist, language)}</p>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {getStylistSpecialties(stylist, language).map((specialty) => (
                    <span
                      key={specialty}
                      className="px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-medium border border-rose-100"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">{getStylistDescription(stylist, language)}</p>
                <button
                  onClick={() => navigate(`/appointments?stylist=${stylist.id}`)}
                  className="mt-5 w-full bg-rose-500 text-white py-3 px-6 rounded-xl font-medium 
                           hover:bg-rose-600 transition-all hover:shadow-lg hover:shadow-rose-500/20"
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