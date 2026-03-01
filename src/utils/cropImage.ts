export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Crops an image to the specified pixel area using Canvas API.
 * Returns a new File containing only the cropped region.
 */
export function cropImageFile(
  imageSrc: string,
  cropPixels: CropArea,
  originalFileName: string
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = cropPixels.width;
      canvas.height = cropPixels.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context not available'));
        return;
      }

      ctx.drawImage(
        img,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        cropPixels.width,
        cropPixels.height
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob from cropped image'));
            return;
          }
          const croppedFile = new File([blob], originalFileName, {
            type: 'image/jpeg',
          });
          resolve(croppedFile);
        },
        'image/jpeg',
        0.95
      );
    };
    img.onerror = () => reject(new Error('Failed to load image for cropping'));
    img.src = imageSrc;
  });
}
