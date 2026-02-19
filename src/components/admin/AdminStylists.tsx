import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { translateFromPolish } from '../../utils/translateService';

interface Stylist {
  id: string;
  name: string;
  role: string;
  role_en?: string;
  role_ru?: string;
  image_url: string;
  specialties: string[];
  specialties_en?: string[];
  specialties_ru?: string[];
  description: string;
  description_en?: string;
  description_ru?: string;
}

export const AdminStylists: React.FC = () => {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [editingStylist, setEditingStylist] = useState<Stylist | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Image upload state
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Translation state
  const [roleEn, setRoleEn] = useState('');
  const [roleRu, setRoleRu] = useState('');
  const [specEn, setSpecEn] = useState('');
  const [specRu, setSpecRu] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descRu, setDescRu] = useState('');
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    loadStylists();
  }, []);

  const loadStylists = async () => {
    const { data, error } = await supabase
      .from('stylists')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading stylists:', error);
      return;
    }

    setStylists(data || []);
  };

  const resetTranslationState = () => {
    setRoleEn(''); setRoleRu('');
    setSpecEn(''); setSpecRu('');
    setDescEn(''); setDescRu('');
  };

  const resetImageState = () => {
    setImageMode('upload');
    setUploadedImageUrl('');
    setImageUrlInput('');
    setUploadError(null);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('Plik musi być mniejszy niż 5MB');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `stylist-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `stylists/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('service-images')
        .upload(filePath, file);

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(filePath);

      setUploadedImageUrl(publicUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Błąd podczas wgrywania zdjęcia');
    } finally {
      setUploading(false);
    }
  };

  const getCurrentImageUrl = (): string => {
    if (imageMode === 'upload' && uploadedImageUrl) return uploadedImageUrl;
    if (imageMode === 'url' && imageUrlInput) return imageUrlInput;
    return editingStylist?.image_url || '';
  };

  const handleAutoTranslateRole = async (polishRole: string) => {
    if (!polishRole.trim() || (roleEn && roleRu)) return;
    setTranslating(true);
    try {
      const { en, ru } = await translateFromPolish(polishRole);
      setRoleEn(prev => prev || en);
      setRoleRu(prev => prev || ru);
    } finally {
      setTranslating(false);
    }
  };

  const handleAutoTranslateSpec = async (polishSpec: string) => {
    if (!polishSpec.trim() || (specEn && specRu)) return;
    setTranslating(true);
    try {
      const { en, ru } = await translateFromPolish(polishSpec);
      setSpecEn(prev => prev || en);
      setSpecRu(prev => prev || ru);
    } finally {
      setTranslating(false);
    }
  };

  const handleAutoTranslateDesc = async (polishDesc: string) => {
    if (!polishDesc.trim() || (descEn && descRu)) return;
    setTranslating(true);
    try {
      const { en, ru } = await translateFromPolish(polishDesc);
      setDescEn(prev => prev || en);
      setDescRu(prev => prev || ru);
    } finally {
      setTranslating(false);
    }
  };

  const handleSave = async (stylist: Stylist) => {
    const { error } = await supabase
      .from('stylists')
      .upsert({
        id: stylist.id,
        name: stylist.name,
        role: stylist.role,
        role_en: roleEn || null,
        role_ru: roleRu || null,
        image_url: stylist.image_url,
        specialties: stylist.specialties,
        specialties_en: specEn ? specEn.split(',').map(s => s.trim()) : null,
        specialties_ru: specRu ? specRu.split(',').map(s => s.trim()) : null,
        description: stylist.description,
        description_en: descEn || null,
        description_ru: descRu || null,
      });

    if (error) {
      console.error('Error saving stylist:', error);
      return;
    }

    loadStylists();
    setIsModalOpen(false);
    setEditingStylist(null);
    resetTranslationState();
    resetImageState();
  };

  const handleEdit = (stylist: Stylist) => {
    setEditingStylist(stylist);
    setRoleEn(stylist.role_en || '');
    setRoleRu(stylist.role_ru || '');
    setSpecEn(stylist.specialties_en?.join(', ') || '');
    setSpecRu(stylist.specialties_ru?.join(', ') || '');
    setDescEn(stylist.description_en || '');
    setDescRu(stylist.description_ru || '');
    setImageMode('upload');
    setUploadedImageUrl('');
    setImageUrlInput(stylist.image_url || '');
    setUploadError(null);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Zarządzanie stylistami</h3>
        <button
          onClick={() => {
            setEditingStylist(null);
            resetTranslationState();
            resetImageState();
            setIsModalOpen(true);
          }}
          className="bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600"
        >
          Dodaj stylistę
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {stylists.map((stylist) => (
          <div
            key={stylist.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div className="relative h-48">
              <img
                src={stylist.image_url}
                alt={stylist.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold">{stylist.name}</h3>
              <p className="text-amber-600">{stylist.role}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {stylist.specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-sm"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-gray-600">{stylist.description}</p>
              <button
                onClick={() => handleEdit(stylist)}
                className="mt-4 text-amber-600 hover:text-amber-700"
              >
                Edytuj
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingStylist ? 'Edytuj stylistę' : 'Dodaj stylistę'}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const imageUrl = getCurrentImageUrl();
                if (!imageUrl) {
                  setUploadError('Dodaj zdjęcie lub podaj URL');
                  return;
                }
                const stylist = {
                  id: editingStylist?.id || crypto.randomUUID(),
                  name: formData.get('name') as string,
                  role: formData.get('role') as string,
                  image_url: imageUrl,
                  specialties: (formData.get('specialties') as string).split(',').map(s => s.trim()),
                  description: formData.get('description') as string
                };
                handleSave(stylist);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Imię i nazwisko
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingStylist?.name}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Role PL */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Stanowisko (polski)
                </label>
                <input
                  type="text"
                  name="role"
                  defaultValue={editingStylist?.role}
                  onBlur={(e) => handleAutoTranslateRole(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Stanowisko (angielski)
                  {translating && <span className="ml-2 text-xs text-amber-500 animate-pulse">tłumaczenie...</span>}
                </label>
                <input
                  type="text"
                  value={roleEn}
                  onChange={(e) => setRoleEn(e.target.value)}
                  placeholder="English role (auto-translated)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Stanowisko (rosyjski)
                  {translating && <span className="ml-2 text-xs text-amber-500 animate-pulse">tłumaczenie...</span>}
                </label>
                <input
                  type="text"
                  value={roleRu}
                  onChange={(e) => setRoleRu(e.target.value)}
                  placeholder="Должность (авто-перевод)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              {/* Image section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zdjęcie stylisty
                </label>

                {/* Preview */}
                {getCurrentImageUrl() && (
                  <div className="mb-3">
                    <img
                      src={getCurrentImageUrl()}
                      alt="Podgląd"
                      className="w-24 h-24 rounded-full object-cover border-2 border-amber-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Mode toggle */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      imageMode === 'upload'
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Wgraj zdjęcie
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      imageMode === 'url'
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Podaj URL
                  </button>
                </div>

                {imageMode === 'upload' ? (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-amber-50 file:text-amber-700
                        hover:file:bg-amber-100"
                    />
                    {uploading && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-amber-600">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Wgrywanie...
                      </div>
                    )}
                    {uploadedImageUrl && !uploading && (
                      <p className="mt-1 text-xs text-green-600">Zdjęcie wgrane pomyślnie</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">Maks. 5MB, JPG/PNG/WebP</p>
                  </div>
                ) : (
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  />
                )}

                {uploadError && (
                  <p className="mt-1 text-sm text-red-600">{uploadError}</p>
                )}
              </div>

              {/* Specialties PL */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Specjalizacje (polski, oddzielone przecinkami)
                </label>
                <input
                  type="text"
                  name="specialties"
                  defaultValue={editingStylist?.specialties.join(', ')}
                  onBlur={(e) => handleAutoTranslateSpec(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Specjalizacje (angielski)
                  {translating && <span className="ml-2 text-xs text-amber-500 animate-pulse">tłumaczenie...</span>}
                </label>
                <input
                  type="text"
                  value={specEn}
                  onChange={(e) => setSpecEn(e.target.value)}
                  placeholder="English specialties, comma-separated"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Specjalizacje (rosyjski)
                  {translating && <span className="ml-2 text-xs text-amber-500 animate-pulse">tłumaczenie...</span>}
                </label>
                <input
                  type="text"
                  value={specRu}
                  onChange={(e) => setSpecRu(e.target.value)}
                  placeholder="Специализации (авто-перевод)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              {/* Description PL */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Opis (polski)
                </label>
                <textarea
                  name="description"
                  defaultValue={editingStylist?.description}
                  onBlur={(e) => handleAutoTranslateDesc(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Opis (angielski)
                  {translating && <span className="ml-2 text-xs text-amber-500 animate-pulse">tłumaczenie...</span>}
                </label>
                <textarea
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  placeholder="English description (auto-translated)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Opis (rosyjski)
                  {translating && <span className="ml-2 text-xs text-amber-500 animate-pulse">tłumaczenie...</span>}
                </label>
                <textarea
                  value={descRu}
                  onChange={(e) => setDescRu(e.target.value)}
                  placeholder="Описание на русском (авто-перевод)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetImageState(); }}
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
