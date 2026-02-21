import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LocalizedLink } from '../components/LocalizedLink';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { SEO } from '../components/SEO';
import { supabase } from '../lib/supabase';
import { BlogPost } from '../types';
import { getLocalizedField, renderBlock } from '../utils/blockRenderer';

const BLOG_CATEGORY_LABELS: Record<string, { pl: string; en: string; ru: string }> = {
  permanent_makeup: { pl: 'Makijaż permanentny', en: 'Permanent Makeup', ru: 'Перманентный макияж' },
  brows_lashes: { pl: 'Brwi i Rzęsy', en: 'Brows & Lashes', ru: 'Брови и ресницы' },
  manicure: { pl: 'Manicure', en: 'Manicure', ru: 'Маникюр' },
  tips: { pl: 'Porady', en: 'Tips', ru: 'Советы' },
};

const BASE_URL = 'https://katarzynabrui.pl';

export const BlogPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const { language } = useLanguage();
  const t = translations[language];
  const bp = (t as Record<string, unknown>).blog_page as Record<string, unknown> | undefined;
  const cats = bp?.categories as Record<string, string> | undefined;

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    if (slug) {
      loadPost(slug);
    } else {
      loadPosts();
    }
  }, [slug]);

  const loadPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (error) console.error('Error loading blog posts:', error);
    if (data) setPosts(data);
    setLoading(false);
  };

  const loadPost = async (postSlug: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', postSlug)
      .eq('is_published', true)
      .single();

    if (error) console.error('Error loading blog post:', error);
    if (data) {
      setPost(data);
      // Load related posts
      const { data: relatedData } = await supabase
        .from('blog_posts')
        .select('id, title, title_en, title_ru, slug, cover_image_url, excerpt, excerpt_en, excerpt_ru, published_at, reading_time_minutes, category')
        .eq('is_published', true)
        .eq('category', data.category)
        .neq('id', data.id)
        .order('published_at', { ascending: false })
        .limit(3);
      if (relatedData) setRelated(relatedData as BlogPost[]);
    }
    setLoading(false);
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
      month: 'long',
      day: 'numeric',
    });
  };

  const filteredPosts = activeCategory === 'all' ? posts : posts.filter(p => p.category === activeCategory);

  // --- DETAIL VIEW ---
  if (slug) {
    if (loading) {
      return (
        <main className="pt-16 min-h-screen bg-neutral-50">
          <div className="flex justify-center items-center py-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        </main>
      );
    }

    if (!post) {
      return (
        <main className="pt-16 min-h-screen bg-neutral-50">
          <div className="max-w-4xl mx-auto px-4 py-20 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {language === 'pl' ? 'Artykuł nie znaleziony' : language === 'ru' ? 'Статья не найдена' : 'Article not found'}
            </h1>
            <LocalizedLink to="/blog" className="text-amber-600 hover:text-amber-700 font-medium">
              {(bp?.backToBlog as string) || 'Wróć do bloga'}
            </LocalizedLink>
          </div>
        </main>
      );
    }

    const postTitle = getLocalizedField(post, 'title', language);
    const postExcerpt = getLocalizedField(post, 'excerpt', language);

    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: postTitle,
      description: postExcerpt,
      image: post.cover_image_url || `${BASE_URL}/og-image.jpg`,
      author: { '@type': 'Person', name: post.author },
      publisher: {
        '@type': 'Organization',
        name: 'Salon Kosmetyczny Katarzyna Brui',
        logo: { '@type': 'ImageObject', url: `${BASE_URL}/og-image.jpg` },
      },
      datePublished: post.published_at,
      dateModified: post.updated_at,
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}/blog/${post.slug}` },
    };

    return (
      <main className="pt-16 min-h-screen bg-neutral-50">
        <SEO
          title={postTitle}
          description={postExcerpt}
          canonical={`/blog/${post.slug}`}
          type="article"
          image={post.cover_image_url || undefined}
          keywords={post.seo_keywords || []}
          structuredData={articleSchema}
        />

        {/* Hero */}
        <div className="relative overflow-hidden h-72 md:h-96">
          {post.cover_image_url ? (
            <img src={post.cover_image_url} alt={postTitle} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
              <span className="inline-block px-3 py-1 bg-amber-500 text-white rounded-full text-sm font-medium mb-3">
                {getCategoryLabel(post.category)}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{postTitle}</h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                <span>{post.author}</span>
                <span className="w-1 h-1 rounded-full bg-white/50" />
                <span>{formatDate(post.published_at)}</span>
                <span className="w-1 h-1 rounded-full bg-white/50" />
                <span>{post.reading_time_minutes} {(bp?.readingTime as string) || 'min czytania'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <LocalizedLink to="/blog" className="inline-flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {(bp?.backToBlog as string) || 'Wróć do bloga'}
          </LocalizedLink>
        </div>

        {/* Article content */}
        <article className="max-w-4xl mx-auto px-4 py-8">
          {postExcerpt && (
            <p className="text-lg text-gray-600 leading-relaxed mb-8 pb-8 border-b border-gray-200 italic">
              {postExcerpt}
            </p>
          )}
          <div>
            {post.content_blocks.map((block, i) => renderBlock(block, language, i))}
          </div>
        </article>

        {/* CTA */}
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-2xl p-8 md:p-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {(bp?.bookCta as string) || 'Chcesz wypróbować? Umów wizytę!'}
            </h2>
            <LocalizedLink
              to="/services"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200"
            >
              {(bp?.bookButton as string) || 'Zarezerwuj wizytę'}
            </LocalizedLink>
          </div>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 pb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              {(bp?.relatedPosts as string) || 'Podobne artykuły'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map(r => (
                <LocalizedLink
                  key={r.id}
                  to={`/blog/${r.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="relative overflow-hidden h-48">
                    {r.cover_image_url ? (
                      <img src={r.cover_image_url} alt={getLocalizedField(r, 'title', language)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600" />
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{getLocalizedField(r, 'title', language)}</h3>
                    <p className="text-sm text-gray-500">{formatDate(r.published_at)}</p>
                  </div>
                </LocalizedLink>
              ))}
            </div>
          </div>
        )}
      </main>
    );
  }

  // --- LIST VIEW ---
  const pageTitle = (bp?.heroTitle as string) || 'Blog Beauty';
  const pageDesc = (bp?.seoDescription as string) || '';

  return (
    <main className="pt-16 min-h-screen bg-neutral-50">
      <SEO
        title={pageTitle}
        description={pageDesc}
        canonical="/blog"
        keywords={[
          'blog beauty Białystok',
          'makijaż permanentny porady',
          'salon kosmetyczny blog',
          'pielęgnacja brwi rzęs',
          'trendy beauty 2026',
        ]}
      />

      {/* Hero */}
      <div className="relative overflow-hidden py-20 md:py-28">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('/og-image.jpg')` }}
        />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {(bp?.heroTitle as string) || 'Blog Beauty'}
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            {(bp?.heroSubtitle as string) || 'Porady, trendy i wiedza o zabiegach kosmetycznych'}
          </p>
        </div>
      </div>

      {/* Category filters */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-amber-500 text-white'
                : 'bg-white text-gray-600 hover:bg-amber-50 border border-gray-200'
            }`}
          >
            {(bp?.allPosts as string) || 'Wszystkie'}
          </button>
          {Object.entries(BLOG_CATEGORY_LABELS).map(([key]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === key
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-amber-50 border border-gray-200'
              }`}
            >
              {cats?.[key] || getCategoryLabel(key)}
            </button>
          ))}
        </div>
      </div>

      {/* Posts grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">{(bp?.noPosts as string) || 'Brak artykułów'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map(p => {
              const pTitle = getLocalizedField(p, 'title', language);
              const pExcerpt = getLocalizedField(p, 'excerpt', language);

              return (
                <LocalizedLink
                  key={p.id}
                  to={`/blog/${p.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="relative overflow-hidden h-56">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-amber-700 rounded-full text-xs font-semibold">
                        {getCategoryLabel(p.category)}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                      {pTitle}
                    </h2>
                    {pExcerpt && (
                      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">{pExcerpt}</p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-500">
                        <span>{formatDate(p.published_at)}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>{p.reading_time_minutes} {(bp?.readingTime as string) || 'min'}</span>
                      </div>
                      <span className="text-amber-600 font-medium group-hover:translate-x-1 transition-transform duration-300 flex items-center gap-1">
                        {(bp?.readMore as string) || 'Czytaj więcej'}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </LocalizedLink>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};
