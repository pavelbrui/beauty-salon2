import React, { useState, useEffect, useMemo } from 'react';
import { Service } from '../../types';
import { supabase } from '../../lib/supabase';
import { translateFromPolish } from '../../utils/translateService';
import { StylistFilter } from '../StylistFilter';
import { uploadPublicImage } from '../../utils/uploadPublicImage';
import { withTimeout } from '../../utils/withTimeout';


interface Stylist {
  id: string;
  name: string;
  image_url?: string;
  role?: string;
}

interface StylistAssignment {
  service_id: string;
  stylist_id: string;
}

interface ServiceImage {
  id: string;
  url: string;
  alt_text?: string;
}

export const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [assignments, setAssignments] = useState<StylistAssignment[]>([]);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStylists, setSelectedStylists] = useState<string[]>([]);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [nameEn, setNameEn] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descRu, setDescRu] = useState('');
  const [translatingCount, setTranslatingCount] = useState(0);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [editImages, setEditImages] = useState<ServiceImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // Original stylists at modal open — for diff-based save
  const [originalStylists, setOriginalStylists] = useState<string[]>([]);

  // Filters
  const [filterStylist, setFilterStylist] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadServices();
    loadStylists();
    loadAssignments();
  }, []);

  const loadStylists = async () => {
    const { data } = await supabase
      .from('stylists')
      .select('id, name, image_url, role')
      .order('name');

    if (data) {
      setStylists(data);
    }
  };

  const loadAssignments = async () => {
    const { data } = await supabase
      .from('stylist_service_assignments')
      .select('service_id, stylist_id');

    if (data) {
      setAssignments(data);
    }
  };

  const loadSelectedStylists = async (serviceId: string) => {
    const { data } = await supabase
      .from('stylist_service_assignments')
      .select('stylist_id')
      .eq('service_id', serviceId);

    const ids = data ? data.map(assignment => assignment.stylist_id) : [];
    setSelectedStylists(ids);
    setOriginalStylists(ids);
  };
  const loadServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*, service_images(id, url, alt_text)')
      .order('category');
    
    if (error) {
      console.error('Error loading services:', error);
      return;
    }
    
    setServices(data);
  };

  const loadEditImages = async (serviceId: string) => {
    const { data } = await supabase
      .from('service_images')
      .select('id, url, alt_text')
      .eq('service_id', serviceId);
    setEditImages(data || []);
  };

  const handleImageUploadInModal = async (event: React.ChangeEvent<HTMLInputElement>, serviceId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      setImageUploadError('Plik musi być mniejszy niż 15MB');
      return;
    }

    setUploadingImage(true);
    setImageUploadError(null);

    try {
      const { publicUrl } = await uploadPublicImage({ file, folder: 'service-images', timeoutMs: 20000 });

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

      await loadEditImages(serviceId);
    } catch (err) {
      setImageUploadError(err instanceof Error ? err.message : 'Błąd podczas wgrywania zdjęcia');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleDeleteImage = async (imageId: string, serviceId: string) => {
    const { error } = await supabase
      .from('service_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      setImageUploadError('Błąd podczas usuwania zdjęcia');
      return;
    }

    await loadEditImages(serviceId);
  };

  const handleAutoTranslateName = async (polishName: string) => {
    if (!polishName.trim()) return;
    if (nameEn && nameRu) return;
    setTranslatingCount(c => c + 1);
    try {
      const { en, ru } = await translateFromPolish(polishName);
      setNameEn(prev => prev || en);
      setNameRu(prev => prev || ru);
    } finally {
      setTranslatingCount(c => c - 1);
    }
  };

  const handleAutoTranslateDesc = async (polishDesc: string) => {
    if (!polishDesc.trim()) return;
    if (descEn && descRu) return;
    setTranslatingCount(c => c + 1);
    try {
      const { en, ru } = await translateFromPolish(polishDesc);
      setDescEn(prev => prev || en);
      setDescRu(prev => prev || ru);
    } finally {
      setTranslatingCount(c => c - 1);
    }
  };

  const handleSave = async (service: Service) => {
    setSaving(true);
    setSaveError(null);

    try {
      const { error } = await supabase
        .from('services')
        .upsert({
          id: service.id,
          name: service.name,
          name_en: nameEn || null,
          name_ru: nameRu || null,
          category: service.category,
          price: service.price,
          duration: service.duration,
          description: service.description,
          description_en: descEn || null,
          description_ru: descRu || null,
        });

      if (error) {
        setSaveError(`Błąd zapisu usługi: ${error.message}`);
        return;
      }

      const serviceId = service.id;

      // Diff-based assignment update — safer than delete-all + insert
      const toAdd = selectedStylists.filter(id => !originalStylists.includes(id));
      const toRemove = originalStylists.filter(id => !selectedStylists.includes(id));

      // Insert new assignments first (safer — duplicates are better than lost data)
      if (toAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('stylist_service_assignments')
          .insert(toAdd.map(stylistId => ({ service_id: serviceId, stylist_id: stylistId })));

        if (insertError) {
          setSaveError(`Błąd dodawania przypisań: ${insertError.message}`);
          return;
        }
      }

      // Then remove old ones
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('stylist_service_assignments')
          .delete()
          .eq('service_id', serviceId)
          .in('stylist_id', toRemove);

        if (deleteError) {
          setSaveError(`Błąd usuwania przypisań: ${deleteError.message}`);
          return;
        }
      }

      await loadServices();
      await loadAssignments();
      setIsModalOpen(false);
      setEditingService(null);
      setSelectedStylists([]);
      setOriginalStylists([]);
      setNameEn(''); setNameRu('');
      setDescEn(''); setDescRu('');
      setEditImages([]);
      setImageUploadError(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Nieznany błąd');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (service: Service) => {
    setEditingService(service);
    setNameEn(service.name_en || '');
    setNameRu(service.name_ru || '');
    setDescEn(service.description_en || '');
    setDescRu(service.description_ru || '');
    setSaveError(null);
    setImageUploadError(null);
    setSelectedStylists([]);
    setOriginalStylists([]);
    setEditImages([]);
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      await Promise.all([
        loadSelectedStylists(service.id),
        loadEditImages(service.id),
      ]);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (service: Service) => {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', service.id);

    if (error) {
      console.error('Error deleting service:', error);
      return;
    }

    await loadServices();
    setDeletingService(null);
  };

  const categories = useMemo(() => [...new Set(services.map(s => s.category))], [services]);

  const filteredServices = useMemo(() => {
    let result = services;
    if (filterCategory !== 'all') {
      result = result.filter(s => s.category === filterCategory);
    }
    if (filterStylist !== 'all') {
      const stylistServiceIds = assignments
        .filter(a => a.stylist_id === filterStylist)
        .map(a => a.service_id);
      result = result.filter(s => stylistServiceIds.includes(s.id));
    }
    return result;
  }, [services, filterCategory, filterStylist, assignments]);

  const hasActiveFilters = filterStylist !== 'all' || filterCategory !== 'all';

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Zarządzanie usługami</h3>
        <button
          onClick={() => {
            setEditingService(null);
            setSelectedStylists([]);
            setOriginalStylists([]);
            setNameEn(''); setNameRu('');
            setDescEn(''); setDescRu('');
            setSaveError(null);
            setEditImages([]);
            setImageUploadError(null);
            setModalLoading(false);
            setIsModalOpen(true);
          }}
          className="bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600"
        >
          Dodaj usługę
        </button>
      </div>

      {/* Filters */}
      <div className="px-4 pb-4 sm:px-6 space-y-4 border-b border-gray-200">
        {/* Stylist filter with photos */}
        <div>
          <span className="text-sm font-medium text-gray-600 mb-2 block">Stylistka</span>
          <StylistFilter
            stylists={stylists}
            selectedId={filterStylist === 'all' ? '' : filterStylist}
            onSelect={(id) => setFilterStylist(id || 'all')}
            allLabel="Wszystkie"
          />
        </div>

        {/* Category filter + clear */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="all">Wszystkie kategorie</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <span className="text-sm text-gray-500">
            ({filteredServices.length}{services.length !== filteredServices.length ? ` / ${services.length}` : ''})
          </span>

          {hasActiveFilters && (
            <button
              onClick={() => { setFilterStylist('all'); setFilterCategory('all'); }}
              className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Wyczyść filtry
            </button>
          )}
        </div>
      </div>

      <ul className="divide-y divide-gray-200">
        {filteredServices.map((service) => {
          const images = (service as any).service_images as ServiceImage[] | undefined;
          return (
            <li key={service.id} className="px-4 sm:px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  {images && images.length > 0 && (
                    <img
                      src={images[0].url}
                      alt={service.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-500">{service.category}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{service.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:block sm:text-right flex-shrink-0">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {(service.price / 100).toFixed(2)} zł
                    </p>
                    <p className="text-sm text-gray-500">
                      {service.duration} min
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:mt-2 sm:justify-end">
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-amber-600 hover:text-amber-700"
                    >
                      Edytuj
                    </button>
                    <button
                      onClick={() => setDeletingService(service)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingService ? 'Edytuj usługę' : 'Dodaj usługę'}
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
                const priceVal = formData.get('price') as string;
                const service = {
                  id: editingService?.id || crypto.randomUUID(),
                  name: formData.get('name') as string,
                  category: formData.get('category') as string,
                  price: Math.round(parseFloat(priceVal) * 100),
                  duration: parseInt(formData.get('duration') as string),
                  description: formData.get('description') as string
                };
                handleSave(service);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Przypisz do stylistek
                </label>
                <div className="mt-2 space-y-2">
                  {stylists.map(stylist => (
                    <label key={stylist.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedStylists.includes(stylist.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStylists(prev => [...prev, stylist.id]);
                          } else {
                            setSelectedStylists(prev => 
                              prev.filter(id => id !== stylist.id)
                            );
                          }
                        }}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-600">
                        {stylist.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nazwa (polski)
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingService?.name}
                  onBlur={(e) => handleAutoTranslateName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nazwa (angielski)
                  {translatingCount > 0 && <span className="ml-2 text-xs text-amber-500 animate-pulse">tłumaczenie...</span>}
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="English name (auto-translated)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nazwa (rosyjski)
                  {translatingCount > 0 && <span className="ml-2 text-xs text-amber-500 animate-pulse">tłumaczenie...</span>}
                </label>
                <input
                  type="text"
                  value={nameRu}
                  onChange={(e) => setNameRu(e.target.value)}
                  placeholder="Русское название (авто-перевод)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Kategoria
                </label>
                <input
                  type="text"
                  name="category"
                  defaultValue={editingService?.category}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cena (zł)
                </label>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  defaultValue={editingService ? (editingService.price / 100).toFixed(2) : ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Czas trwania (min)
                </label>
                <input
                  type="number"
                  name="duration"
                  defaultValue={editingService?.duration}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Opis (polski)
                </label>
                <textarea
                  name="description"
                  defaultValue={editingService?.description}
                  onBlur={(e) => handleAutoTranslateDesc(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  rows={3}
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

              {/* Image section */}
              {editingService && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zdjęcia usługi
                  </label>
                  {editImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {editImages.map(img => (
                        <div key={img.id} className="relative group">
                          <img
                            src={img.url}
                            alt={img.alt_text || ''}
                            className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img.id, editingService.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUploadInModal(e, editingService.id)}
                    disabled={uploadingImage}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-amber-50 file:text-amber-700
                      hover:file:bg-amber-100"
                  />
                  {uploadingImage && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-amber-600">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Wgrywanie...
                    </div>
                  )}
                  {imageUploadError && (
                    <p className="mt-1 text-sm text-red-600">{imageUploadError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">Maks. 15MB — duże zdjęcia zostaną automatycznie skompresowane</p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSaveError(null);
                    setEditImages([]);
                    setImageUploadError(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  disabled={saving}
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage || modalLoading}
                  className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(saving || modalLoading) && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {modalLoading ? 'Ładowanie...' : saving ? 'Zapisywanie...' : 'Zapisz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {deletingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Potwierdź usunięcie</h2>
            <p className="text-gray-600 mb-6">
              Czy na pewno chcesz usunąć usługę "{deletingService.name}"? 
              Tej operacji nie można cofnąć.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeletingService(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Anuluj
              </button>
              <button
                onClick={() => handleDelete(deletingService)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Usuń
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};