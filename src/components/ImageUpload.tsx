import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { uploadPublicImage } from '../utils/uploadPublicImage';
import { withTimeout } from '../utils/withTimeout';

interface ImageUploadProps {
  serviceId: string;
  onUploadComplete: () => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ serviceId, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);

      const file = event.target.files?.[0];
      if (!file) return;

      const { publicUrl } = await uploadPublicImage({ file, folder: 'service-images', timeoutMs: 20000 });

      // Save to service_images table
      const { error: dbError } = await withTimeout(
        supabase.from('service_images').insert({
          service_id: serviceId,
          url: publicUrl,
          alt_text: file.name,
        }),
        20000,
        'Zapis zdjęcia w bazie trwa zbyt długo'
      );

      if (dbError) throw dbError;

      onUploadComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading image');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700">
        Dodaj zdjęcie
      </label>
      <div className="mt-1 flex items-center">
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/heic,image/heif,image/tiff,image/bmp,.jpg,.jpeg,.png,.gif,.webp,.svg,.heic,.heif,.tiff,.tif,.bmp"
          onChange={handleUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100"
        />
        {uploading && (
          <div className="ml-4">
            <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};