import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { proxyImg } from '../lib/api';
import Logo from './Logo';

const ContentCard = ({ item, to = 'anime' }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  // to="anime" -> halaman detail; to="watch" -> langsung memutar (dipakai untuk daftar episode)
  const key = item?.id ?? item?.slug;
  const target = key == null ? null
    : to === 'watch' ? `/watch?id=${encodeURIComponent(key)}`
    : `/anime/${encodeURIComponent(key)}`;

  if (!target) return null;
  return (
    <button type="button" onClick={() => navigate(target)}
      className="group flex min-w-0 w-full flex-col gap-2 text-left active:scale-[0.97] transition-transform">
      <div className="glass glass-hover relative aspect-[2/1] overflow-hidden rounded-2xl">
        {item.image && !imageError
          ? <img src={proxyImg(item.image)} alt="" loading="lazy" decoding="async" onError={() => setImageError(true)}
              className="h-full w-full object-cover " />
          : <div className="flex h-full w-full items-center justify-center">
              <Logo className="h-8 w-8" dim />
            </div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
        <span className="glass absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[7px] font-black text-red-300">18+</span>
      </div>
      <span className="line-clamp-2 px-1 text-[10px] font-bold leading-tight text-white/70 transition-colors group-hover:text-[#F6CF80]">
        {item.title || 'Tanpa judul'}
      </span>
    </button>
  );
};

export default ContentCard;
