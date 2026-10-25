import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContentGrid from '../components/ContentGrid';
import ErrorState from '../components/ErrorState';
import Reveal from '../components/Reveal';
import EmptyState from '../components/EmptyState';
import Logo from '../components/Logo';
import { apiGet, proxyImg } from '../lib/api';

const Row = ({ title, items, loading }) => {
  if (!loading && items.length === 0) return null;
  return (
    <section className="mb-10 px-4">
      <Reveal className="mb-4 flex items-center gap-3">
        <span className="h-5 w-1 rounded-full bg-gradient-to-b from-[#F6CF80] to-[#F6CF80]" />
        <h2 className="text-sm font-black uppercase tracking-tight text-white">{title}</h2>
      </Reveal>
      <ContentGrid items={items} loading={loading} skeletonCount={4} />
    </section>
  );
};

// Hero: slide crossfade + Ken Burns + parallax (gambar bergerak lebih lambat dari scroll)
const BannerCarousel = ({ items, loading }) => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  useEffect(() => setIndex(0), [items.length]);
  useEffect(() => {
    if (items.length < 2) return undefined;
    const timer = setInterval(() => setIndex(current => (current + 1) % items.length), 5500);
    return () => clearInterval(timer);
  }, [items.length]);

  if (loading) return <div className="glass relative mx-4 mb-6 aspect-[2/1] overflow-hidden rounded-3xl md:aspect-[21/9]"><div className="absolute inset-0 w-[200%] animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ transform: 'translate3d(-100%,0,0) skewX(-20deg)' }} /></div>;
  if (!items.length) return null;

  const item = items[index] || items[0];
  return (
    <div className="mx-4 mb-6">
      <div className="glass group relative aspect-[2/1] cursor-pointer overflow-hidden rounded-3xl md:aspect-[21/9]"
        onClick={() => navigate(`/anime/${item.id}`)}>
        {items.map((slide, i) => (
          <div key={slide.id || i} className="absolute inset-0 transition-opacity duration-500" style={{ opacity: i === index ? 1 : 0 }}>
            <div className="absolute inset-0" >
              {slide.image
                ? <img src={proxyImg(slide.image)} alt={slide.title || 'Banner'} className="h-full w-full object-cover" decoding="async"
                    onError={event => { event.currentTarget.style.display = 'none'; }} />
                : <div className="flex h-full w-full items-center justify-center"><Logo className="h-16 w-16" dim /></div>}
            </div>
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        <div className="absolute inset-x-3 bottom-3 md:inset-x-5 md:bottom-5">
          <div key={item.id} className="glass-strong rounded-2xl p-3 md:max-w-lg md:p-4 ">
            <span className="mb-1.5 inline-block rounded-full bg-red-500/80 px-2 py-0.5 text-[8px] font-black text-white">18+ TERBARU</span>
            <h1 className="line-clamp-2 text-sm font-black leading-tight text-white md:text-lg">{item.title}</h1>
            {item.date && <p className="mt-1 text-[10px] font-bold text-white/50">{String(item.date).slice(0, 10)}</p>}
          </div>
        </div>

        {items.length > 1 && <div className="absolute right-4 top-4 flex gap-1.5">
          {items.map((_, dotIndex) => <button key={dotIndex} type="button" aria-label={`Banner ${dotIndex + 1}`}
            onClick={event => { event.stopPropagation(); setIndex(dotIndex); }}
            className={`h-1.5 rounded-full transition-all duration-500 ${dotIndex === index ? 'w-6 bg-[#F6CF80] shadow-[0_0_10px_#F6CF80]' : 'w-1.5 bg-white/40'}`} />)}
        </div>}
      </div>
      {items.length > 1 && <div className="mt-2 flex items-center justify-between px-2">
        <button type="button" onClick={() => setIndex(current => (current - 1 + items.length) % items.length)} className="text-[10px] font-black text-white/40 transition hover:text-[#F6CF80]">← Sebelumnya</button>
        <span className="text-[9px] font-bold text-white/30">{index + 1} / {items.length}</span>
        <button type="button" onClick={() => setIndex(current => (current + 1) % items.length)} className="text-[10px] font-black text-white/40 transition hover:text-[#F6CF80]">Berikutnya →</button>
      </div>}
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true); setError(null);
    apiGet('/home')
      .then(res => setData(res.data || {}))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const [q, setQ] = useState('');
  const banners = data?.carousel || [];
  const posts = data?.posts || [];
  const chips = [['Semua Konten →', '/explore', true], ['Genre', '/genre'], ['Jadwal Rilis', '/schedule']];
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl pb-8 pt-6">
        <Reveal className="mx-4 mb-5 flex items-center gap-3">
          <img src="/img/nefusoft.webp" alt="NefuSoft" className="h-11 w-11 shrink-0 object-contain" />
          <form className="glass-input flex min-w-0 flex-1 items-center rounded-2xl px-4 py-3"
            onSubmit={e => { e.preventDefault(); if (q.trim()) navigate(`/explore?q=${encodeURIComponent(q.trim())}`); }}>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cari judul..."
              className="min-w-0 flex-1 bg-transparent text-xs font-bold text-white outline-none placeholder:text-white/30" />
            <button type="submit" className="ml-2 text-[#F6CF80]" aria-label="Cari">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </form>
        </Reveal>
        {error ? <ErrorState message={error} onRetry={load} /> : <>
          <BannerCarousel items={banners} loading={loading} />
          <Reveal className="no-scrollbar mb-8 flex gap-2 overflow-x-auto px-4">
            {chips.map(([label, path, primary]) => (
              <button key={path} onClick={() => navigate(path)}
                className={`${primary ? 'btn-gold text-black' : 'glass glass-hover text-white/70'} shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-[10px] font-black`}>{label}</button>
            ))}
          </Reveal>
          {loading ? <Row title="Memuat..." items={[]} loading /> : posts.map((group, index) => (
            <Row key={index} title={group.category || 'Lainnya'} items={group.data || []} loading={false} />
          ))}
          {!loading && banners.length === 0 && posts.length === 0 && (
            <EmptyState title="Beranda masih kosong" text="Konten belum tersedia dari server. Coba muat ulang atau jelajahi menu lain." actions={['explore', 'genre', 'schedule']} />
          )}
        </>}
      </main>
      <Footer />
    </div>
  );
};

export default Home;
