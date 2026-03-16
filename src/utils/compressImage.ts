const MAX_DIMENSION = 1920;
const QUALITY = 0.82;
const IMAGE_LOAD_TIMEOUT_MS = 30000; // 30s safety net

// Formats that most browsers can't display — MUST be converted to JPEG/WebP
const NON_WEB_TYPES = new Set([
  'image/heic', 'image/heif',
  'image/heic-sequence', 'image/heif-sequence',
  'image/tiff', 'image/bmp', 'image/x-ms-bmp',
]);
const NON_WEB_EXTS = new Set(['heic', 'heif', 'tiff', 'tif', 'bmp']);

function isNonWebFormat(file: File): boolean {
  if (file.type && NON_WEB_TYPES.has(file.type.toLowerCase())) return true;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ext ? NON_WEB_EXTS.has(ext) : false;
}

export async function compressImage(
  file: File,
  options?: {
    maxDimension?: number;
    quality?: number;
  }
): Promise<File> {
  // Skip SVG files
  if (file.type === 'image/svg+xml') return file;

  // Skip files that are explicitly non-image (but still process empty type —
  // iOS Safari sometimes provides files with empty MIME type)
  if (file.type && !file.type.startsWith('image/')) return file;

  const maxDim = options?.maxDimension ?? MAX_DIMENSION;
  const quality = options?.quality ?? QUALITY;
  const mustConvert = isNonWebFormat(file);

  return new Promise<File>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    // Safety timeout — if Image never fires onload/onerror (e.g. very large
    // or unusual files), we don't want the upload to hang forever.
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(url);
      console.warn('[compressImage] timeout loading image, using original file:', file.name, file.type, file.size);
      if (mustConvert) {
        reject(new Error(
          'Przetwarzanie obrazu trwa zbyt długo. Spróbuj zmniejszyć rozmiar zdjęcia lub zapisać jako JPG.'
        ));
      } else {
        resolve(file);
      }
    }, IMAGE_LOAD_TIMEOUT_MS);

    img.onload = () => {
      clearTimeout(timeout);
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
        if (mustConvert) {
          reject(new Error('Nie udało się przetworzyć obrazu. Spróbuj zapisać jako JPG i wgrać ponownie.'));
        } else {
          resolve(file);
        }
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Try WebP first, fall back to JPEG
      const tryFormat = (format: string, q: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              if (format === 'image/webp') {
                // WebP not supported (e.g. older iOS Safari) — fall back to JPEG
                tryFormat('image/jpeg', q);
                return;
              }
              // JPEG also failed
              if (mustConvert) {
                reject(new Error('Nie udało się przekonwertować obrazu. Spróbuj zapisać jako JPG.'));
              } else {
                resolve(file);
              }
              return;
            }

            // For non-web formats (HEIC, HEIF, TIFF, BMP) ALWAYS use converted
            // version — even if larger — because browsers can't display originals.
            // For web formats, only use compressed if actually smaller.
            if (blob.size >= file.size && !mustConvert) {
              // WebP was larger — try JPEG as well before giving up
              if (format === 'image/webp') {
                tryFormat('image/jpeg', q);
                return;
              }
              // Both WebP and JPEG are larger — use original
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
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      console.warn('[compressImage] image load error:', file.name, file.type, file.size);
      if (mustConvert) {
        const formatHint = file.type || file.name.split('.').pop()?.toUpperCase() || 'nieznany';
        reject(new Error(
          `Format ${formatHint} nie jest obsługiwany przez przeglądarkę. ` +
          'Spróbuj zapisać zdjęcie jako JPG lub PNG i wgrać ponownie.'
        ));
      } else {
        resolve(file);
      }
    };

    img.src = url;
  });
}
