import { supabase } from '../lib/supabase';
import { withTimeout } from './withTimeout';

const DEFAULT_BUCKET = 'service-images';
const DEFAULT_TIMEOUT_MS = 90_000; // 90s — video files are larger

// MP4, MOV (iPhone), WebM
const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/quicktime',      // .mov (iPhone)
  'video/webm',
]);

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB — iPhone videos can be larger

function getExtension(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext && ['mp4', 'mov', 'webm'].includes(ext)) return ext;
  if (file.type === 'video/quicktime') return 'mov';
  if (file.type === 'video/webm') return 'webm';
  return 'mp4';
}

export async function uploadVideo(params: {
  file: File;
  folder: string;
  bucket?: string;
  timeoutMs?: number;
}): Promise<{ publicUrl: string; path: string }> {
  const bucket = params.bucket ?? DEFAULT_BUCKET;
  const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  if (!ALLOWED_VIDEO_TYPES.has(params.file.type)) {
    throw new Error('Dozwolone formaty: MP4, MOV (iPhone), WebM');
  }

  if (params.file.size > MAX_VIDEO_SIZE) {
    throw new Error('Plik wideo nie może przekraczać 50 MB');
  }

  const ext = getExtension(params.file);
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const path = `${params.folder}/${fileName}`;

  const { error: uploadError } = await withTimeout(
    supabase.storage.from(bucket).upload(path, params.file, {
      contentType: params.file.type,
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
