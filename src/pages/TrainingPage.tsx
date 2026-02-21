import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LocalizedLink } from '../components/LocalizedLink';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { SEO } from '../components/SEO';
import { supabase } from '../lib/supabase';
import { Training } from '../types';
import { cropPositionToStyle } from '../components/admin/CropSelector';
import { getLocalizedField, renderBlock } from '../utils/blockRenderer';

const CATEGORY_LABELS: Record<string, { pl: string; en: string; ru: string }> = {
  permanent_makeup: { pl: 'Makijaż permanentny', en: 'Permanent Makeup', ru: 'Перманентный макияж' },
  manicure: { pl: 'Manikiur', en: 'Manicure', ru: 'Маникюр' },
  brows: { pl: 'Brwi', en: 'Brows', ru: 'Брови' },
  lashes: { pl: 'Rzęsy', en: 'Lashes', ru: 'Ресницы' },
  other: { pl: 'Inne', en: 'Other', ru: 'Другое' },
};

export const TrainingPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const { language } = useLanguage();
  const t = translations[language];
  const tp = (t as Record<string, unknown>).training_page as Record<string, string> | undefined;

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [training, setTraining] = useState<Training | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadTraining(slug);
    } else {
      loadTrainings();
    }
  }, [slug]);

  const loadTrainings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('trainings')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading trainings:', error);
    }
    if (data) {
      setTrainings(data);
    }
    setLoading(false);
  };

  const loadTraining = async (trainingSlug: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('trainings')
      .select('*')
      .eq('slug', trainingSlug)
      .eq('is_published', true)
      .single();

    if (error) {
      console.error('Error loading training:', error);
    }
    if (data) {
      setTraining(data);
    }
    setLoading(false);
  };

  const getCategoryLabel = (cat: string) => {
    const labels = CATEGORY_LABELS[cat];
    if (!labels) return cat;
    return labels[language as keyof typeof labels] || labels.pl;
  };

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

    if (!training) {
      return (
        <main className="pt-16 min-h-screen bg-neutral-50">
          <div className="max-w-4xl mx-auto px-4 py-20 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {language === 'pl' ? 'Szkolenie nie znalezione' : language === 'ru' ? 'Обучение не найдено' : 'Training not found'}
            </h1>
            <LocalizedLink to="/training" className="text-amber-600 hover:text-amber-700 font-medium">
              {tp?.backToList || 'Wróć do listy szkoleń'}
            </LocalizedLink>
          </div>
        </main>
      );
    }

    const trainingTitle = getLocalizedField(training, 'title', language);
    const trainingDesc = getLocalizedField(training, 'description', language);
    const trainingPrice = getLocalizedField(training, 'price', language);
    const trainingDuration = getLocalizedField(training, 'duration', language);

    return (
      <main className="pt-16 min-h-screen bg-neutral-50">
        <SEO
          title={trainingTitle}
          description={trainingDesc}
          canonical={`/training/${training.slug}`}
          image={training.cover_image_url_detail || training.cover_image_url || undefined}
          keywords={[
            `szkolenie ${training.title.toLowerCase()} Białystok`,
            `kurs ${training.title.toLowerCase()}`,
            'szkolenia beauty Białystok',
          ]}
        />

        {/* Hero section */}
        <div className="relative overflow-hidden" style={{ height: `${training.cover_height_detail ?? 384}px` }}>
          {(training.cover_image_url_detail || training.cover_image_url) ? (
            <img
              src={training.cover_image_url_detail || training.cover_image_url!}
              alt={`${trainingTitle} – szkolenie w Białymstoku, salon Katarzyna Brui`}
              className="w-full h-full"
              style={cropPositionToStyle(training.cover_crop_detail || training.cover_image_position)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
              <span className="inline-block px-3 py-1 bg-amber-500 text-white rounded-full text-sm font-medium mb-3">
                {getCategoryLabel(training.category)}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                {trainingTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                {trainingPrice && (
                  <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {trainingPrice}
                  </span>
                )}
                {trainingDuration && (
                  <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {trainingDuration}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <LocalizedLink
            to="/training"
            className="inline-flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {tp?.backToList || 'Wróć do listy szkoleń'}
          </LocalizedLink>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {trainingDesc && (
            <p className="text-lg text-gray-600 leading-relaxed mb-8 pb-8 border-b border-gray-200">
              {trainingDesc}
            </p>
          )}

          {/* Render content blocks */}
          <div>
            {training.content_blocks.map((block, i) => renderBlock(block, language, i))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto px-4 pb-16">
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-2xl p-8 md:p-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {tp?.contactCta || 'Zainteresowany? Skontaktuj się z nami!'}
            </h2>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              {language === 'pl'
                ? 'Zadzwoń lub napisz, aby dowiedzieć się więcej o terminach i zapisać się na szkolenie.'
                : language === 'ru'
                ? 'Позвоните или напишите, чтобы узнать больше о датах и записаться на обучение.'
                : 'Call or write to learn more about dates and sign up for the training.'}
            </p>
            <a
              href="tel:+48123456789"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {tp?.contactButton || 'Umów się na konsultację'}
            </a>
          </div>
        </div>
      </main>
    );
  }

  // --- LIST VIEW ---
  const pageTitle = tp?.heroTitle || tp?.header || t.training || 'Szkolenia';
  const pageDesc = tp?.seoDescription || '';

  return (
    <main className="pt-16 min-h-screen bg-neutral-50">
      <SEO
        title={pageTitle}
        description={pageDesc}
        canonical="/training"
        keywords={[
          'szkolenie makijaż permanentny Białystok',
          'kurs makijażu permanentnego Białystok',
          'szkolenia beauty Białystok',
          'kurs linergistka',
          'szkolenie microblading',
          'kurs stylizacji rzęs',
          'permanent makeup course Poland',
          'szkolenia kosmetyczne Białystok',
        ]}
      />

      {/* Hero Section */}
      <div className="relative overflow-hidden py-20 md:py-28">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('/og-image.jpg')`
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {tp?.heroTitle || 'Profesjonalne Szkolenia Beauty'}
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            {tp?.heroSubtitle || 'Rozpocznij karierę w branży beauty z naszymi certyfikowanymi kursami'}
          </p>
        </div>
      </div>

      {/* Trainings grid */}
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        ) : trainings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">{tp?.noCourses || 'Brak dostępnych szkoleń'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {trainings.map(t => {
              const tTitle = getLocalizedField(t, 'title', language);
              const tDesc = getLocalizedField(t, 'description', language);
              const tPrice = getLocalizedField(t, 'price', language);
              const tDuration = getLocalizedField(t, 'duration', language);

              return (
                <LocalizedLink
                  key={t.id}
                  to={`/training/${t.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  {/* Cover */}
                  <div className="relative overflow-hidden" style={{ height: `${t.cover_height_card ?? 224}px` }}>
                    {t.cover_image_url ? (
                      <img
                        src={t.cover_image_url}
                        alt={`${tTitle} – kurs w Białymstoku, salon Katarzyna Brui`}
                        className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                        style={cropPositionToStyle(t.cover_crop_card || t.cover_image_position)}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 group-hover:from-amber-500 group-hover:to-amber-700 transition-all duration-500" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-amber-700 rounded-full text-xs font-semibold">
                        {getCategoryLabel(t.category)}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">
                        {tTitle}
                      </h2>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    {tDesc && (
                      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                        {tDesc}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        {tPrice && (
                          <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {tPrice}
                          </span>
                        )}
                        {tDuration && (
                          <span className="flex items-center gap-1.5 text-gray-500">
                            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {tDuration}
                          </span>
                        )}
                      </div>
                      <span className="text-amber-600 font-medium text-sm group-hover:translate-x-1 transition-transform duration-300 flex items-center gap-1">
                        {tp?.viewDetails || 'Zobacz szczegóły'}
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

      {/* Bottom CTA */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-2xl p-8 md:p-10 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {tp?.contactCta || 'Zainteresowany? Skontaktuj się z nami!'}
          </h2>
          <p className="text-gray-600 mb-6 max-w-lg mx-auto">
            {language === 'pl'
              ? 'Nie wiesz, które szkolenie wybrać? Pomożemy dobrać najlepszy kurs do Twoich potrzeb.'
              : language === 'ru'
              ? 'Не знаете, какое обучение выбрать? Поможем подобрать лучший курс для вас.'
              : "Not sure which training to choose? We'll help you find the best course for your needs."}
          </p>
          <a
            href="tel:+48123456789"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {tp?.contactButton || 'Umów się na konsultację'}
          </a>
        </div>
      </div>
    </main>
  );
};
