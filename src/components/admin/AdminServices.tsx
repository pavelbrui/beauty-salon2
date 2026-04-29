import React, { useState, useEffect, useMemo } from 'react';
import { Service } from '../../types';
import { supabase } from '../../lib/supabase';
import { translateFromPolish } from '../../utils/translateService';
import { StylistFilter } from '../StylistFilter';
import { uploadPublicImage } from '../../utils/uploadPublicImage';
import { uploadVideo } from '../../utils/uploadVideo';
import { withTimeout } from '../../utils/withTimeout';
import { serviceImages } from '../../assets/images';
import { ImageCropper } from './ImageCropper';


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
  video_url?: string | null;
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
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // Image cropping state
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [cropperFileName, setCropperFileName] = useState('');
  const [cropperServiceId, setCropperServiceId] = useState('');

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

  const getStaticImageForCategory = (category: string) => {
    switch ((category || '').toLowerCase()) {
      case 'pielęgnacja brwi':
        return serviceImages.browCare;
      case 'makijaż permanentny':
        return serviceImages.permanentMakeup;
      case 'rzęsy':
      case 'stylizacja rzęs':
        return serviceImages.lashes;
      case 'laserowe usuwanie':
        return serviceImages.tattooRemoval;
      case 'manicure':
        return serviceImages.manicure;
      case 'peeling węglowy':
        return serviceImages.carbonPeeling;
      default:
        return serviceImages.browCare;
    }
  };

  const loadServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*, service_images(id, url, alt_text, video_url)')
      .order('category');
    
    if (error) {
      console.error('Error loading services:', error);
      return;
    }

    const servicesWithImages = (data || []).map((service: any) => ({
      ...service,
      imageUrl: service.service_images?.[0]?.url || getStaticImageForCategory(service.category),
    }));

    setServices(servicesWithImages);
  };

  const loadEditImages = async (serviceId: string) => {
    const { data } = await supabase
      .from('service_images')
      .select('id, url, alt_text, video_url')
      .eq('service_id', serviceId);
    setEditImages(data || []);
  };

  // Phase 1: File selection -> open cropper
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, serviceId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      setImageUploadError('Plik musi być mniejszy niż 15MB');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCropperImage(objectUrl);
    setCropperFileName(file.name);
    setCropperServiceId(serviceId);
    event.target.value = '';
  };

  // Phase 2: Cropped file -> compress + upload
  const handleCroppedUpload = async (croppedFile: File) => {
    if (cropperImage) URL.revokeObjectURL(cropperImage);
    setCropperImage(null);

    const serviceId = cropperServiceId;
    setUploadingImage(true);
    setImageUploadError(null);

    try {
      const { publicUrl } = await uploadPublicImage({ file: croppedFile, folder: 'service-images', timeoutMs: 20000 });

      const { error: dbError } = await withTimeout(
        supabase.from('service_images').insert({
          service_id: serviceId,
          url: publicUrl,
          alt_text: croppedFile.name,
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
    }
  };

  const handleCropCancel = () => {
    if (cropperImage) URL.revokeObjectURL(cropperImage);
    setCropperImage(null);
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

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>, serviceId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';

    setUploadingVideo(true);
    setImageUploadError(null);

    try {
      const { publicUrl } = await uploadVideo({ file, folder: 'service-videos' });

      const { error: dbError } = await withTimeout(
        supabase.from('service_images').insert({
          service_id: serviceId,
          url: publicUrl,
          video_url: publicUrl,
          alt_text: file.name,
        }),
        20000,
        'Zapis video w bazie trwa zbyt długo'
      );

      if (dbError) throw dbError;

      await loadEditImages(serviceId);
    } catch (err) {
      setImageUploadError(err instanceof Error ? err.message : 'Błąd podczas wgrywania video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleRemoveVideo = async (imageId: string, serviceId: string) => {
    const { error } = await supabase
      .from('service_images')
      .delete()
      .eq('id', imageId);

    if (!error) {
      await loadEditImages(serviceId);
    }
  };

  const handleAutoTranslateName = async (polishName: string, force = false) => {
    if (!polishName.trim()) return;
    const langsToTranslate = [];
    if (force || !nameEn) langsToTranslate.push('en');
    if (force || !nameRu) langsToTranslate.push('ru');
    if (langsToTranslate.length === 0) return;
    
    setTranslatingCount(c => c + 1);
    try {
      const translations = await translateFromPolish(polishName, langsToTranslate);
      if (translations.en) setNameEn(translations.en);
      if (translations.ru) setNameRu(translations.ru);
    } catch (error) {
      if (error instanceof Error) alert(error.message);
    } finally {
      setTranslatingCount(c => c - 1);
    }
  };

  const handleAutoTranslateDesc = async (polishDesc: string, force = false) => {
    if (!polishDesc.trim()) return;
    const langsToTranslate = [];
    if (force || !descEn) langsToTranslate.push('en');
    if (force || !descRu) langsToTranslate.push('ru');
    if (langsToTranslate.length === 0) return;
    
    setTranslatingCount(c => c + 1);
    try {
      const translations = await translateFromPolish(polishDesc, langsToTranslate);
      if (translations.en) setDescEn(translations.en);
      if (translations.ru) setDescRu(translations.ru);
    } catch (error) {
      if (error instanceof Error) alert(error.message);
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

  const handleToggleHidden = async (service: Service) => {
    const nextHidden = !service.is_hidden;
    setServices(prev => prev.map(s => (s.id === service.id ? { ...s, is_hidden: nextHidden } : s)));

    const { error } = await supabase
      .from('services')
      .update({ is_hidden: nextHidden })
      .eq('id', service.id);

    if (error) {
      console.error('Error toggling service visibility:', error);
      await loadServices();
    }
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

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            const hidden = !!service.is_hidden;
            return (
              <div
                key={service.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-[1.01] ${
                  hidden ? 'opacity-75 grayscale' : ''
                }`}
              >
                {service.imageUrl && (
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                    {hidden && (
                      <div className="absolute top-3 left-3">
                        <span className="text-xs font-semibold bg-black/60 text-white px-2 py-1 rounded-full">
                          Ukryta
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{service.name}</h3>
                      <p className="text-sm text-gray-500">{service.category}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-amber-600">
                        {(service.price / 100).toFixed(0)} PLN
                      </p>
                      <p className="text-sm text-gray-500">{service.duration} min</p>
                    </div>
                  </div>

                  {service.description && (
                    <p className="mt-4 text-gray-600 line-clamp-3">{service.description}</p>
                  )}

                  <div className="mt-6 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleHidden(service)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        hidden
                          ? 'bg-white text-gray-700 border-gray-200 hover:border-amber-300 hover:text-amber-700'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:text-gray-900'
                      }`}
                    >
                      {hidden ? 'Pokaż' : 'Ukryj'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(service)}
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                    >
                      Edytuj
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingService(service)}
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Nazwa (polski)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const polishName = (document.querySelector('input[name="name"]') as HTMLInputElement)?.value;
                      if (polishName) handleAutoTranslateName(polishName, true);
                    }}
                    className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Przetłumacz
                  </button>
                </div>
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
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Opis (polski)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const polishDesc = (document.querySelector('textarea[name="description"]') as HTMLTextAreaElement)?.value;
                      if (polishDesc) handleAutoTranslateDesc(polishDesc, true);
                    }}
                    className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Przetłumacz
                  </button>
                </div>
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

              {/* Image & Video section */}
              {editingService && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zdjęcia i video usługi
                  </label>
                  {editImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {editImages.map(img => (
                        <div key={img.id} className="relative group">
                          {img.video_url ? (
                            <>
                              <video
                                src={img.video_url}
                                muted
                                className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                              />
                              <div className="absolute top-0.5 left-0.5 bg-black/60 text-white rounded px-1 text-[10px]">
                                MP4
                              </div>
                            </>
                          ) : (
                            <img
                              src={img.url}
                              alt={img.alt_text || ''}
                              className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => img.video_url
                              ? handleRemoveVideo(img.id, editingService.id)
                              : handleDeleteImage(img.id, editingService.id)
                            }
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/heic,image/heif,image/tiff,image/bmp,.jpg,.jpeg,.png,.gif,.webp,.svg,.heic,.heif,.tiff,.tif,.bmp"
                        onChange={(e) => handleFileSelect(e, editingService.id)}
                        disabled={uploadingImage}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-amber-50 file:text-amber-700
                          hover:file:bg-amber-100"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/webm,video/x-m4v,.mov,.mp4,.webm,.m4v"
                        onChange={(e) => handleVideoUpload(e, editingService.id)}
                        disabled={uploadingVideo}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-purple-50 file:text-purple-700
                          hover:file:bg-purple-100"
                      />
                    </div>
                  </div>
                  {(uploadingImage || uploadingVideo) && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-amber-600">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {uploadingVideo ? 'Wgrywanie video...' : 'Wgrywanie...'}
                    </div>
                  )}
                  {imageUploadError && (
                    <p className="mt-1 text-sm text-red-600">{imageUploadError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">Zdjęcia: maks. 15MB (auto-kompresja) · Video: maks. 50MB (MP4, MOV, WebM)</p>
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
                    if (cropperImage) URL.revokeObjectURL(cropperImage);
                    setCropperImage(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  disabled={saving}
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage || uploadingVideo || modalLoading}
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
      
      {/* Image Cropper Modal */}
      {cropperImage && (
        <ImageCropper
          imageSrc={cropperImage}
          fileName={cropperFileName}
          aspectRatio={16 / 10}
          onCropComplete={handleCroppedUpload}
          onCancel={handleCropCancel}
        />
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