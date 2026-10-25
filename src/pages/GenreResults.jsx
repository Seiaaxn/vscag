import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ContentGrid from '../components/ContentGrid';
import ErrorState from '../components/ErrorState';
import Reveal from '../components/Reveal';
import { apiGet, slugify } from '../lib/api';

// Halaman isi satu genre: /genre/:slug (contoh /genre/historical)
// Sengaja terpisah dari /explore (yang khusus pencarian & semua konten).
const GenreResults = () => {
  const { slug: genreId } = useParams();
  const navigate = useNavigate();
  const [genreName, setGenreName] = useState(genreId.replace(/-/g, ' '));
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { setPage(1); }, [genreId]);

  // Ambil nama asli genre dari daftar (slug -> "Historical"); kalau gagal tetap pakai slug
  useEffect(() => {
    setGenreName(genreId.replace(/-/g, ' '));
    apiGet('/genres').then(res => {
      const found = (res.data?.data || []).find(g => g.slug === genreId || slugify(g.name) === slugify(genreId));
      if (found?.name) setGenreName(found.name);
    }).catch(() => {});
  }, [genreId]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiGet(`/genre?id=${encodeURIComponent(genreId)}&page=${page}&limit=20`);
      const data = res.data || {};
      setResults(data.results || []); setHasNext(Boolean(data.hasNext));
    } catch (e) { setResults([]); setHasNext(false); setError(e.message); }
    setLoading(false);
  }, [genreId, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen pb-28">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-6">
        <Reveal className="mb-5">
          <button type="button" onClick={() => navigate('/genre')}
            className="mb-3 flex items-center gap-1.5 text-xs font-bold text-white/40 transition-colors hover:text-white">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Semua Genre
          </button>
          <div className="glass rounded-3xl px-5 py-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Genre</span>
            <h1 className="text-lg font-black uppercase text-[#F6CF80]">{genreName}</h1>
          </div>
        </Reveal>

        {error
          ? <ErrorState message={error} onRetry={load} />
          : <ContentGrid items={results} loading={loading} skeletonCount={12} emptyText="Belum ada konten di genre ini." />}

        {!loading && !error && results.length > 0 && (
          <div className="mt-10 flex justify-center gap-3">
            <button onClick={() => { setPage(value => value - 1); window.scrollTo(0, 0); }} disabled={page <= 1}
              className="glass glass-hover rounded-full px-6 py-2.5 text-xs font-bold text-white disabled:opacity-25">← Prev</button>
            <span className="self-center text-[10px] font-bold text-white/30">Hal. {page}</span>
            <button onClick={() => { setPage(value => value + 1); window.scrollTo(0, 0); }} disabled={!hasNext}
              className="glass glass-hover rounded-full px-6 py-2.5 text-xs font-bold text-white disabled:opacity-25">Next →</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default GenreResults;
