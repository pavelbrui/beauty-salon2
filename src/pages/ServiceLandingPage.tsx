import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LocalizedLink } from '../components/LocalizedLink';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { SEO } from '../components/SEO';
import { BreadcrumbSchema, BASE_URL, BUSINESS_PROVIDER, BUSINESS_GEO, BUSINESS_AGGREGATE_RATING } from '../components/schema';
import { supabase } from '../lib/supabase';
import { Service, BlogPost } from '../types';
import { ServiceCardOptimized } from '../components/ServiceCardOptimized';
import { serviceImages } from '../assets/images';
import { getServiceName } from '../utils/serviceTranslation';
import { getCategoryName } from '../utils/serviceTranslation';
import { getLandingPageBySlug, LandingPageConfig, LocalizedText } from '../data/landingPages';
import { getLandingRelationship } from '../data/contentRelationships';
import { getLocalizedField } from '../utils/blockRenderer';
import { prerenderReady } from '../utils/prerenderReady';
import { FAQSection } from '../components/FAQSection';
import { RelatedServices } from '../components/RelatedServices';
import { getFAQByCategory } from '../data/faqData';
import { getCategorySlug } from '../utils/categorySlugMap';

const loc = (text: LocalizedText, language: string): string =>
  text[language as keyof LocalizedText] || text.pl;

const getImageForKey = (key: LandingPageConfig['imageKey']): string => {
  const map: Record<string, string> = {
    permanentMakeup: serviceImages.permanentMakeup,
    lashes: serviceImages.lashes,
    browCare: serviceImages.browCare,
    carbonPeeling: serviceImages.carbonPeeling,
    tattooRemoval: serviceImages.tattooRemoval,
    manicure: serviceImages.manicure,
  };
  return map[key] || serviceImages.permanentMakeup;
};

export const ServiceLandingPage: React.FC = () => {
  const { landingSlug } = useParams<{ landingSlug: string }>();
  const { language } = useLanguage();
  const t = translations[language];
  const lp = (t as Record<string, unknown>).landing_pages as Record<string, string> | undefined;

  const config = landingSlug ? getLandingPageBySlug(landingSlug) : undefined;

  const [services, setServices] = useState<Service[]>([]);
  const [galleryImages, setGalleryImages] = useState<{ id: string; url: string; description?: string; description_en?: string; description_ru?: string }[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!config?.category) {
      setLoading(false);
      prerenderReady();
      // Still load related blog posts for pages without a category (szkolenia)
      if (landingSlug) loadRelatedPosts(landingSlug);
      return;
    }
    const load = async () => {
      const [servicesRes, catRes] = await Promise.all([
        supabase
          .from('services')
          .select('*, service_images(url)')
          .eq('is_hidden', false)
          .eq('category', config.category)
          .order('name'),
        supabase.from('service_categories').select('name, image_url'),
      ]);
      if (servicesRes.error) {
        console.error('Error loading services:', servicesRes.error);
        setLoading(false);
        prerenderReady();
        return;
      }
      const catImgMap = new Map<string, string>();
      if (catRes.data) {
        catRes.data.forEach((c: { name: string; image_url: string | null }) => {
          if (c.image_url) catImgMap.set(c.name, c.image_url);
        });
      }
      const withImages = servicesRes.data.map((service: Service & { service_images?: { url: string }[] }) => ({
        ...service,
        imageUrl:
          service.service_images?.[0]?.url ||
          catImgMap.get(service.category) ||
          getImageForKey(config.imageKey),
      }));
      setServices(withImages);

      // Load gallery images from service_images for this category
      if (config.showEffectsGallery !== false) {
        const serviceIds = servicesRes.data.map((s: Service) => s.id);
        if (serviceIds.length > 0) {
          const { data: imgData } = await supabase
            .from('service_images')
            .select('id, url, description, description_en, description_ru')
            .in('service_id', serviceIds)
            .limit(8);
          if (imgData) setGalleryImages(imgData);
        }
      }

      setLoading(false);
      prerenderReady();
    };
    load();
    if (landingSlug) loadRelatedPosts(landingSlug);
  }, [config?.category, config?.imageKey, landingSlug]);

  const loadRelatedPosts = async (slug: string) => {
    const relationship = getLandingRelationship(slug);
    if (!relationship || relationship.relatedBlogCategories.length === 0) return;
    const { data } = await supabase
      .from('blog_posts')
      .select('id, title, title_en, title_ru, slug, excerpt, excerpt_en, excerpt_ru, cover_image_url, published_at, reading_time_minutes, category')
      .eq('is_published', true)
      .in('category', relationship.relatedBlogCategories)
      .order('published_at', { ascending: false })
      .limit(3);
    if (data) setRelatedPosts(data as BlogPost[]);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(
      language === 'pl' ? 'pl-PL' : language === 'ru' ? 'ru-RU' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );
  };

  // 404 — slug not found
  if (!config) {
    return (
      <main className="pt-16 min-h-screen bg-neutral-50 flex items-center justify-center">
        <SEO title="404" description="Strona nie została znaleziona" noindex />
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-600 mb-6">{(t as any).pageNotFound || 'Strona nie została znaleziona'}</p>
          <LocalizedLink to="/" className="text-amber-600 hover:text-amber-700 font-medium">
            {(t as any).backToHome || 'Wróć na stronę główną'}
          </LocalizedLink>
        </div>
      </main>
    );
  }

  const heroImage = getImageForKey(config.imageKey);
  const seoTitle = loc(config.seo.title, language);
  const seoDesc = loc(config.seo.description, language);
  const seoKeywords = loc(config.seo.keywords, language).split(', ');

  // Structured data: Service + FAQPage — uses shared business constants
  const serviceSchema: Record<string, unknown> = {
    '@type': 'Service',
    'name': loc(config.hero.title, language),
    'description': seoDesc,
    'url': `${BASE_URL}/${config.slug}`,
    'image': heroImage,
    'provider': {
      ...BUSINESS_PROVIDER,
      url: BASE_URL,
      geo: BUSINESS_GEO,
      aggregateRating: BUSINESS_AGGREGATE_RATING,
    },
    'areaServed': {
      '@type': 'City',
      'name': 'Białystok',
    },
  };

  if (services.length > 0) {
    serviceSchema.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      'name': loc(config.hero.title, language),
      'itemListElement': services.map(s => ({
        '@type': 'Offer',
        'itemOffered': {
          '@type': 'Service',
          'name': getServiceName(s, language),
        },
        'price': (s.price / 100).toFixed(0),
        'priceCurrency': 'PLN',
        'availability': 'https://schema.org/InStock',
      })),
    };
  }

  const faqSchema: Record<string, unknown> | null =
    config.faq.length > 0
      ? {
          '@type': 'FAQPage',
          'mainEntity': config.faq.map(item => ({
            '@type': 'Question',
            'name': language === 'en' ? item.question_en : language === 'ru' ? item.question_ru : item.question,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': language === 'en' ? item.answer_en : language === 'ru' ? item.answer_ru : item.answer,
            },
          })),
        }
      : null;

  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@graph': [serviceSchema, ...(faqSchema ? [faqSchema] : [])],
  };

  return (
    <main className="pt-16 min-h-screen bg-neutral-50">
      <SEO
        title={seoTitle}
        description={seoDesc}
        canonical={`/${config.slug}`}
        image={heroImage}
        keywords={seoKeywords}
        structuredData={structuredData}
      />
      <BreadcrumbSchema items={[
        { name: language === 'en' ? 'Home' : language === 'ru' ? 'Главная' : 'Strona główna', url: '/' },
        { name: t.services || 'Usługi', url: '/services' },
        { name: loc(config.hero.title, language), url: `/${config.slug}` },
      ]} />

      {/* Hero */}
      <section className="relative overflow-hidden h-72 md:h-96">
        <img
          src={heroImage}
          alt={loc(config.hero.title, language)}
          className="w-full h-full object-cover"
          width={1920}
          height={600}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
              {loc(config.hero.title, language)}
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              {loc(config.hero.subtitle, language)}
            </p>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="max-w-4xl mx-auto px-4 py-10 md:py-14">
        <p className="text-lg text-gray-600 leading-relaxed">
          {loc(config.intro, language)}
        </p>
        {config.extendedIntro && (
          <p className="text-lg text-gray-600 leading-relaxed mt-4">
            {loc(config.extendedIntro, language)}
          </p>
        )}
      </section>

      {/* Procedure Steps */}
      {config.procedureSteps && config.procedureSteps.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 py-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            {lp?.procedureSteps || 'Przebieg zabiegu'}
          </h2>
          <div className="space-y-6">
            {config.procedureSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-lg">
                  {i + 1}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{loc(step.title, language)}</h3>
                  <p className="text-gray-600 leading-relaxed">{loc(step.description, language)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Services grid */}
      {config.category && (
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {config.category
              ? getCategoryName(config.category, language, (t as Record<string, unknown>).categories as Record<string, string>)
              : (lp?.ourTreatments || 'Nasze zabiegi')}
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-lg h-80 animate-pulse" />
              ))}
            </div>
          ) : services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, idx) => (
                <ServiceCardOptimized key={service.id} service={service} imgLoading={idx < 3 ? 'eager' : 'lazy'} />
              ))}
            </div>
          ) : null}
        </section>
      )}

      {/* Pricing Link */}
      {config.pricingLink && (
        <section className="max-w-4xl mx-auto px-4 py-6">
          <LocalizedLink
            to={config.pricingLink.url}
            className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-5 hover:bg-amber-100 transition-colors group"
          >
            <span className="font-medium text-gray-900">{loc(config.pricingLink.text, language)}</span>
            <svg className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </LocalizedLink>
        </section>
      )}

      {/* Benefits */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {lp?.whyChooseUs || 'Dlaczego warto nas wybrać'}
        </h2>
        <ul className="space-y-3">
          {config.benefits.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 mt-0.5 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-gray-700">{loc(item, language)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Contraindications */}
      {config.contraindications && config.contraindications.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 py-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {lp?.contraindications || 'Przeciwwskazania'}
          </h2>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
            <ul className="space-y-2">
              {config.contraindications.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-0.5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-gray-700">{loc(item, language)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Effects Gallery */}
      {config.showEffectsGallery !== false && galleryImages.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {lp?.effectsGallery || 'Galeria efektów'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {galleryImages.map(img => (
              <div key={img.id} className="relative overflow-hidden rounded-xl aspect-square group">
                <img
                  src={img.url}
                  alt={
                    (language === 'en' ? img.description_en : language === 'ru' ? img.description_ru : img.description) ||
                    loc(config.hero.title, language)
                  }
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  width={300}
                  height={300}
                />
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <LocalizedLink to="/gallery" className="text-amber-600 hover:text-amber-700 font-medium inline-flex items-center gap-1">
              {lp?.viewFullGallery || 'Zobacz pełną galerię'}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </LocalizedLink>
          </div>
        </section>
      )}

      {/* FAQ */}
      {config.faq.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 py-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {lp?.faq || 'Najczęściej zadawane pytania'}
          </h2>
          <div className="space-y-3">
            {config.faq.map((item, i) => (
              <details
                key={i}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group"
              >
                <summary className="cursor-pointer px-6 py-4 font-medium text-gray-900 hover:text-amber-600 transition-colors list-none flex items-center justify-between">
                  <span>
                    {language === 'en' ? item.question_en : language === 'ru' ? item.question_ru : item.question}
                  </span>
                  <svg
                    className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-gray-600">
                  {language === 'en' ? item.answer_en : language === 'ru' ? item.answer_ru : item.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            {lp?.relatedArticles || 'Powiązane artykuły'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map(post => (
              <LocalizedLink
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="relative overflow-hidden h-48">
                  {post.cover_image_url ? (
                    <img
                      src={post.cover_image_url}
                      alt={getLocalizedField(post, 'title', language)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      width={400}
                      height={192}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600" />
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
                    {getLocalizedField(post, 'title', language)}
                  </h3>
                  <p className="text-sm text-gray-500">{formatDate(post.published_at)}</p>
                </div>
              </LocalizedLink>
            ))}
          </div>
        </section>
      )}

      {/* FAQ from faqData */}
      {config.category && (() => {
        const categorySlug = getCategorySlug(config.category);
        const faqItems = getFAQByCategory(categorySlug);
        if (faqItems.length > 0) {
          return (
            <section className="max-w-4xl mx-auto px-4 py-10">
              <FAQSection
                title={lp?.faq || 'Najczęściej zadawane pytania'}
                faqs={faqItems}
                includeSchema={true}
              />
            </section>
          );
        }
        return null;
      })()}

      {/* Related Services */}
      {config.category && services.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-10">
          <RelatedServices
            services={services}
            maxServices={4}
            title={lp?.relatedServices || 'Powiązane usługi'}
          />
        </section>
      )}

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-10 pb-16">
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-2xl p-8 md:p-10 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {loc(config.cta.text, language)}
          </h2>
          <LocalizedLink
            to={config.cta.link}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200"
          >
            {lp?.bookAppointment || t.bookNow || 'Zarezerwuj wizytę'}
          </LocalizedLink>
        </div>
      </section>
    </main>
  );
};
