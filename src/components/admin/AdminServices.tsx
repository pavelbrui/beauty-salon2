import React, { useState, useEffect } from 'react';
import { Service } from '../../types';
import { supabase } from '../../lib/supabase';
import { ImageUpload } from '../ImageUpload';


interface Stylist {
  id: string;
  name: string;
}

export const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStylists, setSelectedStylists] = useState<string[]>([]);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

  useEffect(() => {
    loadServices();
    loadStylists();
  }, []);

  const loadStylists = async () => {
    const { data } = await supabase
      .from('stylists')
      .select('id, name')
      .order('name');
    
    if (data) {
      setStylists(data);
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

  const handleSave = async (service: Service) => {
    const { error } = await supabase
      .from('services')
      .upsert({
        id: service.id,
        name: service.name,
        category: service.category,
        price: service.price,
        duration: service.duration,
        description: service.description
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
    setIsModalOpen(false);
    setEditingService(null);
    setSelectedStylists([]);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
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

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Zarządzanie usługami</h3>
        <button
          onClick={() => {
            setEditingService(null);
            setSelectedStylists([]);
            setIsModalOpen(true);
          }}
          className="bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600"
        >
          Dodaj usługę
        </button>
      </div>

      <ul className="divide-y divide-gray-200">
        {services.map((service) => (
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
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
                  Nazwa
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingService?.name}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  required
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
                  Opis
                </label>
                <textarea
                  name="description"
                  defaultValue={editingService?.description}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  rows={3}
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