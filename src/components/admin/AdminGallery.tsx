import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface GalleryImage {
  id: string;
  url: string;
  description: string;
  category: string;
  created_at: string;
}

export const AdminGallery: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    const { data, error } = await supabase
      .from('service_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setImages(data);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('service-images')
        .getPublicUrl(filePath);

      if (!urlData) throw new Error('Failed to get public URL');

      // Save to service_images table
      const { error: dbError } = await supabase
        .from('service_images')
        .insert({
          url: urlData.publicUrl,
          description: '',
          category: 'general'
        });

      if (dbError) throw dbError;

      loadImages();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (image: GalleryImage) => {
    const { error } = await supabase
      .from('service_images')
      .update({
        description: image.description,
        category: image.category
      })
      .eq('id', image.id);

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
                  onClick={() => {
                    setSelectedImage(image);
                    setIsModalOpen(true);
                  }}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Edytuj zdjęcie</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSave({
                  ...selectedImage,
                  description: formData.get('description') as string,
                  category: formData.get('category') as string
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Opis
                </label>
                <textarea
                  name="description"
                  defaultValue={selectedImage.description}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kategoria
                </label>
                <input
                  type="text"
                  name="category"
                  defaultValue={selectedImage.category}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600"
                >
                  Zapisz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};