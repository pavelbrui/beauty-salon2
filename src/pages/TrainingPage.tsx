import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { SEO } from '../components/SEO';

export const TrainingPage: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];

  const title = t.training_page?.title || t.training;
  const description = t.training_page?.seoDescription || '';

  return (
    <main className="pt-16 min-h-screen bg-neutral-50">
      <SEO
        title={title}
        description={description}
        canonical="/training"
        keywords={[
          'szkolenie makijaż permanentny',
          'kurs makijażu permanentnego',
          'szkolenia beauty Białystok',
          'permanent makeup course'
        ]}
      />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          {t.training_page?.header || title}
        </h1>
        <p className="text-gray-700 mb-4">
          {t.training_page?.intro}
        </p>
        <section className="space-y-4">
          {/* You can expand this with details of curriculum, dates, contact form etc. */}
          <p>
            {language === 'pl'
              ? 'Dbamy o praktyczne podejście: podczas kursu pracujesz na modelkach pod okiem specjalistki.'
              : language === 'ru'
              ? 'Мы уделяем внимание практическому подходу: во время курса вы работаете на моделях под руководством специалиста.'
              : 'We focus on a hands-on approach: during the course you work on models under the guidance of a specialist.'}
          </p>
          <p>
            {language === 'pl'
              ? 'Kontakt: zadzwoń lub napisz, by zapisać się na najbliższy termin szkolenia.'
              : language === 'ru'
              ? 'Связаться: позвоните или напишите, чтобы записаться на ближайший курс.'
              : 'Contact us: call or message to sign up for the next training date.'}
          </p>
        </section>
      </div>
    </main>
  );
};
