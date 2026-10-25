import React, { useEffect, useRef } from 'react';

const isHls = url => /\.m3u8(?:[?#]|$)/i.test(url || '');

// Pemutar langsung (mp4/webm/m3u8). m3u8 diputar lewat hls.js bila browser tidak mendukung HLS native.
export const DirectPlayer = ({ url, onError }) => {
  const ref = useRef(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || !isHls(url)) return undefined;
    if (video.canPlayType('application/vnd.apple.mpegurl')) { video.src = url; return undefined; }
    let hls;
    let cancelled = false;
    import('hls.js').then(({ default: Hls }) => {
      if (cancelled) return;
      if (!Hls.isSupported()) { onError?.('Browser ini tidak mendukung streaming HLS.'); return; }
      hls = new Hls({ enableWorker: true });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, d) => { if (d.fatal) onError?.('Stream HLS gagal dimuat. Coba server lain.'); });
    }).catch(() => onError?.('Modul pemutar HLS belum terpasang. Jalankan npm install.'));
    return () => { cancelled = true; hls?.destroy(); };
  }, [url, onError]);

  return (
    <video ref={ref} className="absolute inset-0 h-full w-full bg-black" controls playsInline preload="metadata"
      referrerPolicy="no-referrer" controlsList="nodownload"
      src={isHls(url) ? undefined : url}
      onError={() => { if (!isHls(url)) onError?.('Video tidak dapat diputar oleh browser ini. Coba server lain.'); }} />
  );
};

// Pemutar embed tanpa sandbox supaya semua server bisa diputar.
export const EmbedPlayer = ({ url }) => (
  <iframe key={url} src={url} title="Player"
    className="absolute inset-0 h-full w-full" style={{ border: 'none' }}
    allowFullScreen allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
    referrerPolicy="no-referrer" />
);
