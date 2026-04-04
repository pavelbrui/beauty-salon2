import React from 'react';
import { useParams } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { BreadcrumbSchema, BASE_URL } from '../components/schema';
import { useLanguage } from '../hooks/useLanguage';
import { localizedPath } from '../hooks/useLocalizedPath';
import { translations } from '../i18n/translations';
import { supabase } from '../lib/supabase';
import { LocalizedLink } from '../components/LocalizedLink';
import { getCategoryNameFromSlug, getCategorySlug } from '../utils/categorySlugMap';
import { getCategoryName } from '../utils/serviceTranslation';
import { getCategoryVideoSeoData } from '../utils/categoryVideoSeo';
import { prerenderReady } from '../utils/prerenderReady';

export const CategoryVideoWatchPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { language } = useLanguage();
  const t = translations[language];
  const vw = (t as { video_watch?: Record<string, string> }).video_watch;

  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [thumbUrl, setThumbUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const categoryName = categorySlug ? getCategoryNameFromSlug(categorySlug) : undefined;
  const barePath = categorySlug ? `/video/category/${categorySlug}` : '/video/category';
  const embedUrl = `${BASE_URL}${localizedPath(barePath, language)}`;

  const videoSeo = categoryName ? getCategoryVideoSeoData(categoryName, language) : null;

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!categoryName) {
        setLoading(false);
        prerenderReady();
        return;
      }
      const { data, error } = await supabase
        .from('service_categories')
        .select('video_url,image_url')
        .eq('name', categoryName)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error('Category video load:', error);
      }
      setVideoUrl(data?.video_url ?? null);
      setThumbUrl(data?.image_url ?? null);
      setLoading(false);
      prerenderReady();
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [categoryName]);

  const homeName = language === 'en' ? 'Home' : language === 'ru' ? 'Главная' : 'Strona główna';
  const servicesName = t.services || 'Usługi';

  if (!categoryName || !videoSeo) {
    return (
      <main className="pt-16 min-h-screen bg-neutral-50">
        <SEO title={vw?.not_found ?? 'Film niedostępny'} noindex canonical={barePath} />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-600">
          <p>{vw?.not_found ?? 'Film jest niedostępny.'}</p>
          <LocalizedLink to="/services" className="mt-6 inline-block text-amber-600 hover:underline">
            {servicesName}
          </LocalizedLink>
        </div>
      </main>
    );
  }

  if (!loading && !videoUrl) {
    return (
      <main className="pt-16 min-h-screen bg-neutral-50">
        <SEO title={vw?.not_found ?? 'Film niedostępny'} noindex canonical={barePath} />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-600">
          <p>{vw?.not_found ?? 'Film jest niedostępny.'}</p>
          <LocalizedLink
            to={`/services/${getCategorySlug(categoryName)}`}
            className="mt-6 inline-block text-amber-600 hover:underline"
          >
            {vw?.back_category_services ?? 'Usługi w tej kategorii'}
          </LocalizedLink>
        </div>
      </main>
    );
  }

  const displayTitle = `${vw?.category_heading ?? 'Film'}: ${getCategoryName(categoryName, language, (t as Record<string, unknown>).categories as Record<string, string>)}`;
  const thumb = thumbUrl || `${BASE_URL}/og-image.jpg`;

  const videoLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: videoSeo.title,
    description: videoSeo.description,
    thumbnailUrl: thumb,
    contentUrl: videoUrl,
    embedUrl,
    uploadDate: '2025-01-01T00:00:00+01:00',
    inLanguage: language,
  };

  return (
    <main className="pt-16 min-h-screen bg-neutral-50">
      <SEO
        title={videoSeo.title}
        description={videoSeo.description}
        canonical={barePath}
        image={thumb}
        structuredData={videoLd}
        breadcrumbs={[
          { name: homeName, url: '/' },
          { name: servicesName, url: '/services' },
          { name: displayTitle, url: barePath },
        ]}
      />
      <BreadcrumbSchema
        items={[
          { name: homeName, url: '/' },
          { name: servicesName, url: '/services' },
          { name: displayTitle, url: barePath },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <nav className="mb-8 flex flex-wrap gap-4 text-sm text-amber-700">
          <LocalizedLink to="/" className="hover:underline">
            {vw?.back_home ?? '← Strona główna'}
          </LocalizedLink>
          <LocalizedLink to={`/services/${getCategorySlug(categoryName)}`} className="hover:underline">
            {vw?.back_category_services ?? 'Usługi w tej kategorii'}
          </LocalizedLink>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{videoSeo.title}</h1>
        <p className="text-gray-600 mb-8">{videoSeo.description}</p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" role="status" aria-label="Loading" />
          </div>
        ) : (
          <video
            className="w-full rounded-2xl shadow-lg bg-black"
            controls
            playsInline
            preload="metadata"
            poster={thumbUrl || undefined}
          >
            <source src={videoUrl!} type="video/mp4" />
          </video>
        )}
      </div>
    </main>
  );
};
