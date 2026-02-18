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

  React.useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    const { data: serviceImages } = await supabase
      .from('service_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (serviceImages) {
      setImages(serviceImages);
    }
  };

  const categories = ['all', ...new Set(images.map(img => img.category))];

  const filteredImages = selectedCategory === 'all'
    ? images
    : images.filter(img => img.category === selectedCategory);

  return (
    <div className="pt-16 min-h-screen bg-neutral-50">
      <SEO
        title="Galeria"
        description="Galeria realizacji salonu Katarzyna Brui: makijaż permanentny brwi i ust, stylizacja rzęs, laminacja brwi. Zobacz efekty naszej pracy!"
        canonical="/gallery"
      />
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.gallery}</h1>

        <div className="flex justify-center mb-8 space-x-4">
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
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="relative group overflow-hidden rounded-xl shadow-lg aspect-square"
            >
              <img
                src={image.url}
                alt={image.description || ''}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
              />
              {image.description && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <p className="text-white p-4">{image.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};