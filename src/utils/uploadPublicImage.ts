import { supabase } from '../lib/supabase';
import { withTimeout } from './withTimeout';
import { compressImage } from './compressImage';

const DEFAULT_BUCKET = 'service-images';
const DEFAULT_TIMEOUT_MS = 20000;

function inferExtension(file: File): string {
  const fromName = file.name.split('.').pop()?.trim().toLowerCase();
  if (fromName && fromName !== file.name.toLowerCase()) return fromName;

  const mimeExt = file.type?.split('/')?.[1]?.toLowerCase();
  if (!mimeExt) return 'bin';
  if (mimeExt === 'jpeg') return 'jpg';
  return mimeExt;
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

  // Compress/resize before upload
  const compressed = await compressImage(params.file, {
    maxDimension: params.maxDimension,
    quality: params.quality,
  });

  const ext = inferExtension(compressed);
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const path = `${params.folder}/${fileName}`;

  const { error: uploadError } = await withTimeout(
    supabase.storage.from(bucket).upload(path, compressed, {
      contentType: compressed.type || undefined,
      cacheControl: '3600',
      upsert: false,
    }),
    timeoutMs,
    'Upload timed out'
  );

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error('Failed to get public URL');
  }

  return { publicUrl: data.publicUrl, path };
}

