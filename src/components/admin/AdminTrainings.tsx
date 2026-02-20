import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Training, ContentBlock } from '../../types';
import { BlockEditor } from './BlockEditor';
import { trainingTemplates, generateSlug } from './trainingTemplates';

type View = 'list' | 'editor';
type Lang = 'pl' | 'en' | 'ru';

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'permanent_makeup', label: 'Makijaż permanentny' },
  { value: 'manicure', label: 'Manikiur' },
  { value: 'brows', label: 'Brwi' },
  { value: 'lashes', label: 'Rzęsy' },
  { value: 'other', label: 'Inne' },
];

export const AdminTrainings: React.FC = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [view, setView] = useState<View>('list');
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleRu, setTitleRu] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('permanent_makeup');
  const [description, setDescription] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descRu, setDescRu] = useState('');
  const [price, setPrice] = useState('');
  const [priceEn, setPriceEn] = useState('');
  const [priceRu, setPriceRu] = useState('');
  const [duration, setDuration] = useState('');
  const [durationEn, setDurationEn] = useState('');
  const [durationRu, setDurationRu] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [metaLang, setMetaLang] = useState<Lang>('pl');
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    loadTrainings();
  }, []);

  const loadTrainings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('trainings')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading trainings:', error);
    }
    if (data) {
      setTrainings(data);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setTitle(''); setTitleEn(''); setTitleRu('');
    setSlug(''); setCategory('permanent_makeup');
    setDescription(''); setDescEn(''); setDescRu('');
    setPrice(''); setPriceEn(''); setPriceRu('');
    setDuration(''); setDurationEn(''); setDurationRu('');
    setCoverImageUrl(''); setIsPublished(true);
    setBlocks([]); setMetaLang('pl');
    setEditingTraining(null);
  };

  const populateForm = (t: Training) => {
    setTitle(t.title); setTitleEn(t.title_en || ''); setTitleRu(t.title_ru || '');
    setSlug(t.slug); setCategory(t.category);
    setDescription(t.description || ''); setDescEn(t.description_en || ''); setDescRu(t.description_ru || '');
    setPrice(t.price || ''); setPriceEn(t.price_en || ''); setPriceRu(t.price_ru || '');
    setDuration(t.duration || ''); setDurationEn(t.duration_en || ''); setDurationRu(t.duration_ru || '');
    setCoverImageUrl(t.cover_image_url || ''); setIsPublished(t.is_published);
    setBlocks(t.content_blocks || []);
  };

  const handleEdit = (training: Training) => {
    setEditingTraining(training);
    populateForm(training);
    setView('editor');
  };

  const handleNewFromTemplate = (templateIndex: number) => {
    const t = trainingTemplates[templateIndex];
    resetForm();
    setTitle(t.title); setTitleEn(t.title_en); setTitleRu(t.title_ru);
    setSlug(t.slug); setCategory(t.category);
    setDescription(t.description); setDescEn(t.description_en); setDescRu(t.description_ru);
    setPrice(t.price); setPriceEn(t.price_en); setPriceRu(t.price_ru);
    setDuration(t.duration); setDurationEn(t.duration_en); setDurationRu(t.duration_ru);
    setBlocks(t.content_blocks.map(b => ({ ...b, id: crypto.randomUUID() })));
    setShowTemplateSelector(false);
    setView('editor');
  };

  const handleNewBlank = () => {
    resetForm();
    setShowTemplateSelector(false);
    setView('editor');
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      alert('Tytuł i slug są wymagane');
      return;
    }

    setSaving(true);
    const payload = {
      id: editingTraining?.id || crypto.randomUUID(),
      title,
      title_en: titleEn || null,
      title_ru: titleRu || null,
      slug,
      category,
      description: description || null,
      description_en: descEn || null,
      description_ru: descRu || null,
      cover_image_url: coverImageUrl || null,
      price: price || null,
      price_en: priceEn || null,
      price_ru: priceRu || null,
      duration: duration || null,
      duration_en: durationEn || null,
      duration_ru: durationRu || null,
      content_blocks: blocks,
      is_published: isPublished,
      sort_order: editingTraining?.sort_order ?? trainings.length,
    };

    const { error } = await supabase.from('trainings').upsert(payload);

    if (error) {
      console.error('Error saving training:', error);
      alert('Błąd podczas zapisywania');
    } else {
      await loadTrainings();
      resetForm();
      setView('list');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('trainings').delete().eq('id', id);
    if (error) {
      console.error('Error deleting training:', error);
    } else {
      await loadTrainings();
    }
    setDeletingId(null);
  };

  const handleTogglePublish = async (training: Training) => {
    const { error } = await supabase
      .from('trainings')
      .update({ is_published: !training.is_published })
      .eq('id', training.id);

    if (error) {
      console.error('Error toggling publish:', error);
    } else {
      await loadTrainings();
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Maksymalny rozmiar pliku to 5MB');
      return;
    }

    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `training-cover-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `trainings/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('service-images')
        .getPublicUrl(filePath);
      if (urlData) setCoverImageUrl(urlData.publicUrl);
    } catch (err) {
      console.error('Error uploading cover:', err);
      alert('Błąd podczas przesyłania zdjęcia');
    } finally {
      setUploadingCover(false);
    }
  };

  // Block operations
  const addBlock = (type: ContentBlock['type']) => {
    const base = { id: crypto.randomUUID() };
    let newBlock: ContentBlock;
    switch (type) {
      case 'heading':
        newBlock = { ...base, type: 'heading', text: '', level: 2 };
        break;
      case 'text':
        newBlock = { ...base, type: 'text', text: '' };
        break;
      case 'image':
        newBlock = { ...base, type: 'image', url: '' };
        break;
      case 'list':
        newBlock = { ...base, type: 'list', items: [''], style: 'check' };
        break;
    }
    setBlocks(prev => [...prev, newBlock]);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const updateBlock = (index: number, updated: ContentBlock) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updated;
    setBlocks(newBlocks);
  };

  const removeBlock = (index: number) => {
    setBlocks(prev => prev.filter((_, i) => i !== index));
  };

  const getCategoryLabel = (cat: string) =>
    CATEGORIES.find(c => c.value === cat)?.label || cat;

  // --- LIST VIEW ---
  if (view === 'list') {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Szkolenia</h3>
            <p className="mt-1 text-sm text-gray-500">Zarządzaj kursami i szkoleniami</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowTemplateSelector(!showTemplateSelector)}
              className="bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Dodaj szkolenie
            </button>
            {showTemplateSelector && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Wybierz szablon</p>
                </div>
                {trainingTemplates.map((tmpl, i) => (
                  <button
                    key={i}
                    onClick={() => handleNewFromTemplate(i)}
                    className="w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {tmpl.title.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tmpl.title}</p>
                      <p className="text-xs text-gray-500">{tmpl.duration} · {tmpl.price}</p>
                    </div>
                  </button>
                ))}
                <button
                  onClick={handleNewBlank}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 border-t border-gray-200"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pusty szablon</p>
                    <p className="text-xs text-gray-500">Zacznij od zera</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Ładowanie...</div>
        ) : trainings.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-gray-500 mb-2">Brak szkoleń</p>
            <p className="text-sm text-gray-400">Kliknij "Dodaj szkolenie" aby utworzyć pierwszy kurs</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {trainings.map(training => (
              <div
                key={training.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Cover image */}
                <div className="h-40 bg-gradient-to-br from-amber-400 to-amber-600 relative overflow-hidden">
                  {training.cover_image_url && (
                    <img
                      src={training.cover_image_url}
                      alt={training.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      training.is_published
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {training.is_published ? 'Opublikowane' : 'Szkic'}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-1 bg-black/50 text-white rounded text-xs">
                      {getCategoryLabel(training.category)}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">{training.title}</h4>
                  {training.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{training.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    {training.price && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {training.price}
                      </span>
                    )}
                    {training.duration && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {training.duration}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    {training.content_blocks.length} bloków treści
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(training)}
                      className="flex-1 bg-amber-500 text-white px-3 py-2 rounded-md hover:bg-amber-600 transition-colors text-sm font-medium"
                    >
                      Edytuj
                    </button>
                    <button
                      onClick={() => handleTogglePublish(training)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        training.is_published
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {training.is_published ? 'Ukryj' : 'Opublikuj'}
                    </button>
                    <button
                      onClick={() => setDeletingId(training.id)}
                      className="px-3 py-2 rounded-md text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete confirmation modal */}
        {deletingId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Usuń szkolenie</h3>
              <p className="text-sm text-gray-600 mb-4">Czy na pewno chcesz usunąć to szkolenie? Tej operacji nie można cofnąć.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => handleDelete(deletingId)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                >
                  Usuń
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- EDITOR VIEW ---
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      {/* Header */}
      <div className="px-4 py-4 sm:px-6 flex justify-between items-center border-b border-gray-200">
        <button
          onClick={() => { resetForm(); setView('list'); }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Wstecz
        </button>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={e => setIsPublished(e.target.checked)}
              className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
            />
            Opublikowane
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-5 py-2 rounded-md text-sm font-medium text-white transition-colors ${
              saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {saving ? 'Zapisywanie...' : 'Zapisz'}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* --- METADATA SECTION --- */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Informacje podstawowe
          </h3>

          {/* Language tabs for metadata */}
          <div className="flex gap-1 mb-4">
            {(['pl', 'en', 'ru'] as Lang[]).map(lang => (
              <button
                key={lang}
                type="button"
                onClick={() => setMetaLang(lang)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  metaLang === lang
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tytuł {metaLang !== 'pl' && `(${metaLang.toUpperCase()})`}
                {metaLang === 'pl' && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                value={metaLang === 'pl' ? title : metaLang === 'en' ? titleEn : titleRu}
                onChange={e => {
                  const v = e.target.value;
                  if (metaLang === 'pl') {
                    setTitle(v);
                    if (!editingTraining) setSlug(generateSlug(v));
                  } else if (metaLang === 'en') setTitleEn(v);
                  else setTitleRu(v);
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                placeholder={metaLang === 'pl' ? 'Nazwa szkolenia' : metaLang === 'en' ? 'Training name' : 'Название обучения'}
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug (URL) <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">/training/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                  placeholder="makijaz-permanentny"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cena {metaLang !== 'pl' && `(${metaLang.toUpperCase()})`}
              </label>
              <input
                type="text"
                value={metaLang === 'pl' ? price : metaLang === 'en' ? priceEn : priceRu}
                onChange={e => {
                  const v = e.target.value;
                  if (metaLang === 'pl') setPrice(v);
                  else if (metaLang === 'en') setPriceEn(v);
                  else setPriceRu(v);
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                placeholder="np. od 2 500 PLN"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Czas trwania {metaLang !== 'pl' && `(${metaLang.toUpperCase()})`}
              </label>
              <input
                type="text"
                value={metaLang === 'pl' ? duration : metaLang === 'en' ? durationEn : durationRu}
                onChange={e => {
                  const v = e.target.value;
                  if (metaLang === 'pl') setDuration(v);
                  else if (metaLang === 'en') setDurationEn(v);
                  else setDurationRu(v);
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                placeholder="np. 3 dni (24h)"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opis {metaLang !== 'pl' && `(${metaLang.toUpperCase()})`}
            </label>
            <textarea
              value={metaLang === 'pl' ? description : metaLang === 'en' ? descEn : descRu}
              onChange={e => {
                const v = e.target.value;
                if (metaLang === 'pl') setDescription(v);
                else if (metaLang === 'en') setDescEn(v);
                else setDescRu(v);
              }}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
              placeholder={metaLang === 'pl' ? 'Krótki opis szkolenia...' : metaLang === 'en' ? 'Short description...' : 'Краткое описание...'}
            />
          </div>

          {/* Cover Image */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Zdjęcie okładkowe</label>
            {coverImageUrl && (
              <div className="mb-3 relative inline-block">
                <img
                  src={coverImageUrl}
                  alt="Cover"
                  className="h-32 rounded-lg object-cover shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setCoverImageUrl('')}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <label className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                uploadingCover ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}>
                {uploadingCover ? 'Przesyłanie...' : 'Wgraj zdjęcie'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                  className="hidden"
                />
              </label>
              <span className="text-gray-300">lub</span>
              <input
                type="text"
                value={coverImageUrl}
                onChange={e => setCoverImageUrl(e.target.value)}
                placeholder="Wklej URL zdjęcia..."
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* --- CONTENT BLOCKS SECTION --- */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Bloki treści
            <span className="text-sm font-normal text-gray-400">({blocks.length})</span>
          </h3>

          {/* Block type picker toolbar */}
          <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-xs font-medium text-gray-500 self-center mr-2">Dodaj blok:</span>
            <button
              type="button"
              onClick={() => addBlock('heading')}
              className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-md border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors text-sm"
            >
              <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Nagłówek
            </button>
            <button
              type="button"
              onClick={() => addBlock('text')}
              className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-md border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors text-sm"
            >
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Tekst
            </button>
            <button
              type="button"
              onClick={() => addBlock('image')}
              className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-md border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors text-sm"
            >
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Obraz
            </button>
            <button
              type="button"
              onClick={() => addBlock('list')}
              className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-md border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors text-sm"
            >
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Lista
            </button>
          </div>

          {/* Blocks list */}
          {blocks.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-gray-500 mb-1">Brak bloków treści</p>
              <p className="text-sm text-gray-400">Użyj przycisków powyżej, aby dodać nagłówki, teksty, zdjęcia i listy</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blocks.map((block, i) => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  index={i}
                  onUpdate={updateBlock}
                  onRemove={removeBlock}
                  onMove={moveBlock}
                  isFirst={i === 0}
                  isLast={i === blocks.length - 1}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom save bar */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => { resetForm(); setView('list'); }}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
          >
            Anuluj
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-2 rounded-md text-sm font-medium text-white transition-colors ${
              saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {saving ? 'Zapisywanie...' : 'Zapisz szkolenie'}
          </button>
        </div>
      </div>
    </div>
  );
};
