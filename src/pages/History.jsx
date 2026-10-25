import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const API = '/nk-api';
const Shimmer = () => <div className="absolute inset-0 w-[200%] animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" style={{ transform: 'translate3d(-100%,0,0) skewX(-20deg)' }} />;

const History = () => {
  const navigate = useNavigate();
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${API}/genres`).then(r => r.json())
      .then(res => setGenres(res.data?.data || []))
      .catch(() => setGenres([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim() ? genres.filter(genre => genre.name.toLowerCase().includes(search.toLowerCase())) : genres;
  return (
    <div className="min-h-screen bg-[#0a0a0c] pb-24">
      <style>{`@keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}} body,html{background:#0a0a0c!important;color:white;margin:0;padding:0}`}</style>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-24">
        <div className="mb-5">
          <h1 className="text-lg font-black uppercase text-white">Genre</h1>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{genres.length} genre tersedia</span>
        </div>

        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Filter genre..."
          className="mb-5 w-full bg-[#16161a] px-4 py-3 text-xs font-bold text-white outline-none placeholder:text-white/20 focus:bg-[#1b1b20]" />

        {loading ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(16)].map((_, index) => <div key={index} className="relative h-10 overflow-hidden rounded-md bg-[#16161a]"><Shimmer /></div>)}
        </div> : filtered.length === 0 ? (
          <div className="py-20 text-center text-sm font-bold text-white/30">Tidak ditemukan</div>
        ) : <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((genre, index) => <button key={genre.id || index}
            onClick={() => navigate(`/explore?genre_id=${genre.id}&genre_name=${encodeURIComponent(genre.name)}`)}
            className="flex min-w-0 items-center justify-between rounded-md bg-[#16161a] px-4 py-3 text-left transition-colors hover:bg-[#202026] active:scale-[0.98]">
            <span className="truncate text-[11px] font-bold text-white/70 hover:text-[#F6CF80]">{genre.name}</span>
            <span className="ml-2 shrink-0 text-xs text-white/20">›</span>
          </button>)}
        </div>}
      </main>
    </div>
  );
};

export default History;
