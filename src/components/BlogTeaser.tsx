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

  useEffect(() => {
    loadRecentPosts();
  }, []);

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
    return date.toLocaleDateString(language === 'pl' ? 'pl-PL' : language === 'ru' ? 'ru-RU' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (posts.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
          {(bp?.recentBlog as string) || 'Najnowsze z naszego bloga'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {posts.map(p => {
            const pTitle = getLocalizedField(p, 'title', language);
            const pExcerpt = getLocalizedField(p, 'excerpt', language);

            return (
              <LocalizedLink
                key={p.id}
                to={`/blog/${p.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
              >
                <div className="relative overflow-hidden h-48">
                  {p.cover_image_url ? (
                    <img
                      src={p.cover_image_url}
                      alt={pTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 group-hover:from-amber-500 group-hover:to-amber-700 transition-all duration-500" />
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-amber-700 rounded-full text-xs font-semibold">
                      {getCategoryLabel(p.category)}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                    {pTitle}
                  </h3>
                  {pExcerpt && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{pExcerpt}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(p.published_at)}</span>
                    <span className="text-amber-600 font-medium">
                      {(bp?.readMore as string) || 'Czytaj więcej'} &rarr;
                    </span>
                  </div>
                </div>
              </LocalizedLink>
            );
          })}
        </div>

        <div className="text-center">
          <LocalizedLink
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-full font-medium hover:bg-amber-600 transition-colors"
          >
            {(bp?.viewAll as string) || 'Zobacz wszystkie artykuły'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </LocalizedLink>
        </div>
      </div>
    </section>
  );
};
