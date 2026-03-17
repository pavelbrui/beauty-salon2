import React, { ImgHTMLAttributes } from 'react';

interface ImageWithAltProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Fallback alt text if not provided */
  defaultAlt?: string;
  /** Optional loading strategy for performance */
  loading?: 'lazy' | 'eager';
}

/**
 * Image component with enhanced SEO support.
 * Ensures all images have descriptive alt text and supports lazy loading.
 * 
 * Usage:
 * <ImageWithAlt 
 *   src="/path/to/image.jpg"
 *   alt="Makijaż permanentny brwi Białystok - efekt zabiegu"
 *   loading="lazy"
 * />
 */
export const ImageWithAlt: React.FC<ImageWithAltProps> = ({
  alt,
  defaultAlt = 'Salon Kosmetyczny Katarzyna Brui',
  loading = 'lazy',
  ...props
}) => {
  const finalAlt = alt || defaultAlt;

  return (
    <img
      {...props}
      alt={finalAlt}
      loading={loading}
    />
  );
};

export default ImageWithAlt;
