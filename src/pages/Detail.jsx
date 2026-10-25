import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ContentGrid from '../components/ContentGrid';
import ErrorState from '../components/ErrorState';
import Logo from '../components/Logo';
import BookmarkButton from '../components/BookmarkButton';
import { apiGet, proxyImg, genrePath } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const Shimmer = () => <div className="absolute inset-0 w-[200%] animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ transform: 'translate3d(-100%,0,0) skewX(-20deg)' }} />;

const DetailSkeleton = () => (
  <div className="mx-auto max-w-3xl px-4 pt-6">
    <div className="glass relative aspect-video overflow-hidden rounded-3xl"><Shimmer /></div>
    <div className="glass relative mt-5 h-6 w-2/3 overflow-hidden rounded-full"><Shimmer /></div>
    <div className="glass relative mt-4 h-24 overflow-hidden rounded-2xl"><Shimmer /></div>
  </div>
);

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { history } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newestFirst, setNewestFirst] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = () => {
    setLoading(true); setError(null); setData(null); setImageError(false); setExpanded(false);
    apiGet(`/detail/${encodeURIComponent(id)}`)
      .then(res => setData(res.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { window.scrollTo(0, 0); load(); /* eslint-disable-next-line */ }, [id]);

  const episodes = useMemo(() => {
    const list = Array.isArray(data?.episodes) ? data.episodes.filter(ep => ep?.id || ep?.slug) : [];
    return newestFirst ? [...list].reverse() : list;
  }, [data, newestFirst]);

  // Episode yang sudah pernah ditonton (hanya terisi kalau login)
  const watched = useMemo(() => new Set(history.map(entry => entry.id)), [history]);
  const hasStream = (data?.streams?.length || 0) > 0;

  // Tombol utama: lanjutkan episode terakhir yang ditonton, kalau belum -> mulai dari awal
  const seriesKey = String(data?.series?.id ?? data?.id ?? '');
  const lastWatched = history.find(entry =>
    entry.seriesId === seriesKey || entry.id === String(data?.id) || (data?.episodes || []).some(ep => String(ep.id) === entry.id));
  const firstTarget = hasStream ? data?.id : (data?.episodes?.[0]?.id ?? null);
  const playTarget = lastWatched?.id || firstTarget;

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { window.prompt('Salin tautan ini:', window.location.href); }
  };
  const goWatch = target => navigate(`/watch?id=${encodeURIComponent(target)}`);
  const bookmarkItem = data && { id: data.series?.id ?? data.id, title: data.series?.title || data.title, image: data.series?.image || data.image };

  return (
    <div className="min-h-screen pb-10">

      {loading && <DetailSkeleton />}
      {error && <div className="px-4 pt-6"><ErrorState message={error} onRetry={load} /></div>}

      {data && (
        <div className="mx-auto max-w-3xl px-4 pt-6">
          <button type="button" onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-1.5 text-xs font-bold text-white/40 transition-colors hover:text-white">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Kembali
          </button>

          {/* Hero: latar blur + poster portrait di kiri, info di kanan */}
          <section className="relative overflow-hidden rounded-3xl border border-white/10">
            {data.image && !imageError && (
              <img src={proxyImg(data.image)} alt="" aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-2xl" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" />

            <div className="relative flex gap-4 p-4 sm:gap-6 sm:p-6">
              <div className="aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-xl bg-black/50 shadow-[0_12px_40px_rgba(0,0,0,0.6)] ring-1 ring-white/15 sm:w-44">
                {data.image && !imageError
                  ? <img src={proxyImg(data.image)} alt={data.title} onError={() => setImageError(true)} decoding="async" className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center"><Logo className="h-12 w-12" dim /></div>}
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <h1 className="text-lg font-black leading-tight text-white sm:text-3xl">{data.title}</h1>
                {data.series?.title && data.series.title !== data.title && (
                  <p className="mt-1 line-clamp-1 text-[11px] font-bold text-white/45">Seri: {data.series.title}</p>
                )}

                {/* Chip info */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white">18+</span>
                  {data.score && (
                    <span className="flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-[10px] font-black text-black">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z" /></svg>
                      {data.score}
                    </span>
                  )}
                  {data.status && <span className={`rounded px-1.5 py-0.5 text-[10px] font-black ${data.status === 'Ongoing' ? 'bg-green-400/90 text-black' : 'bg-white/15 text-white/80'}`}>{data.status}</span>}
                  {data.duration && <span className="text-[11px] font-bold text-white/60">• {data.duration}</span>}
                  {episodes.length > 0 && <span className="text-[11px] font-bold text-white/60">• {episodes.length} Episode</span>}
                </div>

                {/* Aksi */}
                <div className="mt-4 flex flex-col items-stretch gap-2 sm:max-w-xs">
                  <button type="button" disabled={!playTarget} onClick={() => goWatch(playTarget)}
                    className="btn-gold flex items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-black text-black disabled:opacity-40">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    {lastWatched ? 'Lanjutkan Menonton' : 'Tonton Sekarang'}
                  </button>
                  <BookmarkButton item={bookmarkItem} light className="!rounded-full" />
                </div>
              </div>
            </div>
          </section>

          {/* Sinopsis (dipotong, bisa dibuka) */}
          <section className="mt-5 px-1">
            <p className={`text-xs leading-relaxed text-white/75 sm:text-sm ${expanded ? '' : 'line-clamp-4'}`}>
              {data.synopsis || 'Sinopsis belum tersedia.'}
            </p>
            {(data.synopsis || '').length > 200 && (
              <button type="button" onClick={() => setExpanded(value => !value)}
                className="mt-1 text-xs font-black text-white hover:text-[#F6CF80]">
                {expanded ? '− Ringkas' : '+ Selengkapnya'}
              </button>
            )}
          </section>

          {/* Info */}
          {[data.producer, data.tayang, data.aliases, data.date].some(Boolean) && (
            <div className="glass mt-5 grid grid-cols-2 gap-3 rounded-2xl p-4">
              {[
                ['Produser', data.producer],
                ['Tayang', data.tayang],
                ['Rilis', data.date?.slice(0, 10)],
                ['Aliases', data.aliases],
              ].filter(([, value]) => value).map(([key, value]) => (
                <div key={key} className="flex min-w-0 flex-col">
                  <span className="text-[9px] font-black uppercase tracking-wide text-white/25">{key}</span>
                  <span className="line-clamp-2 text-[11px] font-bold text-white/70">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Genre */}
          {data.genres?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {data.genres.map((genre, index) => (
                <button key={index} type="button"
                  onClick={() => navigate(genrePath(genre))}
                  className="rounded-lg border border-white/10 px-2.5 py-1 text-[10px] font-bold text-white/55 transition-all hover:border-[#F6CF80]/40 hover:text-[#F6CF80] active:scale-95">
                  {genre.name}
                </button>
              ))}
            </div>
          )}

          {/* Bagikan */}
          <section className="glass mt-4 flex items-center gap-4 rounded-2xl p-4">
            <Logo className="h-12 w-12 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-black text-[#F6CF80]">Bagikan Anime</h2>
              <p className="text-xs font-bold text-white/60">ke teman-temanmu</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={copyLink}
                  className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-black text-black active:scale-95">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 012-2h9" /></svg>
                  {copied ? 'Tersalin!' : 'Salin Tautan'}
                </button>
                <a href={`https://wa.me/?text=${encodeURIComponent(`${data.title} ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="rounded-lg bg-[#22c55e] px-3 py-1.5 text-[11px] font-black text-white active:scale-95">WhatsApp</a>
              </div>
            </div>
          </section>

          {/* Daftar episode */}
          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-white">Daftar Episode</h2>
              {episodes.length > 1 && (
                <button type="button" onClick={() => setNewestFirst(value => !value)}
                  className="text-[10px] font-black text-white/40 transition hover:text-[#F6CF80]">
                  {newestFirst ? 'Terbaru dulu' : 'Terlama dulu'} ⇅
                </button>
              )}
            </div>

            {episodes.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {episodes.map((ep, index) => {
                  const target = ep.id ?? ep.slug;
                  const seen = watched.has(String(ep.id));
                  const number = newestFirst ? episodes.length - index : index + 1;
                  return (
                    <li key={target}>
                      <button type="button" onClick={() => goWatch(target)}
                        className="glass glass-hover flex w-full items-center gap-3 rounded-2xl p-2.5 text-left active:scale-[0.98]">
                        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-xl bg-black/40">
                          {ep.image
                            ? <img src={proxyImg(ep.image)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                            : <div className="flex h-full w-full items-center justify-center"><Logo className="h-6 w-6" dim /></div>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-black uppercase tracking-wide text-[#F6CF80]">Episode {number}</span>
                          <p className="line-clamp-2 text-[11px] font-bold leading-tight text-white/80">{ep.title || `Episode ${number}`}</p>
                          {ep.date && <p className="mt-0.5 text-[9px] font-bold text-white/30">{String(ep.date).slice(0, 10)}</p>}
                        </div>
                        {seen && <span className="shrink-0 rounded-full bg-green-500/10 px-2 py-0.5 text-[8px] font-black text-green-400">Ditonton</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="glass rounded-2xl p-4 text-center text-[11px] font-bold text-white/45">
                {hasStream ? 'Judul ini tayang sebagai satu episode. Tekan "Tonton Sekarang" untuk memutar.' : 'Belum ada episode yang tersedia.'}
              </div>
            )}
          </section>

          {data.related?.info?.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-white">Info Lainnya</h2>
              <ContentGrid items={data.related.info} />
            </section>
          )}
          {data.related?.hentai?.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-white">Mungkin Kamu Suka</h2>
              <ContentGrid items={data.related.hentai} />
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default Detail;
