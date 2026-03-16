import { supabase } from '../lib/supabase';
import { withTimeout } from './withTimeout';
import { compressImage } from './compressImage';

const DEFAULT_BUCKET = 'service-images';
const DEFAULT_TIMEOUT_MS = 30000; // 30s — more forgiving for mobile connections

// Extensions that browsers can't display — force to jpg
const NON_WEB_EXTS = new Set(['heic', 'heif', 'tiff', 'tif', 'bmp']);
// MIME types that browsers can't display
const NON_WEB_MIMES = new Set([
  'image/heic', 'image/heif',
  'image/heic-sequence', 'image/heif-sequence',
  'image/tiff', 'image/bmp', 'image/x-ms-bmp',
]);

function inferExtension(file: File): string {
  let ext = file.name.split('.').pop()?.trim().toLowerCase();

  // If no extension found from filename, infer from MIME
  if (!ext || ext === file.name.toLowerCase()) {
    const mimeExt = file.type?.split('/')?.[1]?.toLowerCase();
    ext = mimeExt || 'jpg';
  }

  if (ext === 'jpeg') return 'jpg';

  // Non-web extensions → force jpg (safety net if compressImage didn't convert)
  if (NON_WEB_EXTS.has(ext)) return 'jpg';

  return ext;
}

function sanitizeContentType(type: string | undefined): string {
  if (!type) return 'image/jpeg';
  const lower = type.toLowerCase();
  if (NON_WEB_MIMES.has(lower)) return 'image/jpeg';
  // Files with wrong or generic MIME (e.g. application/octet-stream) → force JPEG
  if (!lower.startsWith('image/')) return 'image/jpeg';
  return type;
}

export async function uploadPublicImage(params: {
  file: File;
  folder: string;
  bucket?: string;
  timeoutMs?: number;
  maxDimension?: number;
  quality?: number;
}): Promise<{ publicUrl: string; path: string }> {
  const bucket = params.bucket ?? DEFAULT_BUCKET;
  const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // Compress/resize before upload (also converts HEIC/HEIF → JPEG/WebP)
  const compressed = await compressImage(params.file, {
    maxDimension: params.maxDimension,
    quality: params.quality,
  });

  const ext = inferExtension(compressed);
  const contentType = sanitizeContentType(compressed.type);
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const path = `${params.folder}/${fileName}`;

  console.log('[upload] file:', compressed.name, 'type:', compressed.type, '→ contentType:', contentType, 'ext:', ext, 'size:', compressed.size);

  const { error: uploadError } = await withTimeout(
    supabase.storage.from(bucket).upload(path, compressed, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    }),
    timeoutMs,
    'Upload trwa zbyt długo. Sprawdź połączenie internetowe i spróbuj ponownie.'
  );

  if (uploadError) {
    console.error('[upload] error:', uploadError.message, 'path:', path, 'size:', compressed.size);
    throw uploadError;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error('Nie udało się uzyskać URL zdjęcia');
  }

  return { publicUrl: data.publicUrl, path };
}
