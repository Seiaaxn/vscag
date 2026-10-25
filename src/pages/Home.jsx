import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContentGrid from '../components/ContentGrid';

const API = '/nk-api';
const proxyImg = url => url ? `/nk-api/img?url=${encodeURIComponent(url)}` : null;

const Shimmer = () => (
  <div className="absolute inset-0 w-[200%] animate-[shimmer_1.5s_infinite]
    bg-gradient-to-r from-transparent via-white/5 to-transparent"
    style={{ transform: 'translate3d(-100%,0,0) skewX(-20deg)' }} />
);

const Row = ({ title, items, loading }) => {
  if (!loading && items.length === 0) return null;
  return (
    <section className="mb-8 px-4">
      <h2 className="mb-3 text-sm font-black uppercase tracking-tight text-white">{title}</h2>
      <ContentGrid items={items} loading={loading} skeletonCount={4} />
    </section>
  );
};

const BannerCarousel = ({ items, loading }) => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  useEffect(() => setIndex(0), [items.length]);
  useEffect(() => {
    if (items.length < 2) return undefined;
    const timer = setInterval(() => setIndex(current => (current + 1) % items.length), 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (loading) return <div className="relative mx-4 mb-6 aspect-[2/1] overflow-hidden rounded-lg bg-[#16161a]"><Shimmer /></div>;
  if (!items.length) return null;

  const item = items[index] || items[0];
  return (
    <div className="mx-4 mb-6">
      <div onClick={() => navigate(`/watch?id=${item.id}`)}
        className="relative aspect-[2/1] cursor-pointer overflow-hidden rounded-lg active:scale-[0.98] transition-transform">
        {item.image
          ? <img key={item.image} src={proxyImg(item.image)} alt={item.title || 'Banner'}
              onError={event => { event.currentTarget.style.display = 'none'; }}
              className="h-full w-full object-cover" />
          : <div className="flex h-full w-full items-center justify-center bg-[#16161a]"><span className="text-5xl opacity-10">🐱</span></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <span className="mb-2 inline-block rounded-sm bg-red-500 px-1.5 py-0.5 text-[8px] font-black text-white">18+ TERBARU</span>
          <h1 className="line-clamp-2 text-sm font-black leading-tight text-white">{item.title}</h1>
          {item.date && <p className="mt-1 text-[10px] font-bold text-white/40">{String(item.date).slice(0, 10)}</p>}
        </div>
        {items.length > 1 && <div className="absolute bottom-3 right-3 flex gap-1.5">
          {items.map((_, dotIndex) => <button key={dotIndex} type="button" aria-label={`Banner ${dotIndex + 1}`}
            onClick={event => { event.stopPropagation(); setIndex(dotIndex); }}
            className={`h-1.5 rounded-full transition-all ${dotIndex === index ? 'w-5 bg-[#F6CF80]' : 'w-1.5 bg-white/40'}`} />)}
        </div>}
      </div>
      {items.length > 1 && <div className="mt-2 flex items-center justify-between px-1">
        <button type="button" onClick={() => setIndex(current => (current - 1 + items.length) % items.length)} className="text-[10px] font-black text-white/35 hover:text-[#F6CF80]">← Sebelumnya</button>
        <span className="text-[9px] font-bold text-white/25">{index + 1} / {items.length}</span>
        <button type="button" onClick={() => setIndex(current => (current + 1) % items.length)} className="text-[10px] font-black text-white/35 hover:text-[#F6CF80]">Berikutnya →</button>
      </div>}
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/home`).then(r => r.json())
      .then(res => setData(res.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const banners = data?.carousel || [];
  const posts = data?.posts || [];
  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <style>{`@keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}} body,html{background:#0a0a0c!important;color:white;margin:0;padding:0}`}</style>
      <Navbar />
      <main className="mx-auto max-w-3xl pb-8 pt-20">
        <BannerCarousel items={banners} loading={loading} />
        <div className="mb-7 flex gap-2 overflow-x-auto px-4 no-scrollbar">
          <button onClick={() => navigate('/explore')} className="shrink-0 whitespace-nowrap bg-[#F6CF80]/10 px-4 py-2 text-[10px] font-black text-[#F6CF80]">Semua Konten →</button>
          <button onClick={() => navigate('/history')} className="shrink-0 whitespace-nowrap bg-[#16161a] px-4 py-2 text-[10px] font-black text-white/60">Genre</button>
          <button onClick={() => navigate('/schedule')} className="shrink-0 whitespace-nowrap bg-[#16161a] px-4 py-2 text-[10px] font-black text-white/60">Jadwal Rilis</button>
        </div>
        {loading ? <Row title="Memuat..." items={[]} loading /> : posts.map((group, index) => (
          <Row key={index} title={group.category || 'Lainnya'} items={group.data || []} loading={false} />
        ))}
      </main>
      <Footer />
    </div>
  );
};

export default Home;
