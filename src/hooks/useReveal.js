import { useEffect, useRef } from 'react';

// Menambah class "is-in" saat elemen masuk viewport (dipakai animasi .reveal).
export default function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) { el.classList.add('is-in'); return undefined; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add('is-in'); observer.disconnect(); }
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}
