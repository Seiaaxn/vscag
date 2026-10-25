import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ContentGrid from '../components/ContentGrid';

const API = '/nk-api';
const proxyImg = url => url ? `/nk-api/img?url=${encodeURIComponent(url)}` : null;

const RelatedRow = ({ title, items }) => {
  if (!items?.length) return null;
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-black uppercase tracking-widest text-white">{title}</h2>
        <span className="text-[9px] font-bold text-white/25">{items.length} item</span>
      </div>
      <ContentGrid items={items} />
    </section>
  );
};

const Watch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id') || searchParams.get('slug');

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [activeServer, setActiveServer] = useState(0);

  useEffect(() => {
    if (!id) return;
    window.scrollTo(0, 0);
    setLoading(true); setData(null); setError(null);
    fetch(`${API}/detail/${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(res => { if (res.error) throw new Error(res.error); setData(res.data); setActiveServer(0); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const allStreams = data?.streams || [];
  const directStreams = allStreams.filter(stream =>
    stream.kind === 'direct' || /\.(?:mp4|m3u8)(?:[?#]|$)/i.test(stream.url || '')
  );
  const iframeStreams = data?.embeds || allStreams.filter(stream => stream.kind === 'embed');
  // Prioritas sumber mengikuti API referensi: direct media lebih dulu, iframe sebagai fallback.
  const serverList = directStreams.length > 0 ? directStreams : iframeStreams;
  const activeStream = serverList[activeServer] || null;
  const serverGridClass = serverList.length <= 1 ? 'grid-cols-1' : serverList.length === 3 ? 'grid-cols-3' : 'grid-cols-2';
  const streamUrl = activeStream?.url || null;
  const isDirectVideo = Boolean(activeStream && (
    activeStream.kind === 'direct' || /\.(?:mp4|m3u8)(?:[?#]|$)/i.test(activeStream.url || '')
  ));

  return (
    <div className="min-h-screen bg-[#0a0a0c] pb-24">
      <style>{`
        @keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}}
        body,html{background:#0a0a0c!important;color:white;margin:0;padding:0}
      `}</style>
      <Navbar />

      <div className="pt-16 max-w-2xl mx-auto">
        {/* Player */}
        <div className="w-full aspect-video bg-black relative overflow-hidden border-b border-white/5">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-7 h-7 border-2 border-[#F6CF80]/30 border-t-[#F6CF80] rounded-full animate-spin" />
            </div>
          )}
          {!loading && streamUrl && isDirectVideo && (
            <video key={streamUrl} src={streamUrl} className="absolute inset-0 w-full h-full"
              controls playsInline preload="metadata" style={{ border:'none' }}
              onError={() => setError('Direct video tidak dapat diputar oleh browser ini.')} />
          )}
          {!loading && streamUrl && !isDirectVideo && (
            <iframe key={streamUrl} src={streamUrl} className="absolute inset-0 w-full h-full"
              allowFullScreen allow="autoplay; fullscreen" style={{ border:'none' }} />
          )}
          {!loading && !streamUrl && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
              <span className="text-4xl opacity-20">🐱</span>
              <span className="text-white/50 text-xs font-bold">
                {iframeStreams.length > 0
                  ? 'Memakai iframe dari API karena direct video tidak tersedia.'
                  : 'Tidak ada media yang tersedia dari API.'}
              </span>
            </div>
          )}
        </div>

        <div className="px-4 py-4">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs font-bold mb-4 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Kembali
          </button>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
              <p className="text-red-400 text-xs font-bold">{error}</p>
            </div>
          )}

          {data && (
            <>
              {/* Header info */}
              <div className="flex gap-3 mb-4">
                {data.image && (
                  <img src={proxyImg(data.image)}
                    onError={e => { e.target.style.display='none'; }}
                    className="w-20 aspect-video object-cover rounded-lg shrink-0" />
                )}
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm">18+</span>
                    {data.episode && (
                      <span className="bg-[#F6CF80]/10 text-[#F6CF80] text-[8px] font-black px-1.5 py-0.5 rounded-sm">
                        EP {data.episode}
                      </span>
                    )}
                    {data.score && (
                      <span className="bg-white/5 text-white/50 text-[8px] font-black px-1.5 py-0.5 rounded-sm">
                        ★ {data.score}
                      </span>
                    )}
                    {data.status && (
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-sm
                        ${data.status === 'Ongoing' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/40'}`}>
                        {data.status}
                      </span>
                    )}
                  </div>
                  <h1 className="text-white font-black text-sm leading-tight line-clamp-3 mb-1">{data.title}</h1>
                  {data.date && <p className="text-white/30 text-[9px] font-bold">{data.date.slice(0,10)}</p>}
                </div>
              </div>

              {/* Stream note */}
              {data.streamnote && (
                <div className="bg-[#F6CF80]/5 rounded-md px-3 py-2 mb-4">
                  <p className="text-[#F6CF80]/70 text-[10px] font-bold leading-relaxed">{data.streamnote}</p>
                </div>
              )}

              {/* Server selector */}
              {serverList.length > 0 && (
                <div className="mb-5">
                  <span className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-2 block">
                    {directStreams.length > 0 ? 'Direct Video' : 'Server'}
                  </span>
                  <div className={`grid gap-1.5 ${serverGridClass}`}>
                    {serverList.map((s, i) => (
                      <button key={i} onClick={() => setActiveServer(i)}
                        className={`min-w-0 px-2 py-2 text-[10px] font-black rounded-md transition-colors truncate
                          ${activeServer === i
                            ? 'bg-[#F6CF80] text-black'
                            : 'bg-[#16161a] text-white/60 hover:bg-[#202026]'}`}>
                        {s.label || `Stream ${i+1}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta info grid */}
              <div className="bg-[#16161a] rounded-md p-4 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Produser', data.producer],
                    ['Durasi',   data.duration],
                    ['Tayang',   data.tayang],
                    ['Episode',  data.episode],
                    ['Aliases',  data.aliases],
                  ].filter(([,v]) => v).map(([k,v]) => (
                    <div key={k} className="flex flex-col">
                      <span className="text-[9px] font-black text-white/25 uppercase tracking-wide">{k}</span>
                      <span className="text-[10px] font-bold text-white/70 line-clamp-1">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Genre chips */}
              {data.genres?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {data.genres.map((g, i) => (
                    <button key={i}
                      onClick={() => navigate(`/explore?genre_id=${g.id}&genre_name=${encodeURIComponent(g.name)}`)}
                      className="text-[9px] font-bold text-white/50 border border-white/10 px-2 py-1
                        rounded-lg hover:border-[#F6CF80]/40 hover:text-[#F6CF80] transition-all active:scale-95">
                      {g.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Synopsis */}
              {data.synopsis && (
                <div className="bg-[#16161a] rounded-md p-4 mb-4">
                  <span className="text-[10px] font-black text-[#F6CF80] uppercase tracking-widest block mb-2">Sinopsis</span>
                  <p className="text-white/60 text-xs leading-relaxed">{data.synopsis}</p>
                </div>
              )}

              {/* Downloads */}
              {data.downloads?.length > 0 && (
                <details className="group mb-4">
                  <summary className="text-white/30 text-[10px] font-black uppercase tracking-widest
                    cursor-pointer hover:text-white/60 transition-colors list-none flex items-center gap-2 mb-2">
                    <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                    Download ({data.downloads.length} kualitas)
                  </summary>
                  <div className="flex flex-col gap-2 mt-2">
                    {data.downloads.map((dl, i) => (
                      <div key={i} className="bg-[#16161a] border border-white/5 rounded-xl p-3">
                        <span className="text-[#F6CF80] text-[10px] font-black uppercase">{dl.quality}</span>
                        <div className="flex gap-2 flex-wrap mt-1.5">
                          {dl.links?.map((link, j) => (
                            <a key={j} href={link.url} target="_blank" rel="noopener noreferrer"
                              className="text-[9px] font-bold text-white/50 border border-white/10 px-2 py-1
                                rounded-lg hover:border-[#F6CF80]/40 hover:text-[#F6CF80] transition-all">
                              {link.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              <RelatedRow title="Episode" items={data.episodes} />
              <RelatedRow title="Info Lainnya" items={data.related?.info} />
              <RelatedRow title="Hentai Lainnya" items={data.related?.hentai} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Watch;
