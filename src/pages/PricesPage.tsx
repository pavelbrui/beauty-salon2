import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { Service } from '../types';
import { SEO } from '../components/SEO';
import { LocalizedLink } from '../components/LocalizedLink';
import { getCategoryName, getServiceName } from '../utils/serviceTranslation';

export const PricesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useLanguage();
  const t = translations[language];
  const pt = (t as Record<string, unknown>).prices_page as Record<string, string>;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [servicesRes, catRes] = await Promise.all([
      supabase.from('services').select('*').eq('is_hidden', false).order('category'),
      supabase.from('service_categories').select('name, sort_order').order('sort_order'),
    ]);

    if (servicesRes.error) {
      console.error('Error loading services:', servicesRes.error);
      setIsLoading(false);
      return;
    }

    setServices(servicesRes.data || []);

    if (catRes.data && catRes.data.length > 0) {
      const orderMap = new Map(catRes.data.map((c: { name: string; sort_order: number }) => [c.name, c.sort_order]));
      const uniqueCats = [...new Set((servicesRes.data || []).map((s: Service) => s.category))];
      const sorted = uniqueCats.sort((a, b) => {
        const oa = orderMap.get(a) ?? 999;
        const ob = orderMap.get(b) ?? 999;
        return oa - ob;
      });
      setCategories(sorted);
    } else {
      setCategories([...new Set((servicesRes.data || []).map((s: Service) => s.category))]);
    }

    setIsLoading(false);
  };

  const formatPrice = (price: number) => `${(price / 100).toFixed(0)} PLN`;
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  // Structured data — OfferCatalog with all services
  const structuredData = services.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    'name': language === 'en' ? 'Price List – Katarzyna Brui Beauty Salon'
          : language === 'ru' ? 'Прайс-лист – Салон красоты Катажина Бруй'
          : 'Cennik zabiegów – Salon Katarzyna Brui Białystok',
    'url': 'https://katarzynabrui.pl/prices',
    'provider': {
      '@type': 'BeautySalon',
      'name': 'Salon Kosmetyczny Katarzyna Brui',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': 'ul. Młynowa 46, Lok U11',
        'addressLocality': 'Białystok',
        'postalCode': '15-404',
        'addressCountry': 'PL',
      },
      'telephone': '+48880435102',
    },
    'itemListElement': categories.flatMap(cat =>
      services.filter(s => s.category === cat).map(service => ({
        '@type': 'Offer',
        'itemOffered': {
          '@type': 'Service',
          'name': service.name,
          'category': cat,
        },
        'price': (service.price / 100).toFixed(0),
        'priceCurrency': 'PLN',
        'availability': 'https://schema.org/InStock',
      }))
    ),
  } : undefined;

  return (
    <main className="pt-16 min-h-screen bg-neutral-50">
      <SEO
        title={pt?.title || 'Cennik Zabiegów Kosmetycznych'}
        description={pt?.description || 'Pełny cennik zabiegów kosmetycznych w salonie Katarzyna Brui w Białymstoku.'}
        canonical={language === 'pl' ? '/cennik' : '/prices'}
        keywords={language === 'pl' ? [
          'cennik salon kosmetyczny Białystok',
          'cennik zabiegów kosmetycznych Białystok',
          'ile kosztuje makijaż permanentny brwi',
          'ile kosztuje przedłużanie rzęs',
          'ile kosztuje laminacja brwi',
          'makijaż permanentny brwi cena Białystok',
          'przedłużanie rzęs cena Białystok',
          'laminacja brwi cena Białystok',
          'cennik manicure hybrydowy Białystok',
          'cennik peeling węglowy Białystok',
          'usuwanie tatuażu cena Białystok',
          'kosmetyczka Białystok cennik',
          'ceny usług kosmetycznych Białystok',
          'cennik stylizacja rzęs Białystok',
          'lifting rzęs cena',
          'henna brwi cena Białystok',
        ] : language === 'en' ? [
          'beauty salon prices Bialystok',
          'permanent makeup price Bialystok',
          'lash extensions price',
          'brow lamination cost',
          'manicure prices Bialystok',
          'beauty treatment price list Poland',
        ] : [
          'цены салон красоты Белосток',
          'перманентный макияж цена Белосток',
          'наращивание ресниц цена',
          'ламинирование бровей стоимость',
          'прайс лист косметические услуги',
        ]}
        structuredData={structuredData}
        breadcrumbs={[
          { name: language === 'en' ? 'Home' : language === 'ru' ? 'Главная' : 'Strona główna', url: '/' },
          { name: pt?.heading || 'Cennik', url: '/prices' },
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {pt?.heading || 'Cennik'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {pt?.subtitle || 'Sprawdź aktualne ceny naszych zabiegów kosmetycznych'}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map(cat => {
              const catServices = services.filter(s => s.category === cat);
              if (catServices.length === 0) return null;

              return (
                <section key={cat}>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-amber-500">
                    {getCategoryName(cat, language, (t as any).categories)}
                  </h2>

                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          <th className="px-6 py-3">{pt?.service || 'Zabieg'}</th>
                          <th className="px-6 py-3 text-center">{pt?.duration || 'Czas'}</th>
                          <th className="px-6 py-3 text-right">{pt?.price || 'Cena'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {catServices.map(service => (
                          <tr key={service.id} className="hover:bg-amber-50/40 transition-colors">
                            <td className="px-6 py-4 text-gray-900 font-medium">
                              {getServiceName(service, language)}
                            </td>
                            <td className="px-6 py-4 text-gray-500 text-center text-sm">
                              {formatDuration(service.duration)}
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-amber-600 whitespace-nowrap">
                              {formatPrice(service.price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile list */}
                  <div className="sm:hidden space-y-3">
                    {catServices.map(service => (
                      <div key={service.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                        <div className="flex justify-between items-start">
                          <h3 className="text-gray-900 font-medium flex-1 pr-3">
                            {getServiceName(service, language)}
                          </h3>
                          <span className="font-semibold text-amber-600 whitespace-nowrap">
                            {formatPrice(service.price)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDuration(service.duration)}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            {pt?.ctaText || 'Chcesz zarezerwować wizytę?'}
          </p>
          <LocalizedLink
            to="/services"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 py-3 rounded-full transition-colors shadow-md"
          >
            {pt?.ctaButton || t.bookNow}
          </LocalizedLink>
        </div>
      </div>
    </main>
  );
};
