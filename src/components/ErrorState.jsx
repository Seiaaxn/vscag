import React from 'react';

const ErrorState = ({ message, onRetry }) => (
  <div className="glass-strong mx-auto my-10 flex max-w-md flex-col items-center gap-3 rounded-3xl p-6 text-center reveal is-in">
    <div className="text-4xl">😵‍💫</div>
    <h3 className="text-sm font-black text-white">Gagal memuat data</h3>
    <p className="text-[11px] font-bold leading-relaxed text-white/50">{message || 'Terjadi kesalahan saat menghubungi server.'}</p>
    {onRetry && <button type="button" onClick={onRetry} className="btn-gold mt-1 rounded-full px-6 py-2.5 text-[11px] font-black uppercase tracking-wider text-black">Coba lagi</button>}
  </div>
);

export default ErrorState;
