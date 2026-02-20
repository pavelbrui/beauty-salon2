import React, { useState } from 'react';
import { ContentBlock, HeadingBlock, TextBlock, ImageBlock, ListBlock } from '../../types';
import { supabase } from '../../lib/supabase';

interface BlockEditorProps {
  block: ContentBlock;
  index: number;
  onUpdate: (index: number, block: ContentBlock) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
}

const BLOCK_LABELS: Record<string, string> = {
  heading: 'Nagłówek',
  text: 'Tekst',
  image: 'Obraz',
  list: 'Lista',
};

const BLOCK_COLORS: Record<string, string> = {
  heading: 'bg-purple-100 text-purple-700',
  text: 'bg-blue-100 text-blue-700',
  image: 'bg-green-100 text-green-700',
  list: 'bg-orange-100 text-orange-700',
};

type Lang = 'pl' | 'en' | 'ru';

export const BlockEditor: React.FC<BlockEditorProps> = ({
  block,
  index,
  onUpdate,
  onRemove,
  onMove,
  isFirst,
  isLast,
}) => {
  const [langTab, setLangTab] = useState<Lang>('pl');
  const [uploading, setUploading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Maksymalny rozmiar pliku to 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `training-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `trainings/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('service-images')
        .getPublicUrl(filePath);

      if (urlData) {
        onUpdate(index, { ...block, url: urlData.publicUrl } as ImageBlock);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Błąd podczas przesyłania zdjęcia');
    } finally {
      setUploading(false);
    }
  };

  const getBlockSummary = (): string => {
    switch (block.type) {
      case 'heading': return block.text || '(pusty nagłówek)';
      case 'text': return (block.text || '(pusty tekst)').slice(0, 60) + (block.text.length > 60 ? '...' : '');
      case 'image': return block.caption || (block.url ? 'Zdjęcie' : '(brak zdjęcia)');
      case 'list': return `${block.items.length} pozycji (${block.style === 'check' ? 'check' : 'bullet'})`;
    }
  };

  const renderLangTabs = () => (
    <div className="flex gap-1 mb-2">
      {(['pl', 'en', 'ru'] as Lang[]).map(lang => (
        <button
          key={lang}
          type="button"
          onClick={() => setLangTab(lang)}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            langTab === lang
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );

  const renderHeadingEditor = (b: HeadingBlock) => (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-500">Poziom:</label>
        <select
          value={b.level}
          onChange={e => onUpdate(index, { ...b, level: parseInt(e.target.value) as 2 | 3 })}
          className="rounded-md border-gray-300 text-sm py-1 px-2 focus:border-amber-500 focus:ring-amber-500"
        >
          <option value={2}>H2 — Sekcja</option>
          <option value={3}>H3 — Podsekcja</option>
        </select>
      </div>
      {renderLangTabs()}
      <input
        type="text"
        value={langTab === 'pl' ? b.text : langTab === 'en' ? (b.text_en || '') : (b.text_ru || '')}
        onChange={e => {
          const val = e.target.value;
          if (langTab === 'pl') onUpdate(index, { ...b, text: val });
          else if (langTab === 'en') onUpdate(index, { ...b, text_en: val });
          else onUpdate(index, { ...b, text_ru: val });
        }}
        placeholder={langTab === 'pl' ? 'Tekst nagłówka...' : langTab === 'en' ? 'Heading text...' : 'Текст заголовка...'}
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
      />
    </div>
  );

  const renderTextEditor = (b: TextBlock) => (
    <div className="space-y-2">
      {renderLangTabs()}
      <textarea
        value={langTab === 'pl' ? b.text : langTab === 'en' ? (b.text_en || '') : (b.text_ru || '')}
        onChange={e => {
          const val = e.target.value;
          if (langTab === 'pl') onUpdate(index, { ...b, text: val });
          else if (langTab === 'en') onUpdate(index, { ...b, text_en: val });
          else onUpdate(index, { ...b, text_ru: val });
        }}
        rows={4}
        placeholder={langTab === 'pl' ? 'Treść akapitu...' : langTab === 'en' ? 'Paragraph text...' : 'Текст абзаца...'}
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
      />
    </div>
  );

  const renderImageEditor = (b: ImageBlock) => (
    <div className="space-y-3">
      {b.url && (
        <img
          src={b.url}
          alt={b.caption || ''}
          className="w-full max-h-64 object-cover rounded-lg"
          style={{ objectPosition: b.position || 'center' }}
        />
      )}
      <div className="flex items-center gap-3">
        <label className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          uploading ? 'bg-gray-300 cursor-not-allowed' : 'bg-amber-500 text-white hover:bg-amber-600'
        }`}>
          {uploading ? 'Przesyłanie...' : (b.url ? 'Zmień zdjęcie' : 'Wgraj zdjęcie')}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {b.url && (
          <button
            type="button"
            onClick={() => onUpdate(index, { ...b, url: '' })}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Usuń zdjęcie
          </button>
        )}
      </div>
      <input
        type="text"
        value={b.url || ''}
        onChange={e => onUpdate(index, { ...b, url: e.target.value })}
        placeholder="lub wklej URL zdjęcia..."
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
      />
      {/* Position selector */}
      {b.url && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Kadrowanie:</span>
          {(['top', 'center', 'bottom'] as const).map(pos => (
            <button
              key={pos}
              type="button"
              onClick={() => onUpdate(index, { ...b, position: pos })}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                (b.position || 'center') === pos
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {pos === 'top' ? 'Góra' : pos === 'center' ? 'Środek' : 'Dół'}
            </button>
          ))}
        </div>
      )}
      {renderLangTabs()}
      <input
        type="text"
        value={langTab === 'pl' ? (b.caption || '') : langTab === 'en' ? (b.caption_en || '') : (b.caption_ru || '')}
        onChange={e => {
          const val = e.target.value;
          if (langTab === 'pl') onUpdate(index, { ...b, caption: val });
          else if (langTab === 'en') onUpdate(index, { ...b, caption_en: val });
          else onUpdate(index, { ...b, caption_ru: val });
        }}
        placeholder={langTab === 'pl' ? 'Podpis zdjęcia (opcjonalnie)' : langTab === 'en' ? 'Image caption (optional)' : 'Подпись к фото (необязательно)'}
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
      />
    </div>
  );

  const renderListEditor = (b: ListBlock) => {
    const currentItems = langTab === 'pl' ? b.items : langTab === 'en' ? (b.items_en || []) : (b.items_ru || []);

    const updateItems = (newItems: string[]) => {
      if (langTab === 'pl') onUpdate(index, { ...b, items: newItems });
      else if (langTab === 'en') onUpdate(index, { ...b, items_en: newItems });
      else onUpdate(index, { ...b, items_ru: newItems });
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-500">Styl:</label>
          <button
            type="button"
            onClick={() => onUpdate(index, { ...b, style: 'bullet' })}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              b.style === 'bullet' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            • Punkty
          </button>
          <button
            type="button"
            onClick={() => onUpdate(index, { ...b, style: 'check' })}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              b.style === 'check' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ✓ Checklist
          </button>
        </div>
        {renderLangTabs()}
        <div className="space-y-2">
          {currentItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-5 text-right">{i + 1}.</span>
              <input
                type="text"
                value={item}
                onChange={e => {
                  const newItems = [...currentItems];
                  newItems[i] = e.target.value;
                  updateItems(newItems);
                }}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
              />
              <button
                type="button"
                onClick={() => updateItems(currentItems.filter((_, idx) => idx !== i))}
                className="text-red-400 hover:text-red-600 p-1"
                title="Usuń pozycję"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => updateItems([...currentItems, ''])}
          className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Dodaj pozycję
        </button>
      </div>
    );
  };

  const renderEditor = () => {
    switch (block.type) {
      case 'heading': return renderHeadingEditor(block);
      case 'text': return renderTextEditor(block);
      case 'image': return renderImageEditor(block);
      case 'list': return renderListEditor(block);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-t-lg border-b border-gray-200">
        <div className="flex items-center gap-3">
          {/* Drag handle (decorative) */}
          <div className="text-gray-300 cursor-grab">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
            </svg>
          </div>
          {/* Type badge */}
          <span className={`px-2 py-0.5 text-xs font-semibold rounded ${BLOCK_COLORS[block.type]}`}>
            {BLOCK_LABELS[block.type]}
          </span>
          {/* Summary when collapsed */}
          {collapsed && (
            <span className="text-sm text-gray-500 truncate max-w-xs">{getBlockSummary()}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Collapse toggle */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
            title={collapsed ? 'Rozwiń' : 'Zwiń'}
          >
            <svg className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          {/* Move up */}
          <button
            type="button"
            onClick={() => onMove(index, 'up')}
            disabled={isFirst}
            className={`p-1.5 rounded ${isFirst ? 'text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
            title="Przesuń wyżej"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          {/* Move down */}
          <button
            type="button"
            onClick={() => onMove(index, 'down')}
            disabled={isLast}
            className={`p-1.5 rounded ${isLast ? 'text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
            title="Przesuń niżej"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {/* Delete */}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1.5 text-red-400 hover:text-red-600 rounded"
            title="Usuń blok"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content area */}
      {!collapsed && (
        <div className="p-4">
          {renderEditor()}
        </div>
      )}
    </div>
  );
};
