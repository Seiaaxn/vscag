import React from 'react';

// Logo NefuSoft: pengganti semua emoji (placeholder, error, kosong)
const Logo = ({ className = 'h-12 w-12', dim = false }) => (
  <img src="/img/nefusoft.webp" alt="NefuSoft" draggable={false}
    className={`${className} select-none object-contain ${dim ? 'opacity-30 grayscale' : ''}`} />
);

export default Logo;
