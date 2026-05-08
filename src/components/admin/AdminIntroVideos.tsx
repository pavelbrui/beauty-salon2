import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { uploadVideo } from '../../utils/uploadVideo';

interface IntroVideo {
  id: string;
  video_url: string;
  title: string | null;
  sort_order: number;
  is_active: boolean;
}

export const AdminIntroVideos: React.FC = () => {
  const [videos, setVideos] = useState<IntroVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('intro_videos')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading intro videos:', error);
    } else if (data) {
      setVideos(data);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { publicUrl } = await uploadVideo({
        file,
        folder: 'intro-videos',
      });

      const maxOrder = videos.length > 0 
        ? Math.max(...videos.map(v => v.sort_order)) 
        : 0;

      const { data, error } = await supabase
        .from('intro_videos')
        .insert({
          video_url: publicUrl,
          title: file.name.split('.')[0],
          sort_order: maxOrder + 10,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      if (data) setVideos(prev => [...prev, data]);
    } catch (err) {
      console.error('Upload error:', err);
      alert(err instanceof Error ? err.message : 'Błąd podczas wysyłania wideo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleToggleActive = async (video: IntroVideo) => {
    const { error } = await supabase
      .from('intro_videos')
      .update({ is_active: !video.is_active })
      .eq('id', video.id);

    if (error) {
      console.error('Error toggling active:', error);
    } else {
      setVideos(prev => prev.map(v => v.id === video.id ? { ...v, is_active: !v.is_active } : v));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć to wideo?')) return;

    const { error } = await supabase
      .from('intro_videos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting video:', error);
    } else {
      setVideos(prev => prev.filter(v => v.id !== id));
    }
  };

  const handleSortChange = (id: string, value: number) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, sort_order: value } : v));
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      for (const video of videos) {
        await supabase
          .from('intro_videos')
          .update({ sort_order: video.sort_order })
          .eq('id', video.id);
      }
      await loadVideos();
    } catch (err) {
      console.error('Save order error:', err);
    } finally {
      setSaving(false);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newVideos = [...videos];
    const temp = newVideos[index - 1].sort_order;
    newVideos[index - 1].sort_order = newVideos[index].sort_order;
    newVideos[index].sort_order = temp;
    setVideos(newVideos.sort((a, b) => a.sort_order - b.sort_order));
  };

  const moveDown = (index: number) => {
    if (index >= videos.length - 1) return;
    const newVideos = [...videos];
    const temp = newVideos[index + 1].sort_order;
    newVideos[index + 1].sort_order = newVideos[index].sort_order;
    newVideos[index].sort_order = temp;
    setVideos(newVideos.sort((a, b) => a.sort_order - b.sort_order));
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Intro Wideo (Sekwencja)</h3>
          <p className="text-xs text-gray-500">Filmy będą odtwarzane jeden po drugim wg kolejności.</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || videos.length >= 10}
            className="bg-white border border-gray-300 text-gray-700 text-sm px-4 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {uploading ? 'Wysyłanie...' : '+ Dodaj wideo'}
          </button>
          <button
            onClick={saveOrder}
            disabled={saving || videos.length === 0}
            className="bg-amber-500 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Zapisywanie...' : 'Zapisz kolejność'}
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        ) : videos.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Brak filmów intro. Dodaj pierwszy film, aby zacząć.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {videos.map((video, idx) => (
              <li key={video.id} className={`px-6 py-4 hover:bg-gray-50 ${!video.is_active ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-black flex-shrink-0">
                    <video
                      src={video.video_url}
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <span className="text-white text-xs font-bold">{idx + 1}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {video.title || 'Bez tytułu'}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">{video.video_url}</p>
                    <div className="mt-2 flex items-center gap-4">
                      <button
                        onClick={() => handleToggleActive(video)}
                        className={`text-xs font-medium ${video.is_active ? 'text-green-600' : 'text-gray-400'}`}
                      >
                        {video.is_active ? 'Aktywne' : 'Nieaktywne'}
                      </button>
                      <button
                        onClick={() => handleDelete(video.id)}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Usuń
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveUp(idx)}
                      disabled={idx === 0}
                      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveDown(idx)}
                      disabled={idx === videos.length - 1}
                      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <input
                      type="number"
                      value={video.sort_order}
                      onChange={(e) => handleSortChange(video.id, parseInt(e.target.value) || 0)}
                      className="w-16 text-sm text-center border border-gray-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
