import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ContentGrid from '../components/ContentGrid';

const API = '/nk-api';

const Explore = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [input, setInput] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const genreId = searchParams.get('genre_id');
  const genreName = searchParams.get('genre_name') || 'Genre';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (query) {
        const res = await fetch(`${API}/search?q=${encodeURIComponent(query)}`).then(r => r.json());
        setResults(res.data?.results || []); setHasNext(false);
      } else if (genreId) {
        const res = await fetch(`${API}/genre?id=${genreId}&page=${page}&limit=20`).then(r => r.json());
        const data = res.data || {}; setResults(data.results || []); setHasNext(data.hasNext || false);
      } else {
        const res = await fetch(`${API}/all?page=${page}`).then(r => r.json());
        const data = res.data || {}; setResults(data.results || []); setHasNext(data.hasNext || false);
      }
    } catch { setResults([]); setHasNext(false); }
    setLoading(false);
  }, [query, genreId, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const params = {};
    if (query) params.q = query;
    if (genreId) { params.genre_id = genreId; params.genre_name = genreName; }
    setSearchParams(params, { replace: true });
  }, [query, genreId, genreName, setSearchParams]);

  const doSearch = () => { setQuery(input.trim()); setPage(1); };
  const clearAll = () => { setQuery(''); setInput(''); setPage(1); navigate('/explore', { replace: true }); };

  return (
    <div className="min-h-screen bg-[#0a0a0c] pb-24">
      <style>{`@keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}} body,html{background:#0a0a0c!important;color:white;margin:0;padding:0}`}</style>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-24">
        <form onSubmit={event => { event.preventDefault(); doSearch(); }} className="mb-5 flex gap-2">
          <input value={input} onChange={event => setInput(event.target.value)} placeholder="Cari judul..."
            className="min-w-0 flex-1 bg-[#16161a] px-4 py-3 text-xs font-bold text-white outline-none placeholder:text-white/20 focus:bg-[#1b1b20]" />
          <button type="submit" className="shrink-0 bg-[#F6CF80] px-5 text-xs font-black text-black active:scale-95">Cari</button>
        </form>

        {(query || genreId) && <div className="mb-4 flex items-center gap-3">
          <span className="text-xs font-bold text-white/40">{genreId ? 'Genre:' : 'Hasil:'}</span>
          <span className="text-sm font-black text-[#F6CF80]">{genreId ? genreName : `"${query}"`}</span>
          <button onClick={clearAll} className="text-xs font-bold text-white/30 hover:text-white">Hapus</button>
        </div>}

        {!query && !genreId && <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Semua Konten</span>
          <span className="text-[10px] font-bold text-white/30">Hal. {page}</span>
        </div>}

        <ContentGrid items={results} loading={loading} skeletonCount={12} />

        {!loading && results.length > 0 && !query && <div className="mt-8 flex justify-center gap-3">
          <button onClick={() => { setPage(value => value - 1); window.scrollTo(0, 0); }} disabled={page <= 1}
            className="bg-[#16161a] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-20 hover:text-[#F6CF80]">← Prev</button>
          <button onClick={() => { setPage(value => value + 1); window.scrollTo(0, 0); }} disabled={!hasNext}
            className="bg-[#16161a] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-20 hover:text-[#F6CF80]">Next →</button>
        </div>}
      </main>
    </div>
  );
};

export default Explore;
