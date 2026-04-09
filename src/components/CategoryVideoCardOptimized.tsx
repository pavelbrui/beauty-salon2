import React, { useRef, useState, useEffect, useCallback } from 'react';

interface CategoryVideoCardOptimizedProps {
  displayName: string;
  count: number;
  image: string;
  videoUrl?: string | null;
  servicesCountLabel: string;
  ctaLabel: string;
  onClick: () => void;
  poster?: string;
  imgLoading?: 'eager' | 'lazy';
  /** Optional custom alt text for the image */
  customAlt?: string;
}

/**
 * Optimized Category Video Card component with enhanced SEO and accessibility.
 * 
 * Features:
 * - Descriptive alt text for images
 * - Lazy loading support
 * - Responsive image dimensions
 * - Proper semantic HTML with article tag
 * - Video accessibility improvements
 * - Better image metadata
 * 
 * Improvements over original:
 * - Better alt text that describes the category
 * - Explicit width/height for layout shift prevention
 * - Custom alt text support
 * - Improved accessibility with proper ARIA labels
 * - Semantic article wrapper
 */
export const CategoryVideoCardOptimized: React.FC<CategoryVideoCardOptimizedProps> = ({
  displayName,
  count,
  image,
  videoUrl,
  servicesCountLabel,
  ctaLabel,
  onClick,
  poster,
  imgLoading = 'lazy',
  customAlt,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLButtonElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  // Lazy-mount the <video> element client-side only. Keeps it out of the prerendered HTML
  // so Google Video Indexer does not flag listing pages as non-watch pages hosting these videos.
  const [videoMounted, setVideoMounted] = useState(false);
  // If the video fails to load/play (error, stall, hover-play timeout), unmount it and
  // fall back to the static image so the card never shows a blank/black frame.
  const [videoFailed, setVideoFailed] = useState(false);
  const playTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    setVideoMounted(true);
  }, []);

  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
    if (el) {
      el.muted = true;
    }
  }, []);

  const clearPlayTimeout = useCallback(() => {
    if (playTimeoutRef.current !== null) {
      window.clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlaying = () => {
      clearPlayTimeout();
      setIsPlaying(true);
    };
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      console.warn('Video error:', video.error?.message, videoUrl);
      clearPlayTimeout();
      setIsPlaying(false);
      setVideoFailed(true);
    };
    const onStalled = () => setIsPlaying(false);

    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('error', onError);
    video.addEventListener('stalled', onStalled);
    video.addEventListener('waiting', onStalled);
    return () => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('error', onError);
      video.removeEventListener('stalled', onStalled);
      video.removeEventListener('waiting', onStalled);
    };
  }, [videoUrl, videoMounted, clearPlayTimeout]);

  const tryPlay = useCallback(
    (video: HTMLVideoElement) => {
      video.muted = true;
      clearPlayTimeout();
      // Give the video up to 1.5s to actually start playing; otherwise fall back to image.
      playTimeoutRef.current = window.setTimeout(() => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.readyState < 3) {
          setVideoFailed(true);
        }
      }, 1500);
      video.play().catch((e) => {
        console.warn('Video play blocked:', e.name, e.message);
        clearPlayTimeout();
        setVideoFailed(true);
      });
    },
    [clearPlayTimeout],
  );

  const handleMouseEnter = useCallback(() => {
    if (isTouchDevice || !videoUrl || videoFailed || !videoRef.current) return;
    setIsHovering(true);
    tryPlay(videoRef.current);
  }, [isTouchDevice, videoUrl, videoFailed, tryPlay]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    clearPlayTimeout();
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  }, [clearPlayTimeout]);

  useEffect(() => {
    return () => clearPlayTimeout();
  }, [clearPlayTimeout]);

  useEffect(() => {
    if (!isTouchDevice || !videoUrl || videoFailed || !cardRef.current) return;

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
  }, [isTouchDevice, videoUrl, videoFailed, tryPlay]);

  const showVideo = !videoFailed && isPlaying && (isHovering || isTouchDevice);

  // Generate SEO-friendly alt text
  const generateAltText = (): string => {
    if (customAlt) return customAlt;
    return `${displayName} – zabiegi kosmetyczne w Białymstoku – ${count} usług`;
  };

  const altText = generateAltText();

  return (
    <article>
      <button
        ref={cardRef}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group relative rounded-2xl overflow-hidden h-64 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 w-full"
        aria-label={`${displayName} – ${count} ${servicesCountLabel}`}
      >
        {/* Static image (base layer) */}
        <img
          src={image}
          alt={altText}
          loading={imgLoading}
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${
            !showVideo ? 'group-hover:scale-110' : ''
          }`}
          width={600}
          height={400}
          decoding="async"
        />

        {/* Video overlay */}
        {videoUrl && videoMounted && !videoFailed && (
          <video
            ref={setVideoRef}
            src={videoUrl}
            poster={poster || image}
            muted
            loop
            playsInline
            preload="metadata"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              showVideo ? 'opacity-100' : 'opacity-0'
            }`}
            aria-label={`Wideo: ${displayName}`}
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
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </button>
    </article>
  );
};

export default CategoryVideoCardOptimized;
