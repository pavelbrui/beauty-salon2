import { useState, useEffect, useMemo } from 'react';
import { Service } from '../../types';
import { supabase } from '../../lib/supabase';
import { ImageUpload } from '../ImageUpload';
import { translateFromPolish } from '../../utils/translateService';
import { StylistFilter } from '../StylistFilter';


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
  const [translating, setTranslating] = useState(false);

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

    if (data) {
      setSelectedStylists(data.map(assignment => assignment.stylist_id));
    }
  };
  const loadServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*, service_images(url)')
      .order('category');
    
    if (error) {
      console.error('Error loading services:', error);
      return;
    }
    
    setServices(data);
  };

  const handleAutoTranslateName = async (polishName: string) => {
    if (!polishName.trim()) return;
    if (nameEn && nameRu) return;
    setTranslating(true);
    try {
      const { en, ru } = await translateFromPolish(polishName);
      setNameEn(prev => prev || en);
      setNameRu(prev => prev || ru);
    } finally {
      setTranslating(false);
    }
  };

  const handleAutoTranslateDesc = async (polishDesc: string) => {
    if (!polishDesc.trim()) return;
    if (descEn && descRu) return;
    setTranslating(true);
    try {
      const { en, ru } = await translateFromPolish(polishDesc);
      setDescEn(prev => prev || en);
      setDescRu(prev => prev || ru);
    } finally {
      setTranslating(false);
    }
  };

  const handleSave = async (service: Service) => {
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
      console.error('Error saving service:', error);
      return;
    }

    // Handle stylist assignments
    const serviceId = service.id;

    // Delete existing assignments
    const { error: deleteError } = await supabase
      .from('stylist_service_assignments')
      .delete()
      .eq('service_id', serviceId);

    if (deleteError) {
      console.error('Error deleting assignments:', deleteError);
      return;
    }

    // Create new assignments
    if (selectedStylists.length > 0) {
      const assignments = selectedStylists.map(stylistId => ({
        service_id: serviceId,
        stylist_id: stylistId
      }));

      const { error: insertError } = await supabase
        .from('stylist_service_assignments')
        .insert(assignments);

      if (insertError) {
        console.error('Error inserting assignments:', insertError);
      }
    }

    loadServices();
    loadAssignments();
    setIsModalOpen(false);
    setEditingService(null);
    setSelectedStylists([]);
    setNameEn(''); setNameRu('');
    setDescEn(''); setDescRu('');
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setNameEn(service.name_en || '');
    setNameRu(service.name_ru || '');
    setDescEn(service.description_en || '');
    setDescRu(service.description_ru || '');
    loadSelectedStylists(service.id);
    setIsModalOpen(true);
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

    loadServices();
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
            setNameEn(''); setNameRu('');
            setDescEn(''); setDescRu('');
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
        {filteredServices.map((service) => (
          <li key={service.id} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {service.name}
                </h3>
                <p className="text-sm text-gray-500">{service.category}</p>
                <p className="text-sm text-gray-600 mt-1">{service.description}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">
                  {(service.price / 100).toFixed(2)} zł
                </p>
                <p className="text-sm text-gray-500">
                  {service.duration} min
                </p>
                <div className="mt-2 space-y-2">
                  <ImageUpload
                    serviceId={service.id}
                    onUploadComplete={loadServices}
                  />
                  <button
                    onClick={() => {
                      handleEdit(service);
                    }}
                    className="text-amber-600 hover:text-amber-700"
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={() => setDeletingService(service)}
                    className="ml-4 text-red-600 hover:text-red-700"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingService ? 'Edytuj usługę' : 'Dodaj usługę'}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const service = {
                  id: editingService?.id || crypto.randomUUID(),
                  name: formData.get('name') as string,
                  category: formData.get('category') as string,
                  price: parseInt(formData.get('price') as string) * 100,
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
                  {translating && <span className="ml-2 text-xs text-amber-500 animate-pulse">tłumaczenie...</span>}
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
                  {translating && <span className="ml-2 text-xs text-amber-500 animate-pulse">tłumaczenie...</span>}
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
                  defaultValue={editingService ? editingService.price / 100 : ''}
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
      
      {/* Delete Confirmation Modal */}
      {deletingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
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