import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { proxyImg } from '../lib/api';

const ContentCard = ({ item }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const target = item?.id
    ? `/watch?id=${item.id}`
    : item?.slug
      ? `/watch?slug=${encodeURIComponent(item.slug)}`
      : null;

  if (!target) return null;
  return (
    <button type="button" onClick={() => navigate(target)}
      className="group flex min-w-0 w-full flex-col gap-2 text-left active:scale-[0.97] transition-transform">
      <div className="glass glass-hover relative aspect-[2/1] overflow-hidden rounded-2xl">
        {item.image && !imageError
          ? <img src={proxyImg(item.image)} alt="" loading="lazy" decoding="async" onError={() => setImageError(true)}
              className="h-full w-full object-cover " />
          : <div className="flex h-full w-full items-center justify-center">
              <span className="text-2xl opacity-20">🐱</span>
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
