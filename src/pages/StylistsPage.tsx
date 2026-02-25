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
    <main className="pt-20 min-h-screen bg-[#FAF9F7]">
      <SEO
        title="Nasi Specjaliści - Kosmetyczki i Stylistki"
        description="Poznaj zespół doświadczonych kosmetyczek i stylistek studia Anna Nowak w Białymstoku. Specjalistki makijażu permanentnego, stylizacji rzęs i pielęgnacji brwi."
        canonical="/stylists"
        keywords={['kosmetyczka Białystok','stylistka rzęs Białystok','linergistka Białystok','specjalistka makijażu permanentnego']}
      />
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-16">
        <div className="mb-14">
          <span className="text-[11px] uppercase tracking-[0.3em] text-rose-500 font-medium">
            {language === 'pl' ? 'Nasz zespół' : language === 'ru' ? 'Наша команда' : 'Our team'}
          </span>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-gray-900 mt-3">{t.stylists}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stylists.map((stylist) => (
            <div key={stylist.id} className="group bg-white border border-gray-100 hover:border-gray-200 transition-all duration-500 overflow-hidden">
              <div className="relative h-96 bg-gray-100">
                <img
                  src={stylist.image_url}
                  alt={`${stylist.name} – ${getStylistRole(stylist, language)}, studio Anna Nowak Białystok`}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[800ms]"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23d4d4d4"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'; }}
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-serif font-bold text-gray-900">{stylist.name}</h3>
                <p className="text-rose-500 text-xs uppercase tracking-wider mt-1 mb-4">{getStylistRole(stylist, language)}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {getStylistSpecialties(stylist, language).map((specialty) => (
                    <span key={specialty} className="text-[10px] uppercase tracking-wider text-gray-400 border border-gray-200 px-2.5 py-1">
                      {specialty}
                    </span>
                  ))}
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">{getStylistDescription(stylist, language)}</p>
                <button
                  onClick={() => navigate(`/appointments?stylist=${stylist.id}`)}
                  className="w-full text-[12px] uppercase tracking-[0.15em] font-semibold py-3.5 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300"
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