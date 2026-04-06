import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useLocalizedNavigate } from '../hooks/useLocalizedPath';
import { Service } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { getServiceName, getServiceDescription } from '../utils/serviceTranslation';

interface ServiceCardOptimizedProps {
  service: Service;
  imgLoading?: 'eager' | 'lazy';
  /** Optional image width for responsive images */
  imgWidth?: number;
  /** Optional image height for responsive images */
  imgHeight?: number;
  /** Optional custom alt text */
  customAlt?: string;
}

export const ServiceCardOptimized: React.FC<ServiceCardOptimizedProps> = ({
  service,
  imgLoading = 'lazy',
  imgWidth = 400,
  imgHeight = 192,
  customAlt,
}) => {
  const navigate = useLocalizedNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const videoUrl = service.videoUrl;

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const setVideoRefCb = useCallback((el: HTMLVideoElement | null) => {
    (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
    if (el) el.muted = true;
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlaying = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => setIsPlaying(false);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('error', onError);
    return () => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('error', onError);
    };
  }, [videoUrl]);

  const tryPlay = useCallback((video: HTMLVideoElement) => {
    video.muted = true;
    video.play().catch(() => {});
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (isTouchDevice || !videoUrl || !videoRef.current) return;
    setIsHovering(true);
    tryPlay(videoRef.current);
  }, [isTouchDevice, videoUrl, tryPlay]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  }, []);

  // Auto-play on scroll for touch devices
  useEffect(() => {
    if (!isTouchDevice || !videoUrl || !cardRef.current) return;
    const el = cardRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && videoRef.current) {
          tryPlay(videoRef.current);
        } else {
          videoRef.current?.pause();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isTouchDevice, videoUrl, tryPlay]);

  const showVideo = videoUrl && isPlaying && (isHovering || isTouchDevice);

  const formatPrice = (price: number) => {
    return `${(price / 100).toFixed(0)} PLN`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0
      ? `${hours}h ${mins > 0 ? `${mins}min` : ''}`
      : `${mins}min`;
  };

  const generateAltText = (): string => {
    if (customAlt) return customAlt;
    const serviceName = getServiceName(service, language);
    return `${serviceName} – KATARZYNA BRUI Salon urody  Białystok – efekt zabiegu`;
  };

  const altText = generateAltText();

  return (
    <article
      ref={cardRef}
      className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition-transform duration-300"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {service.imageUrl && (
        <div className="relative h-48 overflow-hidden bg-gray-200">
          <img
            src={service.imageUrl}
            alt={altText}
            loading={imgLoading}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${
              !showVideo ? 'hover:scale-110' : ''
            }`}
            width={imgWidth}
            height={imgHeight}
            decoding="async"
          />
          {videoUrl && (
            <video
              ref={setVideoRefCb}
              src={videoUrl}
              poster={service.imageUrl}
              muted
              loop
              playsInline
              preload="metadata"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                showVideo ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}
      <div className="p-8">
        <h3 className="text-xl font-semibold text-gray-900">
          {getServiceName(service, language)}
        </h3>
        <div className="mt-2 flex justify-between items-center">
          <span className="text-2xl font-bold text-amber-600" aria-label={`Cena: ${formatPrice(service.price)}`}>
            {formatPrice(service.price)}
          </span>
          <span className="text-sm text-gray-500" aria-label={`Czas zabiegu: ${formatDuration(service.duration)}`}>
            {formatDuration(service.duration)}
          </span>
        </div>
        {service.description && (
          <p className="mt-4 text-gray-600">
            {getServiceDescription(service, language)}
          </p>
        )}
        <button
          onClick={() => navigate(`/booking/${service.id}`)}
          className="mt-6 w-full bg-amber-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-amber-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          aria-label={`Zarezerwuj ${getServiceName(service, language)}`}
        >
          {t.bookNow}
        </button>
      </div>
    </article>
  );
};

export default ServiceCardOptimized;
