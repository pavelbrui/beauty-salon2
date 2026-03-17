import React from 'react';
import { Helmet } from 'react-helmet-async';

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  verified?: boolean;
}

interface ReviewsWithSchemaProps {
  reviews: Review[];
  businessName?: string;
  businessUrl?: string;
  /** Show only top N reviews */
  maxReviews?: number;
  /** Include schema.org markup */
  includeSchema?: boolean;
}

/**
 * Reviews component with schema.org AggregateRating and Review markup.
 * 
 * Features:
 * - Displays customer reviews with ratings
 * - Generates schema.org Review and AggregateRating markup
 * - Improves search result appearance with star ratings
 * - Increases click-through rates (CTR)
 * - Builds trust with potential customers
 * 
 * Usage:
 * <ReviewsWithSchema 
 *   reviews={customerReviews}
 *   businessName="Salon Katarzyna Brui"
 *   maxReviews={5}
 *   includeSchema={true}
 * />
 */
export const ReviewsWithSchema: React.FC<ReviewsWithSchemaProps> = ({
  reviews,
  businessName = 'Salon Kosmetyczny Katarzyna Brui',
  businessUrl = 'https://katarzynabrui.pl',
  maxReviews = 5,
  includeSchema = true,
}) => {
  const displayedReviews = reviews.slice(0, maxReviews);

  if (displayedReviews.length === 0) {
    return null;
  }

  // Calculate average rating
  const averageRating =
    displayedReviews.reduce((sum, review) => sum + review.rating, 0) /
    displayedReviews.length;

  // Generate schema.org markup
  const generateReviewsSchema = () => {
    if (!includeSchema) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: businessName,
      url: businessUrl,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Math.round(averageRating * 10) / 10,
        reviewCount: reviews.length,
      },
      review: displayedReviews.map(review => ({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: review.author,
        },
        datePublished: review.date,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.rating,
          bestRating: 5,
          worstRating: 1,
        },
        reviewBody: review.text,
      })),
    };
  };

  const schema = generateReviewsSchema();

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      {schema && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        </Helmet>
      )}

      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          {/* Average Rating */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Opinie klientów</h2>
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                {renderStars(Math.round(averageRating))}
                <span className="text-2xl font-bold text-gray-900">
                  {Math.round(averageRating * 10) / 10}
                </span>
              </div>
              <span className="text-gray-600">
                na podstawie {reviews.length} opinii
              </span>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            {displayedReviews.map(review => (
              <article
                key={review.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {review.author}
                      </h3>
                      {review.verified && (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Zweryfikowana
                        </span>
                      )}
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  <time className="text-sm text-gray-500">
                    {formatDate(review.date)}
                  </time>
                </div>
                <p className="text-gray-700 leading-relaxed">{review.text}</p>
              </article>
            ))}
          </div>

          {reviews.length > maxReviews && (
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Wyświetlam {maxReviews} z {reviews.length} opinii
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default ReviewsWithSchema;
