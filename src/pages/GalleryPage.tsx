import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';

interface GalleryImage {
  id: string;
  url: string;
  category: string;
  description?: string;
}

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
  };

  const categories = ['all', ...new Set(images.map(img => img.category))];

  const getCategoryLabel = (category: string) => {
    if (category === 'all') return t.all;
    const translated = (t.categories as Record<string, string>)[category];
    return translated || category.charAt(0).toUpperCase() + category.slice(1);
  };

  const filteredImages = selectedCategory === 'all'
    ? images
    : images.filter(img => img.category === selectedCategory);

  return (
    <main className="pt-16 min-h-screen bg-neutral-50">
      <SEO
        title="Galeria"
        description="Galeria realizacji salonu Katarzyna Brui: makijaż permanentny brwi i ust, stylizacja rzęs, laminacja brwi. Zobacz efekty naszej pracy!"
        canonical="/gallery"
      />
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.gallery}</h1>

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
            {filteredImages.map((image) => (
              <button
                key={image.id}
                onClick={() => setLightboxImage(image)}
                className="relative group overflow-hidden rounded-xl shadow-lg aspect-square cursor-pointer"
              >
                <img
                  src={image.url}
                  alt={image.description || image.category}
                  loading="lazy"
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                {image.description && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <p className="text-white p-4">{image.description}</p>
                  </div>
                )}
              </button>
            ))}
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
          <img
            src={lightboxImage.url}
            alt={lightboxImage.description || lightboxImage.category}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
};
