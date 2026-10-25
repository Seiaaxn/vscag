import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';

const API = '/nk-api';
const Shimmer = () => <div className="absolute inset-0 w-[200%] animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" style={{ transform: 'translate3d(-100%,0,0) skewX(-20deg)' }} />;

const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    fetch(`${API}/comingsoon`).then(r => r.json())
      .then(res => { const data = res.data || []; setSchedule(data); if (data.length) setOpen(0); })
      .catch(() => setSchedule([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0c] pb-24">
      <style>{`@keyframes shimmer{0%{transform:translate3d(-100%,0,0) skewX(-20deg)}100%{transform:translate3d(200%,0,0) skewX(-20deg)}} body,html{background:#0a0a0c!important;color:white;margin:0;padding:0}`}</style>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-24">
        <div className="mb-6">
          <h1 className="text-lg font-black uppercase text-white">Jadwal Rilis</h1>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Upcoming</span>
        </div>

        {loading && <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, index) => <div key={index} className="relative h-12 overflow-hidden rounded-md bg-[#16161a]"><Shimmer /></div>)}
        </div>}

        {!loading && <div className="flex flex-col gap-2">
          {schedule.map((section, index) => <section key={index} className="overflow-hidden rounded-md bg-[#16161a]">
            <button onClick={() => setOpen(open === index ? null : index)} className="flex w-full items-center justify-between px-4 py-3 text-left">
              <span className="text-xs font-black text-white">{section.period}</span>
              <span className={`text-sm font-black text-white/40 transition-transform ${open === index ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {open === index && <div className="px-4 pb-3">
              {section.items?.length ? section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-start gap-3 py-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F6CF80]" />
                  <span className="text-xs font-bold leading-relaxed text-white/70">{item}</span>
                </div>
              )) : <div className="py-2 text-xs font-bold text-white/30">Belum ada info</div>}
            </div>}
          </section>)}
        </div>}

        {!loading && schedule.length === 0 && <div className="py-24 text-center text-sm font-bold text-white/30">Tidak ada jadwal tersedia</div>}
      </main>
    </div>
  );
};

export default Schedule;
