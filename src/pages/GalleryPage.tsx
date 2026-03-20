import React, { useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';
import { GalleryImage } from '../types';
import { getGalleryDescription } from '../utils/serviceTranslation';
import { prerenderReady } from '../utils/prerenderReady';

interface GalleryVideoCardProps {
  image: GalleryImage;
  desc: string | undefined;
  onClick: () => void;
}

const GalleryVideoCard: React.FC<GalleryVideoCardProps> = ({ image, desc, onClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isTouchDevice = useRef(typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));

  const playVideo = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = true;
    videoRef.current.play().catch(() => {});
  }, []);

  const pauseVideo = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.pause();
  }, []);

  useEffect(() => {
    if (!isTouchDevice.current) return;
    const el = videoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { entry.isIntersecting ? playVideo() : pauseVideo(); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [playVideo, pauseVideo]);

  return (
    <button
      onClick={onClick}
      className="relative group overflow-hidden rounded-xl shadow-lg aspect-square cursor-pointer"
    >
      <video
        ref={videoRef}
        src={image.video_url!}
        poster={image.url !== image.video_url ? image.url : undefined}
        className="w-full h-full object-cover"
        muted
        loop
        playsInline
        preload="metadata"
        onMouseEnter={isTouchDevice.current ? undefined : playVideo}
        onMouseLeave={isTouchDevice.current ? undefined : pauseVideo}
      />
      {/* Play icon overlay (shown when paused via CSS) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity duration-300">
        <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center">
          <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      {/* Description overlay on hover */}
      {desc && (
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end pointer-events-none">
          <p className="text-white p-4">{desc}</p>
        </div>
      )}
    </button>
  );
};

export const GalleryPage: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [images, setImages] = React.useState<GalleryImage[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [loading, setLoading] = React.useState(true);
  const [lightboxImage, setLightboxImage] = React.useState<GalleryImage | null>(null);

  React.useEffect(() => {
    loadImages();
  }, []);

  // Escape key closes lightbox
  React.useEffect(() => {
    if (!lightboxImage) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxImage]);

  const loadImages = async () => {
    setLoading(true);
    const { data: serviceImages, error } = await supabase
      .from('service_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading gallery:', error);
    }
    if (serviceImages) {
      setImages(serviceImages);
    }
    setLoading(false);
    prerenderReady();
  };

  const categories = ['all', ...new Set(images.map(img => img.category))];

  const getCategoryLabel = (category: string) => {
    if (category === 'all') return t.all;
    const translated = (t.categories as Record<string, string>)[category];
    return translated || category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getDescription = (image: GalleryImage) => {
    return getGalleryDescription(image, language);
  };

  const filteredImages = selectedCategory === 'all'
    ? images
    : images.filter(img => img.category === selectedCategory);

  const gallerySchemaName = language === 'en'
    ? 'Treatment Gallery – Katarzyna Brui Beauty Salon Białystok'
    : language === 'ru'
    ? 'Галерея работ – Салон красоты Катажина Бруй Белосток'
    : 'Galeria prac – Salon Katarzyna Brui Białystok';
  const gallerySchemaDesc = language === 'en'
    ? 'Beauty treatment results: permanent makeup, lash extensions, brow lamination, manicure.'
    : language === 'ru'
    ? 'Результаты косметических процедур: перманентный макияж, наращивание ресниц, ламинирование бровей, маникюр.'
    : 'Efekty zabiegów kosmetycznych: makijaż permanentny brwi i ust, stylizacja rzęs, laminacja brwi, manicure.';

  const gallerySchema = images.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    'name': gallerySchemaName,
    'description': gallerySchemaDesc,
    'url': 'https://katarzynabrui.pl/gallery',
    'image': images.slice(0, 20).map(img => {
      const itemName = getDescription(img) || `${getCategoryLabel(img.category)} – ${language === 'en' ? 'Katarzyna Brui Salon' : language === 'ru' ? 'салон Катажина Бруй' : 'salon Katarzyna Brui Białystok'}`;
      const itemDesc = getDescription(img) || `${getCategoryLabel(img.category)} – ${language === 'en' ? 'treatment results, beauty salon Białystok' : language === 'ru' ? 'результаты процедур, салон красоты Белосток' : 'efekty zabiegów, salon kosmetyczny Białystok'}`;
      if (img.video_url) {
        return {
          '@type': 'VideoObject',
          'name': itemName,
          'description': itemDesc,
          'contentUrl': img.video_url,
          'thumbnailUrl': img.url !== img.video_url ? img.url : img.video_url,
          'uploadDate': img.created_at,
          'publisher': { '@type': 'Organization', 'name': 'Salon Kosmetyczny Katarzyna Brui' },
        };
      }
      return {
        '@type': 'ImageObject',
        'url': img.url,
        'name': itemName,
        'description': itemDesc,
      };
    }),
    'author': {
      '@type': 'BeautySalon',
      'name': 'Salon Kosmetyczny Katarzyna Brui',
    },
  } : undefined;

  return (
    <main className="pt-16 min-h-screen bg-neutral-50">
      <SEO
        title={(t as any).gallery_seo?.title || 'Galeria Prac - Efekty Zabiegów'}
        description={(t as any).gallery_seo?.description || 'Zobacz efekty zabiegów salonu Katarzyna Brui w Białymstoku: makijaż permanentny brwi i ust, stylizacja rzęs, laminacja brwi, manicure.'}
        canonical="/gallery"
        image={images[0]?.url}
        keywords={language === 'en' ? [
          'permanent makeup results',
          'beauty salon gallery Białystok',
          'permanent brow makeup before after',
          'lash extensions results',
          'brow lamination before after',
          'beautician portfolio Białystok',
        ] : language === 'ru' ? [
          'результаты перманентного макияжа',
          'галерея салон красоты Белосток',
          'перманентный макияж бровей до и после',
          'наращивание ресниц результаты',
          'ламинирование бровей до и после',
          'портфолио косметолога Белосток',
        ] : [
          'efekty makijażu permanentnego',
          'galeria salon kosmetyczny Białystok',
          'makijaż permanentny brwi efekty',
          'stylizacja rzęs efekty',
          'laminacja brwi przed i po',
          'portfolio kosmetyczka Białystok',
        ]}
        structuredData={gallerySchema}
        breadcrumbs={[
          { name: language === 'en' ? 'Home' : language === 'ru' ? 'Главная' : 'Strona główna', url: '/' },
          { name: t.gallery || 'Galeria', url: '/gallery' },
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{(t as any).gallery_seo?.h1 || t.gallery}</h1>
        {(t as any).gallery_seo?.intro && (
          <p className="text-gray-600 text-center max-w-3xl mx-auto mb-10">{(t as any).gallery_seo.intro}</p>
        )}

        <div className="flex flex-wrap justify-center mb-8 gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {getCategoryLabel(category)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" role="status" aria-label="Loading" />
          </div>
        ) : filteredImages.length === 0 ? (
          <p className="text-center text-gray-500 py-20">{t.noResults}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredImages.map((image, idx) => {
              const desc = getDescription(image);
              if (image.video_url) {
                return (
                  <GalleryVideoCard
                    key={image.id}
                    image={image}
                    desc={desc}
                    onClick={() => setLightboxImage(image)}
                  />
                );
              }
              return (
                <button
                  key={image.id}
                  onClick={() => setLightboxImage(image)}
                  className="relative group overflow-hidden rounded-xl shadow-lg aspect-square cursor-pointer"
                >
                  <img
                    src={image.url}
                    alt={desc || `${getCategoryLabel(image.category)} – salon Katarzyna Brui Białystok`}
                    title={desc || `${getCategoryLabel(image.category)} – efekty zabiegów`}
                    loading={idx < 6 ? 'eager' : 'lazy'}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    width={600}
                    height={600}
                  />
                  {desc && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                      <p className="text-white p-4">{desc}</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white text-4xl"
            onClick={() => setLightboxImage(null)}
            aria-label="Close"
          >
            &times;
          </button>
          {lightboxImage.video_url ? (
            <video
              src={lightboxImage.video_url}
              controls
              autoPlay
              className="max-w-full max-h-[90vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={lightboxImage.url}
              alt={getDescription(lightboxImage) || `${getCategoryLabel(lightboxImage.category)} – salon Katarzyna Brui Białystok`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </main>
  );
};
