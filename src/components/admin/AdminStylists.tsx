import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Stylist {
  id: string;
  name: string;
  role: string;
  image_url: string;
  specialties: string[];
  description: string;
}

export const AdminStylists: React.FC = () => {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [editingStylist, setEditingStylist] = useState<Stylist | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleSave = async (stylist: Stylist) => {
    const { error } = await supabase
      .from('stylists')
      .upsert({
        id: stylist.id,
        name: stylist.name,
        role: stylist.role,
        image_url: stylist.image_url,
        specialties: stylist.specialties,
        description: stylist.description
      });

    if (error) {
      console.error('Error saving stylist:', error);
      return;
    }

    loadStylists();
    setIsModalOpen(false);
    setEditingStylist(null);
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Zarządzanie stylistami</h3>
        <button
          onClick={() => {
            setEditingStylist(null);
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
                onClick={() => {
                  setEditingStylist(stylist);
                  setIsModalOpen(true);
                }}
                className="mt-4 text-amber-600 hover:text-amber-700"
              >
                Edytuj
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">
              {editingStylist ? 'Edytuj stylistę' : 'Dodaj stylistę'}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const stylist = {
                  id: editingStylist?.id || crypto.randomUUID(),
                  name: formData.get('name') as string,
                  role: formData.get('role') as string,
                  image_url: formData.get('image_url') as string,
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
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Stanowisko
                </label>
                <input
                  type="text"
                  name="role"
                  defaultValue={editingStylist?.role}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  URL zdjęcia
                </label>
                <input
                  type="url"
                  name="image_url"
                  defaultValue={editingStylist?.image_url}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Specjalizacje (oddzielone przecinkami)
                </label>
                <input
                  type="text"
                  name="specialties"
                  defaultValue={editingStylist?.specialties.join(', ')}
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
                  defaultValue={editingStylist?.description}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                  rows={3}
                  required
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