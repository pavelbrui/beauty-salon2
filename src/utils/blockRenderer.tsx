import React from 'react';
import { ContentBlock, Training, BlogPost, EmbedBlock } from '../types';
import { cropPositionToStyle } from '../components/admin/CropSelector';

export const getLocalizedText = (block: { text: string; text_en?: string; text_ru?: string }, language: string): string => {
  if (language === 'en' && block.text_en) return block.text_en;
  if (language === 'ru' && block.text_ru) return block.text_ru;
  return block.text;
};

export const getLocalizedField = (obj: Record<string, unknown> | Training | BlogPost, field: string, language: string): string => {
  const o = obj as Record<string, unknown>;
  if (language === 'en' && o[`${field}_en`]) return o[`${field}_en`] as string;
  if (language === 'ru' && o[`${field}_ru`]) return o[`${field}_ru`] as string;
  return (o[field] as string) || '';
};

export const renderBlock = (block: ContentBlock, language: string, index: number): React.ReactNode => {
  switch (block.type) {
    case 'heading': {
      const text = getLocalizedText(block, language);
      if (block.level === 2) {
        return (
          <h2 key={block.id || index} className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-amber-200">
            {text}
          </h2>
        );
      }
      return (
        <h3 key={block.id || index} className="text-xl font-semibold text-gray-800 mt-8 mb-3">
          {text}
        </h3>
      );
    }
    case 'text': {
      const text = getLocalizedText(block, language);
      return (
        <p key={block.id || index} className="text-gray-700 leading-relaxed mb-4">
          {text}
        </p>
      );
    }
    case 'image': {
      if (!block.url) return null;
      const caption = language === 'en' ? (block.caption_en || block.caption) : language === 'ru' ? (block.caption_ru || block.caption) : block.caption;
      return (
        <figure key={block.id || index} className="my-8">
          <img
            src={block.url}
            alt={caption || 'Zabieg kosmetyczny – salon Katarzyna Brui Białystok'}
            className="w-full max-h-[600px] rounded-xl shadow-lg"
            style={cropPositionToStyle(block.position)}
            loading="lazy"
          />
          {caption && (
            <figcaption className="text-sm text-gray-500 mt-3 text-center italic">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    }
    case 'list': {
      const items = language === 'en' && block.items_en?.length ? block.items_en
        : language === 'ru' && block.items_ru?.length ? block.items_ru
        : block.items;

      if (block.style === 'check') {
        return (
          <ul key={block.id || index} className="my-4 space-y-2.5">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        );
      }

      return (
        <ul key={block.id || index} className="my-4 space-y-2 list-disc pl-6">
          {items.map((item, i) => (
            <li key={i} className="text-gray-700">{item}</li>
          ))}
        </ul>
      );
    }
    case 'embed': {
      const eb = block as EmbedBlock;
      const caption = language === 'en' ? (eb.caption_en || eb.caption) : language === 'ru' ? (eb.caption_ru || eb.caption) : eb.caption;

      if (eb.embed_type === 'instagram' && eb.url) {
        const embedUrl = eb.url.replace(/\/?\??$/, '').replace(/\/embed\/?$/, '') + '/embed/';
        return (
          <figure key={eb.id || index} className="my-8">
            <div className="relative overflow-hidden rounded-xl shadow-lg max-w-lg mx-auto bg-white">
              <iframe
                src={embedUrl}
                className="w-full border-0"
                style={{ minHeight: '520px' }}
                loading="lazy"
                title={caption || 'Instagram'}
              />
            </div>
            {caption && (
              <figcaption className="text-sm text-gray-500 mt-3 text-center italic">{caption}</figcaption>
            )}
          </figure>
        );
      }

      if (eb.embed_type === 'youtube' && eb.url) {
        let videoId = '';
        const match = eb.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
        if (match) videoId = match[1];

        return (
          <figure key={eb.id || index} className="my-8">
            <div className="relative overflow-hidden rounded-xl shadow-lg" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                title={caption || 'YouTube'}
              />
            </div>
            {caption && (
              <figcaption className="text-sm text-gray-500 mt-3 text-center italic">{caption}</figcaption>
            )}
          </figure>
        );
      }

      return null;
    }
    default:
      return null;
  }
};
