import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useLocalizedNavigate } from '../hooks/useLocalizedPath';
import { translations } from '../i18n/translations';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
  publishedDate?: string;
  tags?: string[];
}

interface RelatedBlogPostsProps {
  /** Current blog post ID to exclude from results */
  currentPostId?: string;
  /** Blog posts to display */
  posts: BlogPost[];
  /** Maximum number of posts to show */
  maxPosts?: number;
  /** Custom title for the section */
  title?: string;
  /** Filter by tags */
  filterByTags?: boolean;
}

/**
 * Related Blog Posts component for internal linking and SEO.
 * 
 * Features:
 * - Displays related blog posts with internal links
 * - Improves site navigation and user engagement
 * - Helps distribute link juice across blog pages
 * - Increases time on site and reduces bounce rate
 * - Optional tag-based filtering for better relevance
 * - SEO-friendly with proper semantic HTML
 * 
 * Usage:
 * <RelatedBlogPosts 
 *   currentPostId={post.id}
 *   posts={allBlogPosts}
 *   maxPosts={3}
 *   filterByTags={true}
 *   title="Przeczytaj również"
 * />
 */
export const RelatedBlogPosts: React.FC<RelatedBlogPostsProps> = ({
  currentPostId,
  posts,
  maxPosts = 3,
  title,
  filterByTags = false,
}) => {
  const { language } = useLanguage();
  const navigate = useLocalizedNavigate();
  const t = translations[language];

  // Find current post to get its tags
  const currentPost = posts.find(p => p.id === currentPostId);
  const currentTags = currentPost?.tags || [];

  // Filter related posts
  let relatedPosts = posts.filter(post => post.id !== currentPostId);

  // If filterByTags is enabled, prioritize posts with matching tags
  if (filterByTags && currentTags.length > 0) {
    relatedPosts = relatedPosts
      .map(post => ({
        post,
        matchCount: post.tags?.filter(tag => currentTags.includes(tag)).length || 0,
      }))
      .sort((a, b) => b.matchCount - a.matchCount)
      .map(({ post }) => post);
  }

  relatedPosts = relatedPosts.slice(0, maxPosts);

  if (relatedPosts.length === 0) {
    return null;
  }

  const sectionTitle = title || (language === 'pl' ? 'Przeczytaj również' : 'Read Also');

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <section className="mt-12 pt-12 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{sectionTitle}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedPosts.map(post => (
          <article
            key={post.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col"
          >
            {post.coverImage && (
              <div className="relative h-40 overflow-hidden bg-gray-200">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  width={400}
                  height={160}
                  decoding="async"
                />
              </div>
            )}
            <div className="p-4 flex flex-col flex-grow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {post.title}
              </h3>
              {post.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-grow">
                  {post.description}
                </p>
              )}
              {post.publishedDate && (
                <p className="text-xs text-gray-500 mb-3">
                  {formatDate(post.publishedDate)}
                </p>
              )}
              <button
                onClick={() => navigate(`/blog/${post.slug}`)}
                className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium transition-colors mt-auto"
                aria-label={`Przeczytaj: ${post.title}`}
              >
                {language === 'pl' ? 'Czytaj więcej' : 'Read More'}
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default RelatedBlogPosts;
