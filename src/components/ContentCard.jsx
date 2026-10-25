import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const proxyImg = url => url ? `/nk-api/img?url=${encodeURIComponent(url)}` : null;

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
      className="group flex min-w-0 w-full flex-col gap-1.5 text-left active:scale-[0.98] transition-transform">
      <div className="relative aspect-[2/1] overflow-hidden rounded-md bg-[#16161a]">
        {item.image && !imageError
          ? <img src={proxyImg(item.image)} alt="" loading="lazy" onError={() => setImageError(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="flex h-full w-full items-center justify-center">
              <span className="text-2xl opacity-10">🐱</span>
            </div>}
        <span className="absolute right-1 top-1 rounded-sm bg-red-500/80 px-1 py-0.5 text-[7px] font-black text-white">18+</span>
      </div>
      <span className="line-clamp-2 text-[10px] font-bold leading-tight text-white/65 transition-colors group-hover:text-[#F6CF80]">
        {item.title || 'Tanpa judul'}
      </span>
    </button>
  );
};

export default ContentCard;
