import React, { useEffect, useMemo } from 'react';

// Latar aurora + partikel + progress scroll. Semua posisi parallax digerakkan
// lewat CSS variable (--sy scroll, --mx/--my mouse) supaya React tidak re-render.
const Background = () => {
  const particles = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    left: `${(i * 53) % 100}%`,
    size: 2 + (i % 4),
    dur: 14 + (i % 7) * 3,
    delay: -((i * 1.7) % 20),
    depth: 0.05 + (i % 5) * 0.05,
  })), []);

  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = Math.max(1, root.scrollHeight - window.innerHeight);
      root.style.setProperty('--sy', String(Math.round(window.scrollY)));
      root.style.setProperty('--p', String(Math.min(1, window.scrollY / max)));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const onPointer = event => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      root.style.setProperty('--mx', ((event.clientX / window.innerWidth) * 2 - 1).toFixed(3));
      root.style.setProperty('--my', ((event.clientY / window.innerHeight) * 2 - 1).toFixed(3));
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pointermove', onPointer);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      <div className="aurora" aria-hidden="true">
        <div className="px" style={{ '--d': 0.10 }}><div className="blob blob-1" /></div>
        <div className="px" style={{ '--d': 0.22 }}><div className="blob blob-2" /></div>
        <div className="px" style={{ '--d': 0.16 }}><div className="blob blob-3" /></div>
        <div className="grid-overlay" />
        {particles.map((p, i) => (
          <div key={i} className="px" style={{ '--d': p.depth }}>
            <span className="particle" style={{ left: p.left, width: p.size, height: p.size, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }} />
          </div>
        ))}
        <div className="vignette" />
      </div>
    </>
  );
};

export default Background;
