import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title: string;
  faqs: FAQItem[];
  /** Optional schema.org structured data for rich snippets */
  includeSchema?: boolean;
}

/**
 * FAQ Section component with built-in schema.org support.
 * Renders accordion-style FAQ and optionally includes JSON-LD structured data.
 * 
 * This component helps with:
 * - Better SEO through FAQ schema markup
 * - Improved user experience with accordion UI
 * - Rich snippet display in search results
 * 
 * Usage:
 * <FAQSection 
 *   title="Pytania o makijaż permanentny"
 *   faqs={[
 *     { question: "Ile trwa zabieg?", answer: "Zabieg trwa około 2-3 godzin..." },
 *     { question: "Czy boli?", answer: "Stosujemy znieczulenie topiczne..." }
 *   ]}
 *   includeSchema={true}
 * />
 */
export const FAQSection: React.FC<FAQSectionProps> = ({ title, faqs, includeSchema = true }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Generate schema.org FAQPage structured data
  const generateFAQSchema = () => {
    if (!includeSchema) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  };

  const schema = generateFAQSchema();

  return (
    <>
      {schema && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        </Helmet>
      )}

      <section className="faq-section py-12 px-4 bg-gray-50 rounded-lg">
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">{title}</h2>

        <div className="max-w-2xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left font-semibold text-gray-900 bg-white hover:bg-gray-50 transition-colors flex justify-between items-center"
                aria-expanded={openIndex === index}
              >
                <span>{faq.question}</span>
                <span className="text-2xl text-amber-500">
                  {openIndex === index ? '−' : '+'}
                </span>
              </button>

              {openIndex === index && (
                <div className="px-6 py-4 bg-white border-t border-gray-200 text-gray-700 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default FAQSection;
