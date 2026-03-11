import React, { useRef, useState, useEffect, useCallback } from 'react';

interface CategoryVideoCardProps {
  displayName: string;
  count: number;
  image: string;
  videoUrl?: string | null;
  servicesCountLabel: string;
  ctaLabel: string;
  onClick: () => void;
  imgLoading?: 'eager' | 'lazy';
}

export const CategoryVideoCard: React.FC<CategoryVideoCardProps> = ({
  displayName,
  count,
  image,
  videoUrl,
  servicesCountLabel,
  ctaLabel,
  onClick,
  imgLoading = 'lazy',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLButtonElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Fix React bug: muted attribute not properly set via JSX
  // Must set via ref, otherwise Chrome blocks autoplay
  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
    if (el) {
      el.muted = true;
    }
  }, []);

  // Listen for video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlaying = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      console.warn('Video error:', video.error?.message, videoUrl);
      setIsPlaying(false);
    };

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
    // Ensure muted is set (React bug workaround)
    video.muted = true;
    video.play().catch((e) => {
      console.warn('Video play blocked:', e.name, e.message);
    });
  }, []);

  // Desktop hover
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

  // Mobile: IntersectionObserver autoplay
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

  const showVideo = isPlaying && (isHovering || isTouchDevice);

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative rounded-2xl overflow-hidden h-64 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
    >
      {/* Static image (base layer) */}
      <img
        src={image}
        alt={displayName}
        loading={imgLoading}
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${
          !showVideo ? 'group-hover:scale-110' : ''
        }`}
        width={600}
        height={400}
      />

      {/* Video overlay */}
      {videoUrl && (
        <video
          ref={setVideoRef}
          src={videoUrl}
          poster={image}
          muted
          loop
          playsInline
          preload="metadata"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            showVideo ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-all duration-300 group-hover:from-black/80" />

      {/* Text content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 text-left">
        <h3 className="text-xl font-bold text-white mb-1">{displayName}</h3>
        <p className="text-white/70 text-sm mb-3">
          {count} {servicesCountLabel}
        </p>
        <span className="inline-flex items-center text-amber-400 text-sm font-medium transition-transform duration-300 group-hover:translate-x-1">
          {ctaLabel}
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </button>
  );
};
