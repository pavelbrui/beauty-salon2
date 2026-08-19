import React from 'react';

interface DeferredSectionProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  rootMargin?: string;
  className?: string;
  id?: string;
}

/**
 * Delays mounting expensive content until it approaches the viewport.
 * This prevents off-screen maps, analytics-dependent widgets and image lists
 * from competing with the first render on mobile devices.
 */
export const DeferredSection: React.FC<DeferredSectionProps> = ({
  children,
  fallback,
  rootMargin = '300px 0px',
  className,
  id,
}) => {
  const markerRef = React.useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = React.useState(false);

  React.useEffect(() => {
    const marker = markerRef.current;
    if (!marker || shouldRender) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(marker);
    return () => observer.disconnect();
  }, [rootMargin, shouldRender]);

  return (
    <div ref={markerRef} id={id} className={className}>
      {shouldRender ? children : fallback}
    </div>
  );
};
