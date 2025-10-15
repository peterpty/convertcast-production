'use client';

// MINIMAL MOBILE TEST PAGE
// Purpose: Test if mobile can load WITHOUT all the advanced hooks

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import MuxPlayer from '@mux/mux-player-react';

export default function MinimalTestPage() {
  const params = useParams();
  const streamId = params.id as string;
  const [stream, setStream] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStream() {
      try {
        const { data, error } = await supabase
          .from('streams')
          .select('*')
          .eq('mux_playback_id', streamId)
          .single();

        if (data) {
          setStream(data);
        }
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    }

    loadStream();
  }, [streamId]);

  if (loading) {
    return <div style={{ padding: '20px', color: 'white' }}>Loading...</div>;
  }

  if (!stream) {
    return <div style={{ padding: '20px', color: 'white' }}>Stream not found</div>;
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh' }}>
      <h1 style={{ color: 'white', padding: '20px' }}>MINIMAL TEST - {stream.mux_playback_id}</h1>

      {stream.mux_playback_id ? (
        <MuxPlayer
          streamType="live"
          playbackId={stream.mux_playback_id}
          autoPlay="muted"
          muted={true}
          style={{ width: '100%', maxHeight: '80vh' }}
        />
      ) : (
        <div style={{ color: 'white', padding: '20px' }}>No playback ID</div>
      )}

      <div style={{ color: 'white', padding: '20px' }}>
        <p>If you see this, mobile CAN load the page!</p>
        <p>Stream ID: {stream.id}</p>
      </div>
    </div>
  );
}
