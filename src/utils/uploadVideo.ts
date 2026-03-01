import { supabase } from '../lib/supabase';
import { withTimeout } from './withTimeout';

const DEFAULT_BUCKET = 'service-images';
const DEFAULT_TIMEOUT_MS = 90_000; // 90s — video files are larger

// Accepted MIME types
const ALLOWED_MIME_TYPES = new Set([
  'video/mp4',
  'video/quicktime',      // .mov (iPhone HEVC / H.264)
  'video/webm',
  'video/x-m4v',          // .m4v (Apple)
]);

// Fallback: accept by extension if MIME type is missing/wrong (common on mobile)
const ALLOWED_EXTENSIONS = new Set(['mp4', 'mov', 'webm', 'm4v']);

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

function getExtension(file: File): string {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext && ALLOWED_EXTENSIONS.has(ext)) return ext;
  if (file.type === 'video/quicktime') return 'mov';
  if (file.type === 'video/webm') return 'webm';
  return 'mp4';
}

function getContentType(file: File, ext: string): string {
  if (file.type && ALLOWED_MIME_TYPES.has(file.type)) return file.type;
  const map: Record<string, string> = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    m4v: 'video/x-m4v',
  };
  return map[ext] || 'video/mp4';
}

export async function uploadVideo(params: {
  file: File;
  folder: string;
  bucket?: string;
  timeoutMs?: number;
}): Promise<{ publicUrl: string; path: string }> {
  const bucket = params.bucket ?? DEFAULT_BUCKET;
  const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const fileExt = params.file.name.split('.').pop()?.toLowerCase() || '';
  const hasMime = ALLOWED_MIME_TYPES.has(params.file.type);
  const hasExt = ALLOWED_EXTENSIONS.has(fileExt);

  // Accept if MIME type OR file extension matches
  if (!hasMime && !hasExt) {
    throw new Error('Dozwolone formaty: MP4, MOV (iPhone), WebM');
  }

  if (params.file.size > MAX_VIDEO_SIZE) {
    throw new Error('Plik wideo nie może przekraczać 50 MB');
  }

  const ext = getExtension(params.file);
  const contentType = getContentType(params.file, ext);
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const path = `${params.folder}/${fileName}`;

  const { error: uploadError } = await withTimeout(
    supabase.storage.from(bucket).upload(path, params.file, {
      contentType,
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
