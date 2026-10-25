import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ErrorState from '../components/ErrorState';
import Reveal from '../components/Reveal';
import EmptyState from '../components/EmptyState';
import { apiGet } from '../lib/api';

const Shimmer = () => <div className="absolute inset-0 w-[200%] animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ transform: 'translate3d(-100%,0,0) skewX(-20deg)' }} />;

const Genre = () => {
  const navigate = useNavigate();
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true); setError(null);
    apiGet('/genres')
      .then(res => setGenres(res.data?.data || []))
      .catch(e => { setGenres([]); setError(e.message); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = search.trim() ? genres.filter(genre => genre.name.toLowerCase().includes(search.toLowerCase())) : genres;
  return (
    <div className="min-h-screen pb-24">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-6">
        <Reveal className="glass mb-5 rounded-3xl px-5 py-4">
          <h1 className="text-lg font-black uppercase text-white">Genre</h1>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{genres.length} genre tersedia</span>
        </Reveal>

        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Filter genre..."
          className="glass-input mb-6 w-full rounded-2xl px-5 py-3.5 text-xs font-bold text-white outline-none placeholder:text-white/30" />

        {error ? <ErrorState message={error} onRetry={load} /> : loading ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(16)].map((_, index) => <div key={index} className="glass relative h-12 overflow-hidden rounded-2xl"><Shimmer /></div>)}
        </div> : filtered.length === 0 ? (
          <EmptyState icon="🔎" title="Genre tidak ditemukan" text="Tidak ada genre yang cocok dengan filter. Hapus filter atau lihat semua konten." actions={['explore', 'home']} />
        ) : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((genre, index) => <Reveal key={genre.id || index} delay={(index % 8) * 40}>
            <button onClick={() => navigate(`/genre/${encodeURIComponent(genre.id)}?name=${encodeURIComponent(genre.name)}`)}
              className="glass glass-hover flex w-full min-w-0 items-center justify-between rounded-2xl px-4 py-3.5 text-left active:scale-[0.97]">
              <span className="truncate text-[11px] font-bold text-white/80">{genre.name}</span>
              <span className="ml-2 shrink-0 text-xs text-[#F6CF80]">›</span>
            </button>
          </Reveal>)}
        </div>}
      </main>
    </div>
  );
};

export default Genre;
