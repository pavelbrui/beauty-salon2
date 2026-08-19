import { useEffect, useState } from 'react';
import { BooksyComplexService } from '../../types';
import { translations } from '../../i18n/translations';

interface Props {
  language?: 'pl' | 'en' | 'ru';
}

export default function AdminBooksyComplexServices({ language = 'pl' }: Props) {
  const t = translations[language]?.admin_booksy;
  const [items, setItems] = useState<BooksyComplexService[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load initial data (placeholder: replace with real fetch)
    setIsLoading(true);
    fetch('/api/booksy/complex-services')
      .then((r) => r.json())
      .then((data) => setItems(data || []))
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));

    // TODO: fetch stylists for dropdown when adding/editing mappings
  }, []);

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">{t.complexServicesTitle}</h2>
        <p className="text-sm text-gray-600">{t.complexServicesDesc}</p>
      </div>

      <div className="bg-white shadow rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">{t.serviceNameInBooksy}</th>
              <th className="px-4 py-2 text-left">{t.additionalStylist}</th>
              <th className="px-4 py-2 text-left">{t.statusActiveLabel}</th>
              <th className="px-4 py-2 text-left">{t.notes}</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">Loading…</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">{t.noComplexServices}</td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="px-4 py-3">{it.booksy_service_name}</td>
                  <td className="px-4 py-3">{it.stylists?.name || it.additional_stylist_id}</td>
                  <td className="px-4 py-3">{it.is_active ? t.statusActiveLabel : t.statusInactiveLabel}</td>
                  <td className="px-4 py-3">{it.notes || '-'}</td>
                  <td className="px-4 py-3">
                    <button className="text-amber-600 hover:underline mr-3">Edit</button>
                    <button className="text-gray-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <button className="bg-amber-500 text-white px-4 py-2 rounded">{t.addComplexService}</button>
      </div>
    </div>
  );
}
