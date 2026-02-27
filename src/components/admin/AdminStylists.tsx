import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { translateFromPolish } from '../../utils/translateService';
import { uploadPublicImage } from '../../utils/uploadPublicImage';
import { withTimeout } from '../../utils/withTimeout';

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
  min_advance_hours?: number;
  night_start_hour?: number;
  night_end_hour?: number;
  night_min_slot_hour?: number;
}

export const AdminStylists: React.FC = () => {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [editingStylist, setEditingStylist] = useState<Stylist | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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
  const [translatingCount, setTranslatingCount] = useState(0);

  // Booking restrictions state
  const [minAdvanceHours, setMinAdvanceHours] = useState(3);
  const [nightStartHour, setNightStartHour] = useState(22);
  const [nightEndHour, setNightEndHour] = useState(6);
  const [nightMinSlotHour, setNightMinSlotHour] = useState(10);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    loadStylists();
  }, []);

  const loadStylists = async (): Promise<boolean> => {
    setLoadError(null);
    const { data, error } = await withTimeout(
      supabase.from('stylists').select('*').order('name'),
      20000,
      'Ładowanie stylistek trwa zbyt długo'
    );

    if (error) {
      console.error('Error loading stylists:', error);
      setLoadError(`Nie udało się załadować stylistek: ${error.message}`);
      return false;
    }

    setStylists(data || []);
    return true;
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

    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('Plik musi być mniejszy niż 15MB');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const { publicUrl } = await uploadPublicImage({ file, folder: 'stylists', timeoutMs: 20000 });
      setUploadedImageUrl(publicUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Błąd podczas wgrywania zdjęcia');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const getCurrentImageUrl = (): string => {
    if (imageMode === 'upload' && uploadedImageUrl) return uploadedImageUrl;
    if (imageMode === 'url' && imageUrlInput) return imageUrlInput;
    return editingStylist?.image_url || '';
  };

  const handleAutoTranslateRole = async (polishRole: string) => {
    if (!polishRole.trim() || (roleEn && roleRu)) return;
    setTranslatingCount(c => c + 1);
    try {
      const { en, ru } = await translateFromPolish(polishRole);
      setRoleEn(prev => prev || en);
      setRoleRu(prev => prev || ru);
    } finally {
      setTranslatingCount(c => c - 1);
    }
  };

  const handleAutoTranslateSpec = async (polishSpec: string) => {
    if (!polishSpec.trim() || (specEn && specRu)) return;
    setTranslatingCount(c => c + 1);
    try {
      const { en, ru } = await translateFromPolish(polishSpec);
      setSpecEn(prev => prev || en);
      setSpecRu(prev => prev || ru);
    } finally {
      setTranslatingCount(c => c - 1);
    }
  };

  const handleAutoTranslateDesc = async (polishDesc: string) => {
    if (!polishDesc.trim() || (descEn && descRu)) return;
    setTranslatingCount(c => c + 1);
    try {
      const { en, ru } = await translateFromPolish(polishDesc);
      setDescEn(prev => prev || en);
      setDescRu(prev => prev || ru);
    } finally {
      setTranslatingCount(c => c - 1);
    }
  };

  const handleSave = async (stylist: Stylist) => {
    setSaving(true);
    setSaveError(null);

    try {
      const cleanSpecialties = (stylist.specialties || []).map(s => s.trim()).filter(Boolean);
      const cleanSpecialtiesEn = specEn ? specEn.split(',').map(s => s.trim()).filter(Boolean) : null;
      const cleanSpecialtiesRu = specRu ? specRu.split(',').map(s => s.trim()).filter(Boolean) : null;

      const { error } = await withTimeout(
        supabase.from('stylists').upsert({
          id: stylist.id,
          name: stylist.name,
          role: stylist.role,
          role_en: roleEn || null,
          role_ru: roleRu || null,
          image_url: stylist.image_url,
          specialties: cleanSpecialties,
          specialties_en: cleanSpecialtiesEn,
          specialties_ru: cleanSpecialtiesRu,
          description: stylist.description,
          description_en: descEn || null,
          description_ru: descRu || null,
          min_advance_hours: minAdvanceHours,
          night_start_hour: nightStartHour,
          night_end_hour: nightEndHour,
          night_min_slot_hour: nightMinSlotHour,
        }),
        20000,
        'Zapis trwa zbyt długo'
      );

      if (error) {
        setSaveError(`Błąd zapisu stylisty: ${error.message}`);
        return;
      }

      const ok = await loadStylists();
      if (!ok) {
        setSaveError('Zapisano, ale nie udało się odświeżyć listy. Odśwież stronę.');
        return;
      }
      setIsModalOpen(false);
      setEditingStylist(null);
      resetTranslationState();
      resetImageState();
      setSaveError(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Nieznany błąd');
    } finally {
      setSaving(false);
    }
  };

  const resetRestrictions = () => {
    setMinAdvanceHours(3);
    setNightStartHour(22);
    setNightEndHour(6);
    setNightMinSlotHour(10);
  };

  const handleEdit = (stylist: Stylist) => {
    setEditingStylist(stylist);
    setRoleEn(stylist.role_en || '');
    setRoleRu(stylist.role_ru || '');
    setSpecEn(stylist.specialties_en?.join(', ') || '');
    setSpecRu(stylist.specialties_ru?.join(', ') || '');
    setDescEn(stylist.description_en || '');
    setDescRu(stylist.description_ru || '');
    setMinAdvanceHours(stylist.min_advance_hours ?? 3);
    setNightStartHour(stylist.night_start_hour ?? 22);
    setNightEndHour(stylist.night_end_hour ?? 6);
    setNightMinSlotHour(stylist.night_min_slot_hour ?? 10);
    setImageMode('upload');
    setUploadedImageUrl('');
    setImageUrlInput(stylist.image_url || '');
    setUploadError(null);
    setSaveError(null);
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
            resetRestrictions();
            setSaveError(null);
            setIsModalOpen(true);
          }}
          className="bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600"
        >
          Dodaj stylistę
        </button>
      </div>

      {loadError && (
        <div className="px-6 pb-2">
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{loadError}</p>
          </div>
        </div>
      )}

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

            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{saveError}</p>
              </div>
            )}

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
                  {translatingCount > 0 && <span className="ml-2 text-xs text-amber-500 animate-pulse">tłumaczenie...</span>}
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
                  {translatingCount > 0 && <span className="ml-2 text-xs text-amber-500 animate-pulse">tłumaczenie...</span>}
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
                    <p className="mt-1 text-xs text-gray-400">Maks. 15MB — duże zdjęcia zostaną automatycznie skompresowane</p>
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
                  {translatingCount > 0 && <span className="ml-2 text-xs text-amber-500 animate-pulse">tłumaczenie...</span>}
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
                  {translatingCount > 0 && <span className="ml-2 text-xs text-amber-500 animate-pulse">tłumaczenie...</span>}
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
                  {translatingCount > 0 && <span className="ml-2 text-xs text-amber-500 animate-pulse">tłumaczenie...</span>}
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
                  {translatingCount > 0 && <span className="ml-2 text-xs text-amber-500 animate-pulse">tłumaczenie...</span>}
                </label>
                <textarea
                  value={descRu}
                  onChange={(e) => setDescRu(e.target.value)}
                  placeholder="Описание на русском (авто-перевод)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  rows={2}
                />
              </div>

              {/* Booking restrictions */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Ograniczenia rezerwacji</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600">
                      Min. wyprzedzenie (godz.)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={72}
                      value={minAdvanceHours}
                      onChange={(e) => setMinAdvanceHours(Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">
                      Min. godzina w nocy
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={nightMinSlotHour}
                      onChange={(e) => setNightMinSlotHour(Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">
                      Noc od godz.
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={nightStartHour}
                      onChange={(e) => setNightStartHour(Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">
                      Noc do godz.
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={nightEndHour}
                      onChange={(e) => setNightEndHour(Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  W nocy ({nightStartHour}:00–{nightEndHour}:00) rezerwacje na terminy przed {nightMinSlotHour}:00 nie będą dostępne.
                  Rezerwacje mniej niż {minAdvanceHours}h przed terminem nie będą dostępne.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetImageState(); setSaveError(null); }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  disabled={saving}
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {saving ? 'Zapisywanie...' : 'Zapisz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
