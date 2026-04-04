import React from 'react';
import { useParams } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { BreadcrumbSchema, BASE_URL } from '../components/schema';
import { useLanguage } from '../hooks/useLanguage';
import { localizedPath } from '../hooks/useLocalizedPath';
import { translations } from '../i18n/translations';
import { supabase } from '../lib/supabase';
import { LocalizedLink } from '../components/LocalizedLink';
import { GalleryImage } from '../types';
import { getGalleryDescription } from '../utils/serviceTranslation';
import { prerenderReady } from '../utils/prerenderReady';

export const GalleryVideoWatchPage: React.FC = () => {
  const { imageId } = useParams<{ imageId: string }>();
  const { language } = useLanguage();
  const t = translations[language];
  const vw = (t as { video_watch?: Record<string, string> }).video_watch;

  const [row, setRow] = React.useState<GalleryImage | null>(null);
  const [loading, setLoading] = React.useState(true);

  const barePath = imageId ? `/gallery/video/${imageId}` : '/gallery/video';
  const embedUrl = `${BASE_URL}${localizedPath(barePath, language)}`;

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!imageId) {
        setRow(null);
        setLoading(false);
        prerenderReady();
        return;
      }
      const { data, error } = await supabase.from('service_images').select('*').eq('id', imageId).maybeSingle();
      if (cancelled) return;
      if (error) console.error('Gallery video load:', error);
      const img = data as GalleryImage | null;
      if (!img?.video_url) {
        setRow(null);
      } else {
        setRow(img);
      }
      setLoading(false);
      prerenderReady();
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [imageId]);

  const homeName = language === 'en' ? 'Home' : language === 'ru' ? 'Главная' : 'Strona główna';
  const galleryLabel = t.gallery || 'Galeria';

  if (!imageId) {
    return (
      <main className="pt-16 min-h-screen bg-neutral-50">
        <SEO title={vw?.not_found ?? 'Film niedostępny'} noindex canonical={barePath} />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-600">
          <p>{vw?.not_found ?? 'Film jest niedostępny.'}</p>
          <LocalizedLink to="/gallery" className="mt-6 inline-block text-amber-600 hover:underline">
            {vw?.back_gallery ?? 'Galeria'}
          </LocalizedLink>
        </div>
      </main>
    );
  }

  if (!loading && !row) {
    return (
      <main className="pt-16 min-h-screen bg-neutral-50">
        <SEO title={vw?.not_found ?? 'Film niedostępny'} noindex canonical={barePath} />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center text-gray-600">
          <p>{vw?.not_found ?? 'Film jest niedostępny.'}</p>
          <LocalizedLink to="/gallery" className="mt-6 inline-block text-amber-600 hover:underline">
            {vw?.back_gallery ?? 'Galeria'}
          </LocalizedLink>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="pt-16 min-h-screen bg-neutral-50">
        <SEO title={vw?.gallery_video_title ?? 'Film'} canonical={barePath} />
        <div className="flex justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" role="status" aria-label="Loading" />
        </div>
      </main>
    );
  }

  if (!row) return null;

  const desc = getGalleryDescription(row, language);
  const titleBase = vw?.gallery_video_title ?? 'Film z galerii';
  const title = desc ? `${titleBase} – ${desc.slice(0, 60)}${desc.length > 60 ? '…' : ''}` : titleBase;
  const description =
    desc ||
    (language === 'en'
      ? 'Treatment result video – Katarzyna Brui beauty salon Białystok.'
      : language === 'ru'
        ? 'Видео результата процедуры – салон Katarzyna Brui Белосток.'
        : 'Film z efektem zabiegu – salon Katarzyna Brui Białystok.');
  const thumb = row.url !== row.video_url ? row.url : row.video_url;
  const uploadDate = row.created_at?.includes('T') ? row.created_at : `${row.created_at}T12:00:00+01:00`;

  const videoLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: title,
    description,
    thumbnailUrl: thumb,
    contentUrl: row.video_url,
    embedUrl,
    uploadDate,
    inLanguage: language,
  };

  return (
    <main className="pt-16 min-h-screen bg-neutral-50">
      <SEO
        title={title}
        description={description}
        canonical={barePath}
        image={thumb}
        structuredData={videoLd}
        breadcrumbs={[
          { name: homeName, url: '/' },
          { name: galleryLabel, url: '/gallery' },
          { name: titleBase, url: barePath },
        ]}
      />
      <BreadcrumbSchema
        items={[
          { name: homeName, url: '/' },
          { name: galleryLabel, url: '/gallery' },
          { name: titleBase, url: barePath },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <nav className="mb-8 flex flex-wrap gap-4 text-sm text-amber-700">
          <LocalizedLink to="/" className="hover:underline">
            {vw?.back_home ?? '← Strona główna'}
          </LocalizedLink>
          <LocalizedLink to="/gallery" className="hover:underline">
            {vw?.back_gallery ?? '← Galeria'}
          </LocalizedLink>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        {desc && <p className="text-gray-600 mb-8">{desc}</p>}

        <video
          className="w-full rounded-2xl shadow-lg bg-black"
          controls
          playsInline
          preload="metadata"
          poster={row.url !== row.video_url ? row.url : undefined}
        >
          <source src={row.video_url} type="video/mp4" />
        </video>
      </div>
    </main>
  );
};
