import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Tombol bookmark. Kalau belum login -> diarahkan ke halaman masuk.
const BookmarkButton = ({ item, className = '' }) => {
  const { user, isBookmarked, toggleBookmark } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const saved = Boolean(item?.id) && isBookmarked(item.id);

  const onClick = () => {
    if (!user) return navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
    toggleBookmark(item);
  };

  return (
    <button type="button" onClick={onClick} aria-pressed={saved} disabled={!item?.id}
      className={`${saved ? 'bg-[#F6CF80]/15 text-[#F6CF80] border-[#F6CF80]/40' : 'glass text-white/80'} flex items-center justify-center gap-2 rounded-2xl border border-transparent px-5 py-3 text-xs font-black transition active:scale-95 disabled:opacity-40 ${className}`}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" fill={saved ? 'currentColor' : 'none'}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      {saved ? 'Tersimpan' : 'Bookmark'}
    </button>
  );
};

export default BookmarkButton;
