import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

// Tampilan pengganti saat data kosong: ikon, penjelasan, dan tombol tujuan
const ACTIONS = {
  home: ['Ke Beranda', '/home'],
  explore: ['Lihat Semua Konten', '/explore'],
  genre: ['Pilih Genre', '/genre'],
  ongoing: ['Rilisan Terbaru', '/ongoing'],
  schedule: ['Jadwal Rilis', '/schedule'],
};

const EmptyState = ({ title = 'Belum ada konten', text = 'Coba cari dengan kata kunci lain atau jelajahi menu di bawah.', actions = ['home', 'explore', 'genre'] }) => {
  const navigate = useNavigate();
  return (
    <div className="glass-strong mx-auto my-8 flex max-w-md flex-col items-center gap-3 rounded-3xl px-6 py-10 text-center">
      <Logo className="h-16 w-16" />
      <h3 className="text-sm font-black text-white">{title}</h3>
      <p className="text-[11px] font-bold leading-relaxed text-white/50">{text}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {actions.map((key, i) => ACTIONS[key] && (
          <button key={key} type="button" onClick={() => navigate(ACTIONS[key][1])}
            className={`${i === 0 ? 'btn-gold text-black' : 'glass glass-hover text-white/80'} rounded-full px-5 py-2 text-[10px] font-black`}>
            {ACTIONS[key][0]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmptyState;
