import { supabase } from '../lib/supabase';
import { withTimeout } from './withTimeout';

const DEFAULT_BUCKET = 'service-images';
const DEFAULT_TIMEOUT_MS = 90_000; // 90s — video files are larger

const ALLOWED_VIDEO_TYPES = new Set(['video/mp4']);
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB

export async function uploadVideo(params: {
  file: File;
  folder: string;
  bucket?: string;
  timeoutMs?: number;
}): Promise<{ publicUrl: string; path: string }> {
  const bucket = params.bucket ?? DEFAULT_BUCKET;
  const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  if (!ALLOWED_VIDEO_TYPES.has(params.file.type)) {
    throw new Error('Dozwolony format: MP4 (H.264)');
  }

  if (params.file.size > MAX_VIDEO_SIZE) {
    throw new Error('Plik wideo nie może przekraczać 20 MB');
  }

  const fileName = `${Date.now()}-${crypto.randomUUID()}.mp4`;
  const path = `${params.folder}/${fileName}`;

  const { error: uploadError } = await withTimeout(
    supabase.storage.from(bucket).upload(path, params.file, {
      contentType: 'video/mp4',
      cacheControl: '86400',
      upsert: false,
    }),
    timeoutMs,
    'Upload wideo trwa zbyt długo. Sprawdź połączenie internetowe i spróbuj ponownie.',
  );

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error('Nie udało się uzyskać URL wideo');
  }

  return { publicUrl: data.publicUrl, path };
}
