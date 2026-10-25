import React from 'react';

// Foto profil; kalau belum ada, tampilkan inisial nama.
const Avatar = ({ user, className = 'h-12 w-12 text-base' }) => (
  user?.avatar
    ? <img src={user.avatar} alt={user.name} className={`${className} shrink-0 rounded-full object-cover ring-1 ring-white/15`} />
    : <div className={`${className} flex shrink-0 select-none items-center justify-center rounded-full bg-[#F6CF80] font-black text-black`}>
        {(user?.name || '?').trim().charAt(0).toUpperCase()}
      </div>
);

export default Avatar;
