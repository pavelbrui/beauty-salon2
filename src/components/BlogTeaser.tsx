import React, { useState, useEffect } from 'react';
import { LocalizedLink } from './LocalizedLink';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { supabase } from '../lib/supabase';
import { BlogPost } from '../types';
import { getLocalizedField } from '../utils/blockRenderer';

const BLOG_CATEGORY_LABELS: Record<string, { pl: string; en: string; ru: string }> = {
  permanent_makeup: { pl: 'Makijaż permanentny', en: 'Permanent Makeup', ru: 'Перманентный макияж' },
  brows_lashes: { pl: 'Brwi i Rzęsy', en: 'Brows & Lashes', ru: 'Брови и ресницы' },
  manicure: { pl: 'Manicure', en: 'Manicure', ru: 'Маникюр' },
  tips: { pl: 'Porady', en: 'Tips', ru: 'Советы' },
};

export const BlogTeaser: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const bp = (t as Record<string, unknown>).blog_page as Record<string, unknown> | undefined;

  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => { loadRecentPosts(); }, []);

  const loadRecentPosts = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, title_en, title_ru, slug, excerpt, excerpt_en, excerpt_ru, cover_image_url, published_at, reading_time_minutes, category')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(3);
    if (error) console.error('Error loading blog posts:', error);
    if (data) setPosts(data as BlogPost[]);
  };

  const getCategoryLabel = (cat: string) => {
    const labels = BLOG_CATEGORY_LABELS[cat];
    if (!labels) return cat;
    return labels[language as keyof typeof labels] || labels.pl;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'pl' ? 'pl-PL' : language === 'ru' ? 'ru-RU' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (posts.length === 0) return null;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-16 gap-6">
          <div>
            <span className="text-[11px] uppercase tracking-[0.3em] text-rose-500 font-medium">Blog</span>
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-gray-900 mt-3">
              {(bp?.recentBlog as string) || 'Najnowsze z naszego bloga'}
            </h2>
          </div>
          <LocalizedLink
            to="/blog"
            className="text-[13px] uppercase tracking-[0.15em] font-medium text-gray-900 border-b border-gray-900 pb-1 hover:text-rose-500 hover:border-rose-500 transition-colors self-start lg:self-auto"
          >
            {(bp?.viewAll as string) || 'Zobacz wszystkie artykuły'}
          </LocalizedLink>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map(p => {
            const pTitle = getLocalizedField(p, 'title', language);
            const pExcerpt = getLocalizedField(p, 'excerpt', language);
            return (
              <LocalizedLink
                key={p.id}
                to={`/blog/${p.slug}`}
                className="group"
              >
                <div className="relative overflow-hidden aspect-[4/3] mb-5">
                  {p.cover_image_url ? (
                    <img src={p.cover_image_url} alt={pTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[800ms]" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-rose-500 font-medium">{getCategoryLabel(p.category)}</span>
                <h3 className="text-xl font-serif font-bold text-gray-900 mt-2 mb-2 group-hover:text-rose-500 transition-colors line-clamp-2">{pTitle}</h3>
                {pExcerpt && <p className="text-gray-400 text-sm line-clamp-2 mb-3">{pExcerpt}</p>}
                <span className="text-xs text-gray-400">{formatDate(p.published_at)}</span>
              </LocalizedLink>
            );
          })}
        </div>
      </div>
    </section>
  );
};
