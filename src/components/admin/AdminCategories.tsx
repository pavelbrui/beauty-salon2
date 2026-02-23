import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface ServiceCategory {
  id: string;
  name: string;
  sort_order: number;
}

export const AdminCategories = () => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

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
            className="bg-brand text-white text-sm px-4 py-1.5 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Zapisywanie...' : 'Zapisz kolejność'}
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-100">
          {categories.map((cat, idx) => (
            <li key={cat.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50">
              <span className="text-sm font-mono text-gray-400 w-8 text-right">
                {cat.sort_order}
              </span>
              <span className="flex-1 text-sm font-medium text-gray-900">{cat.name}</span>
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
                  className="w-16 text-sm text-center border border-gray-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-brand focus:border-brand"
                />
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
