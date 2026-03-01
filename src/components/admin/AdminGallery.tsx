import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { uploadPublicImage } from '../../utils/uploadPublicImage';
import { withTimeout } from '../../utils/withTimeout';
import { translateFromPolish } from '../../utils/translateService';
import { GalleryImage } from '../../types';

export const AdminGallery: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Controlled form state for editing
  const [editDesc, setEditDesc] = useState('');
  const [editDescEn, setEditDescEn] = useState('');
  const [editDescRu, setEditDescRu] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [translatingCount, setTranslatingCount] = useState(0);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setError(null);
    const { data, error } = await withTimeout(
      supabase.from('service_images').select('*').order('created_at', { ascending: false }),
      20000,
      'Ładowanie galerii trwa zbyt długo'
    );

    if (error) {
      console.error('Error loading gallery images:', error);
      setError(`Nie udało się załadować galerii: ${error.message}`);
      return;
    }

    setImages(data || []);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);
      const file = event.target.files?.[0];
      if (!file) return;

      const maxSize = 15 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('Plik musi być mniejszy niż 15MB');
        return;
      }

      const { publicUrl } = await uploadPublicImage({ file, folder: 'gallery', timeoutMs: 20000 });

      // Save to service_images table
      const { error: dbError } = await withTimeout(
        supabase.from('service_images').insert({
          url: publicUrl,
          description: '',
          category: 'general',
        }),
        20000,
        'Zapis zdjęcia w bazie trwa zbyt długo'
      );

      if (dbError) throw dbError;

      loadImages();
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error instanceof Error ? error.message : 'Błąd podczas dodawania zdjęcia');
      alert('Błąd podczas dodawania zdjęcia. Spróbuj ponownie.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleEdit = (image: GalleryImage) => {
    setSelectedImage(image);
    setEditDesc(image.description || '');
    setEditDescEn(image.description_en || '');
    setEditDescRu(image.description_ru || '');
    setEditCategory(image.category || 'general');
    setTranslatingCount(0);
    setIsModalOpen(true);
  };

  const handleAutoTranslateDesc = async (polishDesc: string) => {
    if (!polishDesc.trim()) return;
    if (editDescEn && editDescRu) return;
    setTranslatingCount(c => c + 1);
    try {
      const { en, ru } = await translateFromPolish(polishDesc);
      setEditDescEn(prev => prev || en);
      setEditDescRu(prev => prev || ru);
    } finally {
      setTranslatingCount(c => c - 1);
    }
  };

  const handleSave = async () => {
    if (!selectedImage) return;

    const { error } = await supabase
      .from('service_images')
      .update({
        description: editDesc,
        description_en: editDescEn || null,
        description_ru: editDescRu || null,
        category: editCategory,
      })
      .eq('id', selectedImage.id);

    if (!error) {
      loadImages();
      setIsModalOpen(false);
      setSelectedImage(null);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('service_images')
      .delete()
      .eq('id', id);

    if (!error) {
      loadImages();
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Zarządzanie galerią</h3>
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={`inline-block bg-amber-500 text-white px-4 py-2 rounded-md transition-colors ${
              uploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'hover:bg-amber-600 cursor-pointer'
            }`}
          >
            {uploading ? 'Dodawanie...' : 'Dodaj zdjęcie'}
          </label>
        </div>
      </div>

      {error && (
        <div className="px-4 pb-4 sm:px-6">
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {images.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Brak zdjęć w galerii. Dodaj pierwsze zdjęcie klikając przycisk powyżej.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <img
                src={image.url}
                alt={image.description}
                className="w-full h-64 object-cover rounded-lg shadow-md"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center space-x-4">
                <button
                  onClick={() => handleEdit(image)}
                  className="bg-white text-gray-800 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Edytuj
                </button>
                <button
                  onClick={() => handleDelete(image.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                >
                  Usuń
                </button>
              </div>
              {image.description && (
                <p className="mt-2 text-sm text-gray-600 truncate px-2">{image.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Edytuj zdjęcie</h2>
            <div className="space-y-4">
              {/* Description - Polish (primary) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Opis (polski)
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  onBlur={(e) => handleAutoTranslateDesc(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  rows={3}
                  placeholder="Opis zdjęcia po polsku"
                />
              </div>

              {/* Description - English */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Opis (angielski)
                  {translatingCount > 0 && <span className="ml-2 text-xs text-amber-500 animate-pulse">tłumaczenie...</span>}
                </label>
                <textarea
                  value={editDescEn}
                  onChange={(e) => setEditDescEn(e.target.value)}
                  placeholder="English description (auto-translated)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  rows={3}
                />
              </div>

              {/* Description - Russian */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Opis (rosyjski)
                  {translatingCount > 0 && <span className="ml-2 text-xs text-amber-500 animate-pulse">tłumaczenie...</span>}
                </label>
                <textarea
                  value={editDescRu}
                  onChange={(e) => setEditDescRu(e.target.value)}
                  placeholder="Описание на русском (авто-перевод)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  rows={3}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kategoria
                </label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedImage(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={translatingCount > 0}
                  className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {translatingCount > 0 ? 'Tłumaczenie...' : 'Zapisz'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
