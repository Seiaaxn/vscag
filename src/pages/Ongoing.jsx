import React, { useCallback, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ContentGrid from '../components/ContentGrid';
import ErrorState from '../components/ErrorState';
import Reveal from '../components/Reveal';
import { apiGet } from '../lib/api';

const Ongoing = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);
  const retry = useCallback(() => setTick(value => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null);
    apiGet(`/ongoing?page=${page}`, { signal: controller.signal })
      .then(response => {
        const data = response.data || {};
        setItems(data.results || []);
        setHasNext(Boolean(data.hasNext));
      })
      .catch(e => { if (e.name !== 'AbortError') { setItems([]); setHasNext(false); setError(e.message); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    window.scrollTo(0, 0);
    return () => controller.abort();
  }, [page, tick]);

  return (
    <div className="min-h-screen pb-24">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-28">
        <Reveal className="glass mb-6 flex items-end justify-between rounded-3xl px-5 py-4">
          <div>
            <h1 className="text-lg font-black uppercase text-white">Ongoing</h1>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Rilisan terbaru dari API recent</span>
          </div>
          <span className="glass rounded-full px-3 py-1 text-xs font-bold text-[#F6CF80]">Hal. {page}</span>
        </Reveal>
        {error ? <ErrorState message={error} onRetry={retry} /> : <ContentGrid items={items} loading={loading} skeletonCount={12} />}
        {!loading && !error && items.length > 0 && <div className="mt-10 flex justify-center gap-3">
          <button onClick={() => setPage(value => value - 1)} disabled={page <= 1}
            className="glass glass-hover rounded-full px-6 py-2.5 text-xs font-bold text-white disabled:opacity-25">← Prev</button>
          <button onClick={() => setPage(value => value + 1)} disabled={!hasNext}
            className="glass glass-hover rounded-full px-6 py-2.5 text-xs font-bold text-white disabled:opacity-25">Next →</button>
        </div>}
      </main>
    </div>
  );
};

export default Ongoing;
