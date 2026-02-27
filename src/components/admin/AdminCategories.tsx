import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { uploadPublicImage } from '../../utils/uploadPublicImage';

interface ServiceCategory {
  id: string;
  name: string;
  sort_order: number;
  image_url: string | null;
}

export const AdminCategories = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('Error loading categories:', error);
      return;
    }
    if (data) setCategories(data);
  };

  const syncFromServices = async () => {
    setSyncing(true);
    const { data: services } = await supabase
      .from('services')
      .select('category');

    if (services) {
      const uniqueNames = Array.from(new Set(services.map(s => s.category)));
      const existingNames = new Set(categories.map(c => c.name));
      const newCategories = uniqueNames.filter(n => !existingNames.has(n));

      if (newCategories.length > 0) {
        const maxOrder = categories.length > 0
          ? Math.max(...categories.map(c => c.sort_order))
          : 0;
        const inserts = newCategories.map((name, i) => ({
          name,
          sort_order: maxOrder + (i + 1) * 10,
        }));
        await supabase.from('service_categories').insert(inserts);
        await loadCategories();
      }
    }
    setSyncing(false);
  };

  const handleSortChange = (id: string, value: number) => {
    setCategories(prev =>
      prev.map(c => (c.id === id ? { ...c, sort_order: value } : c))
    );
  };

  const saveOrder = async () => {
    setSaving(true);
    for (const cat of categories) {
      await supabase
        .from('service_categories')
        .update({ sort_order: cat.sort_order })
        .eq('id', cat.id);
    }
    await loadCategories();
    setSaving(false);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setCategories(prev => {
      const next = [...prev];
      const prevOrder = next[index - 1].sort_order;
      next[index - 1].sort_order = next[index].sort_order;
      next[index].sort_order = prevOrder;
      return next.sort((a, b) => a.sort_order - b.sort_order);
    });
  };

  const moveDown = (index: number) => {
    if (index >= categories.length - 1) return;
    setCategories(prev => {
      const next = [...prev];
      const nextOrder = next[index + 1].sort_order;
      next[index + 1].sort_order = next[index].sort_order;
      next[index].sort_order = nextOrder;
      return next.sort((a, b) => a.sort_order - b.sort_order);
    });
  };

  const handleImageUpload = async (catId: string, file: File) => {
    if (!file) return;
    setUploadingId(catId);
    try {
      const { publicUrl } = await uploadPublicImage({
        file,
        folder: 'categories',
      });

      const { error } = await supabase
        .from('service_categories')
        .update({ image_url: publicUrl })
        .eq('id', catId);

      if (error) {
        console.error('Error saving category image:', error);
        return;
      }

      setCategories(prev =>
        prev.map(c => (c.id === catId ? { ...c, image_url: publicUrl } : c))
      );
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploadingId(null);
    }
  };

  const removeImage = async (catId: string) => {
    const { error } = await supabase
      .from('service_categories')
      .update({ image_url: null })
      .eq('id', catId);

    if (error) {
      console.error('Error removing category image:', error);
      return;
    }

    setCategories(prev =>
      prev.map(c => (c.id === catId ? { ...c, image_url: null } : c))
    );
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Kolejność kategorii</h3>
        <div className="flex gap-2">
          <button
            onClick={syncFromServices}
            disabled={syncing}
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {syncing ? 'Synchronizacja...' : 'Synchronizuj'}
          </button>
          <button
            onClick={saveOrder}
            disabled={saving}
            className="bg-amber-500 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Zapisywanie...' : 'Zapisz kolejność'}
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-100">
          {categories.map((cat, idx) => (
            <li key={cat.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center gap-4">
                {/* Category image thumbnail */}
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 group">
                  {cat.image_url ? (
                    <>
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(cat.id)}
                        className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        title="Usuń zdjęcie"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => fileInputRefs.current[cat.id]?.click()}
                      disabled={uploadingId === cat.id}
                      className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                      title="Dodaj zdjęcie kategorii"
                    >
                      {uploadingId === cat.id ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  )}
                  <input
                    ref={el => { fileInputRefs.current[cat.id] = el; }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(cat.id, file);
                      e.target.value = '';
                    }}
                  />
                </div>

                <span className="text-sm font-mono text-gray-400 w-8 text-right">
                  {cat.sort_order}
                </span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                  {cat.image_url && (
                    <button
                      onClick={() => fileInputRefs.current[cat.id]?.click()}
                      disabled={uploadingId === cat.id}
                      className="ml-2 text-xs text-amber-600 hover:text-amber-700"
                    >
                      {uploadingId === cat.id ? 'Wysyłanie...' : 'Zmień'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    title="Przesuń w górę"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveDown(idx)}
                    disabled={idx === categories.length - 1}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    title="Przesuń w dół"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    value={cat.sort_order}
                    onChange={(e) => handleSortChange(cat.id, parseInt(e.target.value) || 0)}
                    className="w-16 text-sm text-center border border-gray-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
        {categories.length === 0 && (
          <p className="px-6 py-8 text-sm text-gray-500 text-center">
            Brak kategorii. Kliknij "Synchronizuj" aby pobrać kategorie z usług.
          </p>
        )}
      </div>
    </div>
  );
};
