import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ContentGrid from '../components/ContentGrid';

const API = '/nk-api';

const Ongoing = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${API}/ongoing?page=${page}`)
      .then(response => response.json())
      .then(response => {
        if (cancelled) return;
        const data = response.data || {};
        setItems(data.results || []);
        setHasNext(Boolean(data.hasNext));
      })
      .catch(() => { if (!cancelled) { setItems([]); setHasNext(false); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    window.scrollTo(0, 0);
    return () => { cancelled = true; };
  }, [page]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] pb-24">
      <style>{`@keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}} body,html{background:#0a0a0c!important;color:white;margin:0;padding:0}`}</style>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-24">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h1 className="text-lg font-black uppercase text-white">Ongoing</h1>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Rilisan terbaru dari API recent</span>
          </div>
          <span className="text-xs font-bold text-white/30">Hal. {page}</span>
        </div>
        <ContentGrid items={items} loading={loading} skeletonCount={12} />
        {!loading && items.length > 0 && <div className="mt-8 flex justify-center gap-3">
          <button onClick={() => setPage(value => value - 1)} disabled={page <= 1}
            className="bg-[#16161a] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-20 hover:text-[#F6CF80]">← Prev</button>
          <button onClick={() => setPage(value => value + 1)} disabled={!hasNext}
            className="bg-[#16161a] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-20 hover:text-[#F6CF80]">Next →</button>
        </div>}
      </main>
    </div>
  );
};

export default Ongoing;
