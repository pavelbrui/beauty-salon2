import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BlogPost, ContentBlock } from '../../types';
import { BlockEditor } from './BlockEditor';
import { blogTemplates, generateSlug } from './blogTemplates';

type View = 'list' | 'editor';
type Lang = 'pl' | 'en' | 'ru';

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'permanent_makeup', label: 'Makijaż permanentny' },
  { value: 'brows_lashes', label: 'Brwi i Rzęsy' },
  { value: 'manicure', label: 'Manicure' },
  { value: 'tips', label: 'Porady' },
];

export const AdminBlog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [view, setView] = useState<View>('list');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
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
  const [excerpt, setExcerpt] = useState('');
  const [excerptEn, setExcerptEn] = useState('');
  const [excerptRu, setExcerptRu] = useState('');
  const [author, setAuthor] = useState('Katarzyna Brui');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [readingTime, setReadingTime] = useState(5);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [metaLang, setMetaLang] = useState<Lang>('pl');
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) console.error('Error loading blog posts:', error);
    if (data) setPosts(data);
    setLoading(false);
  };

  const resetForm = () => {
    setTitle(''); setTitleEn(''); setTitleRu('');
    setSlug(''); setCategory('permanent_makeup');
    setExcerpt(''); setExcerptEn(''); setExcerptRu('');
    setAuthor('Katarzyna Brui');
    setCoverImageUrl(''); setSeoKeywords('');
    setIsPublished(true); setReadingTime(5);
    setBlocks([]); setMetaLang('pl');
    setEditingPost(null);
  };

  const populateForm = (p: BlogPost) => {
    setTitle(p.title); setTitleEn(p.title_en || ''); setTitleRu(p.title_ru || '');
    setSlug(p.slug); setCategory(p.category);
    setExcerpt(p.excerpt || ''); setExcerptEn(p.excerpt_en || ''); setExcerptRu(p.excerpt_ru || '');
    setAuthor(p.author || 'Katarzyna Brui');
    setCoverImageUrl(p.cover_image_url || '');
    setSeoKeywords((p.seo_keywords || []).join(', '));
    setIsPublished(p.is_published); setReadingTime(p.reading_time_minutes || 5);
    setBlocks(p.content_blocks || []);
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    populateForm(post);
    setView('editor');
  };

  const handleNewFromTemplate = (idx: number) => {
    const t = blogTemplates[idx];
    resetForm();
    setTitle(t.title); setTitleEn(t.title_en); setTitleRu(t.title_ru);
    setSlug(t.slug); setCategory(t.category);
    setExcerpt(t.excerpt); setExcerptEn(t.excerpt_en); setExcerptRu(t.excerpt_ru);
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
      id: editingPost?.id || crypto.randomUUID(),
      title,
      title_en: titleEn || null,
      title_ru: titleRu || null,
      slug,
      category,
      excerpt: excerpt || null,
      excerpt_en: excerptEn || null,
      excerpt_ru: excerptRu || null,
      author: author || 'Katarzyna Brui',
      cover_image_url: coverImageUrl || null,
      seo_keywords: seoKeywords ? seoKeywords.split(',').map(k => k.trim()).filter(Boolean) : [],
      content_blocks: blocks,
      is_published: isPublished,
      published_at: isPublished ? (editingPost?.published_at || new Date().toISOString()) : null,
      reading_time_minutes: readingTime,
      sort_order: editingPost?.sort_order ?? posts.length,
    };

    const { error } = await supabase.from('blog_posts').upsert(payload);
    if (error) {
      console.error('Error saving blog post:', error);
      alert('Błąd podczas zapisywania');
    } else {
      await loadPosts();
      resetForm();
      setView('list');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) console.error('Error deleting blog post:', error);
    else await loadPosts();
    setDeletingId(null);
  };

  const handleTogglePublish = async (post: BlogPost) => {
    const updates: Record<string, unknown> = { is_published: !post.is_published };
    if (!post.is_published && !post.published_at) {
      updates.published_at = new Date().toISOString();
    }
    const { error } = await supabase.from('blog_posts').update(updates).eq('id', post.id);
    if (error) console.error('Error toggling publish:', error);
    else await loadPosts();
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }

    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `blog-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `blog/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('service-images').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('service-images').getPublicUrl(filePath);
      setCoverImageUrl(data.publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Błąd uploadu');
    }
    setUploadingCover(false);
  };

  const handleBlockUpdate = (index: number, block: ContentBlock) => {
    const newBlocks = [...blocks];
    newBlocks[index] = block;
    setBlocks(newBlocks);
  };

  const handleBlockRemove = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const handleBlockMove = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const addBlock = (type: ContentBlock['type']) => {
    const id = crypto.randomUUID();
    let newBlock: ContentBlock;
    switch (type) {
      case 'heading':
        newBlock = { id, type: 'heading', text: '', level: 2 };
        break;
      case 'text':
        newBlock = { id, type: 'text', text: '' };
        break;
      case 'image':
        newBlock = { id, type: 'image', url: '' };
        break;
      case 'list':
        newBlock = { id, type: 'list', items: [''], style: 'bullet' };
        break;
      case 'embed':
        newBlock = { id, type: 'embed', url: '', embed_type: 'instagram' };
        break;
      default:
        return;
    }
    setBlocks([...blocks, newBlock]);
  };

  // --- LIST VIEW ---
  if (view === 'list') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Blog</h2>
          <div className="relative">
            <button
              onClick={() => setShowTemplateSelector(!showTemplateSelector)}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
            >
              + Nowy post
            </button>
            {showTemplateSelector && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-10 overflow-hidden">
                <button onClick={handleNewBlank} className="w-full px-4 py-3 text-left hover:bg-gray-50 text-sm font-medium text-gray-700 border-b">
                  Pusty post
                </button>
                {blogTemplates.map((t, i) => (
                  <button key={i} onClick={() => handleNewFromTemplate(i)} className="w-full px-4 py-3 text-left hover:bg-gray-50 text-sm text-gray-600">
                    {t.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        ) : posts.length === 0 ? (
          <p className="text-gray-500 text-center py-12">Brak postów. Kliknij &quot;+ Nowy post&quot; aby dodać.</p>
        ) : (
          <div className="space-y-3">
            {posts.map(p => (
              <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                {p.cover_image_url ? (
                  <img src={p.cover_image_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{p.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.is_published ? 'Opublikowany' : 'Szkic'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {CATEGORIES.find(c => c.value === p.category)?.label} &middot; {p.author}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleTogglePublish(p)} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50">
                    {p.is_published ? 'Ukryj' : 'Publikuj'}
                  </button>
                  <button onClick={() => handleEdit(p)} className="px-3 py-1.5 text-xs rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100">
                    Edytuj
                  </button>
                  <button onClick={() => setDeletingId(p.id)} className="px-3 py-1.5 text-xs rounded-lg text-red-600 hover:bg-red-50">
                    Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete confirmation modal */}
        {deletingId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Potwierdź usunięcie</h3>
              <p className="text-gray-600 mb-4 text-sm">Czy na pewno chcesz usunąć ten post? Tej operacji nie można cofnąć.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeletingId(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Anuluj</button>
                <button onClick={() => handleDelete(deletingId)} className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600">Usuń</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- EDITOR VIEW ---
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => { resetForm(); setView('list'); }} className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Wróć do listy
        </button>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="rounded text-amber-500 focus:ring-amber-500" />
            Opublikowany
          </label>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 text-sm font-medium">
            {saving ? 'Zapisywanie...' : 'Zapisz'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        {/* Language tabs for metadata */}
        <div className="flex gap-1 mb-4">
          {(['pl', 'en', 'ru'] as Lang[]).map(lang => (
            <button
              key={lang}
              onClick={() => setMetaLang(lang)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase ${metaLang === lang ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tytuł ({metaLang.toUpperCase()})</label>
          {metaLang === 'pl' ? (
            <input value={title} onChange={e => { setTitle(e.target.value); if (!editingPost) setSlug(generateSlug(e.target.value)); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="Tytuł artykułu" />
          ) : metaLang === 'en' ? (
            <input value={titleEn} onChange={e => setTitleEn(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="Article title (EN)" />
          ) : (
            <input value={titleRu} onChange={e => setTitleRu(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="Заголовок статьи (RU)" />
          )}
        </div>

        {/* Excerpt */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Opis SEO ({metaLang.toUpperCase()})</label>
          {metaLang === 'pl' ? (
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="Krótki opis do meta description (150-200 znaków)" />
          ) : metaLang === 'en' ? (
            <textarea value={excerptEn} onChange={e => setExcerptEn(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="Short SEO description (EN)" />
          ) : (
            <textarea value={excerptRu} onChange={e => setExcerptRu(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="Краткое описание SEO (RU)" />
          )}
        </div>

        {/* Slug + Category + Author row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="url-slug" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
            <input value={author} onChange={e => setAuthor(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm" />
          </div>
        </div>

        {/* SEO Keywords + Reading Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Słowa kluczowe SEO (rozdzielone przecinkami)</label>
            <input value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm" placeholder="makijaż permanentny, białystok" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Czas czytania (min)</label>
            <input type="number" value={readingTime} onChange={e => setReadingTime(parseInt(e.target.value) || 5)} min={1} max={30} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm" />
          </div>
        </div>

        {/* Cover image */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Zdjęcie okładki</label>
          <div className="flex items-center gap-4">
            {coverImageUrl && (
              <img src={coverImageUrl} alt="" className="w-24 h-16 object-cover rounded-lg" />
            )}
            <label className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              {uploadingCover ? 'Wysyłanie...' : 'Wybierz plik'}
              <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
            </label>
            {coverImageUrl && (
              <button onClick={() => setCoverImageUrl('')} className="text-xs text-red-500 hover:text-red-700">Usuń</button>
            )}
          </div>
        </div>
      </div>

      {/* Content blocks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-medium text-gray-900 mb-4">Treść artykułu</h3>

        {blocks.map((block, i) => (
          <BlockEditor
            key={block.id || i}
            block={block}
            index={i}
            onUpdate={handleBlockUpdate}
            onRemove={handleBlockRemove}
            onMove={handleBlockMove}
            isFirst={i === 0}
            isLast={i === blocks.length - 1}
          />
        ))}

        <div className="flex gap-2 mt-4">
          {(['heading', 'text', 'image', 'list', 'embed'] as const).map(type => (
            <button
              key={type}
              onClick={() => addBlock(type)}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium"
            >
              + {type === 'heading' ? 'Nagłówek' : type === 'text' ? 'Tekst' : type === 'image' ? 'Obraz' : type === 'list' ? 'Lista' : 'Embed'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
