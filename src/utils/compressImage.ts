const MAX_DIMENSION = 1920;
const QUALITY = 0.82;

export async function compressImage(
  file: File,
  options?: {
    maxDimension?: number;
    quality?: number;
  }
): Promise<File> {
  // Skip non-image or vector files
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  const maxDim = options?.maxDimension ?? MAX_DIMENSION;
  const quality = options?.quality ?? QUALITY;

  return new Promise<File>((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if exceeds max dimension
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Try WebP first, fall back to JPEG
      const tryFormat = (format: string, q: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              if (format === 'image/webp') {
                // WebP not supported — fall back to JPEG
                tryFormat('image/jpeg', q);
                return;
              }
              resolve(file);
              return;
            }

            // Only use compressed version if it's actually smaller
            if (blob.size >= file.size) {
              resolve(file);
              return;
            }

            const ext = format === 'image/webp' ? 'webp' : 'jpg';
            const newName = file.name.replace(/\.[^.]+$/, `.${ext}`);
            resolve(new File([blob], newName, { type: format }));
          },
          format,
          q
        );
      };

      tryFormat('image/webp', quality);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}
