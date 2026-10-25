import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { proxyImg } from '../lib/api';

const ContentCard = ({ item }) => {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [imageError, setImageError] = useState(false);
  const target = item?.id
    ? `/watch?id=${item.id}`
    : item?.slug
      ? `/watch?slug=${encodeURIComponent(item.slug)}`
      : null;

  // Efek tilt 3D mengikuti mouse (hanya perangkat dengan mouse)
  const onMove = event => {
    if (event.pointerType !== 'mouse' || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const el = cardRef.current;
    el.style.setProperty('--ry', `${((x - 0.5) * 14).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${((0.5 - y) * 14).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
    el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
  };
  const onLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  if (!target) return null;
  return (
    <button type="button" onClick={() => navigate(target)} onPointerMove={onMove} onPointerLeave={onLeave}
      className="group flex min-w-0 w-full flex-col gap-2 text-left active:scale-[0.97] transition-transform">
      <div ref={cardRef} className="tilt glass glass-hover relative aspect-[2/1] overflow-hidden rounded-2xl">
        {item.image && !imageError
          ? <img src={proxyImg(item.image)} alt="" loading="lazy" onError={() => setImageError(true)}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
          : <div className="flex h-full w-full items-center justify-center">
              <span className="text-2xl opacity-20">🐱</span>
            </div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
        <span className="glass absolute right-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[7px] font-black text-red-300">18+</span>
        <div className="glare" />
      </div>
      <span className="line-clamp-2 px-1 text-[10px] font-bold leading-tight text-white/70 transition-colors group-hover:text-[#F6CF80]">
        {item.title || 'Tanpa judul'}
      </span>
    </button>
  );
};

export default ContentCard;
