import React, { useCallback, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ErrorState from '../components/ErrorState';
import Reveal from '../components/Reveal';
import EmptyState from '../components/EmptyState';
import { apiGet } from '../lib/api';

const Shimmer = () => <div className="absolute inset-0 w-[200%] animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ transform: 'translate3d(-100%,0,0) skewX(-20deg)' }} />;

const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);

  const load = useCallback(() => {
    setLoading(true); setError(null);
    apiGet('/comingsoon')
      .then(res => { const data = res.data || []; setSchedule(data); if (data.length) setOpen(0); })
      .catch(e => { setSchedule([]); setError(e.message); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen pb-24">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-8 pt-6">
        <Reveal className="glass mb-6 rounded-3xl px-5 py-4">
          <h1 className="text-lg font-black uppercase text-white">Jadwal Rilis</h1>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Upcoming</span>
        </Reveal>

        {loading && <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, index) => <div key={index} className="glass relative h-14 overflow-hidden rounded-2xl"><Shimmer /></div>)}
        </div>}

        {error && <ErrorState message={error} onRetry={load} />}

        {!loading && !error && <div className="flex flex-col gap-3">
          {schedule.map((section, index) => <Reveal as="section" key={index} delay={index * 70} className="glass overflow-hidden rounded-2xl">
            <button onClick={() => setOpen(open === index ? null : index)} className="flex w-full items-center justify-between px-5 py-4 text-left">
              <span className="text-xs font-black text-white">{section.period}</span>
              <span className={`text-sm font-black text-[#F6CF80] transition-transform duration-300 ${open === index ? 'rotate-180' : ''}`}>▾</span>
            </button>
            <div className="grid transition-all duration-500 ease-out" style={{ gridTemplateRows: open === index ? '1fr' : '0fr' }}>
              <div className="overflow-hidden">
                <div className="px-5 pb-4">
                  {section.items?.length ? section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start gap-3 py-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F6CF80] shadow-[0_0_8px_#F6CF80]" />
                      <span className="text-xs font-bold leading-relaxed text-white/75">{item}</span>
                    </div>
                  )) : <div className="py-2 text-xs font-bold text-white/30">Belum ada info</div>}
                </div>
              </div>
            </div>
          </Reveal>)}
        </div>}

        {!loading && !error && schedule.length === 0 && <EmptyState icon="📅" title="Belum ada jadwal rilis" text="Jadwal belum tersedia saat ini. Lihat rilisan terbaru atau jelajahi semua konten." actions={['ongoing', 'explore', 'home']} />}
      </main>
    </div>
  );
};

export default Schedule;
