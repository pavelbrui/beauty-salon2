import React from 'react';
import { SEO } from '../components/SEO';
import { BreadcrumbSchema, BASE_URL } from '../components/schema';
import { useLanguage } from '../hooks/useLanguage';
import { localizedPath } from '../hooks/useLocalizedPath';
import { translations } from '../i18n/translations';
import { LocalizedLink } from '../components/LocalizedLink';
import { prerenderReady } from '../utils/prerenderReady';

const CONTENT_PATH = '/intro-video.mp4';
const CONTENT_URL = `${BASE_URL}${CONTENT_PATH}`;
const THUMBNAIL_URL = `${BASE_URL}/og-image2.jpg`;

export const IntroVideoWatchPage: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [introVideos, setIntroVideos] = React.useState<string[]>([]);
  const [currentVideoIdx, setCurrentVideoIdx] = React.useState(0);
  const vw = (t as { video_watch?: Record<string, string> }).video_watch;

  const title = vw?.intro_title ?? 'Film o salonie Katarzyna Brui – Białystok';
  const description =
    vw?.intro_description ??
    'Profesjonalny salon kosmetyczny w Białymstoku. Makijaż permanentny, stylizacja rzęs, laminacja brwi, peeling węglowy, manicure.';
  const barePath = '/video/salon-intro';
  const embedUrl = `${BASE_URL}${localizedPath(barePath, language)}`;

  React.useEffect(() => {
    prerenderReady();
    fetchIntroVideos();
  }, []);

  const fetchIntroVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('intro_videos')
        .select('video_url')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      if (data && data.length > 0) {
        setIntroVideos(data.map(v => v.video_url));
      } else {
        setIntroVideos([CONTENT_PATH]); // Fallback to main video if DB empty
      }
    } catch (err) {
      console.error('Error fetching intro videos:', err);
      setIntroVideos([CONTENT_PATH]);
    }
  };

  const activeVideo = introVideos[currentVideoIdx] || CONTENT_PATH;
  const isLastVideo = currentVideoIdx === introVideos.length - 1;

  const videoLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: title,
    description,
    thumbnailUrl: THUMBNAIL_URL,
    contentUrl: CONTENT_URL,
    embedUrl,
    uploadDate: '2025-01-01T00:00:00+01:00',
    inLanguage: language,
  };

  const homeName = language === 'en' ? 'Home' : language === 'ru' ? 'Главная' : 'Strona główna';

  return (
    <main className="pt-16 min-h-screen bg-neutral-50">
      <SEO
        title={title}
        description={description}
        canonical={barePath}
        image={THUMBNAIL_URL}
        structuredData={videoLd}
        keywords={
          language === 'en'
            ? ['beauty salon Białystok video', 'Katarzyna Brui salon']
            : language === 'ru'
              ? ['салон красоты Белосток видео', 'Katarzyna Brui']
              : ['salon kosmetyczny Białystok film', 'Katarzyna Brui']
        }
        breadcrumbs={[
          { name: homeName, url: '/' },
          { name: title, url: barePath },
        ]}
      />
      <BreadcrumbSchema
        items={[
          { name: homeName, url: '/' },
          { name: title, url: barePath },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <nav className="mb-8 text-sm text-amber-700">
          <LocalizedLink to="/" className="hover:underline">
            {vw?.back_home ?? '← Strona główna'}
          </LocalizedLink>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-gray-600 mb-8 max-w-2xl">{description}</p>

        <div className="aspect-square w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-lg bg-black">
          <video
            key={activeVideo}
            className="w-full h-full object-cover"
            controls
            playsInline
            preload="metadata"
            poster="/og-image2.jpg"
            onEnded={() => {
              if (!isLastVideo) {
                setCurrentVideoIdx(prev => prev + 1);
              }
            }}
          >
            <source src={activeVideo} type="video/mp4" />
          </video>
        </div>
      </div>
    </main>
  );
};
