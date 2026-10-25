import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Hanya navigasi bawah (navbar atas dihapus)
const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { path: '/home',     label: 'Home',    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/> },
    { path: '/explore',  label: 'Explore', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/> },
    { path: '/genre',    label: 'Genre',   icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/> },
    { path: '/ongoing',  label: 'Ongoing', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/> },
    { path: '/schedule', label: 'Jadwal',  icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/> },
    // Belum login -> /profile otomatis diarahkan ke /login oleh RequireAuth
    { path: '/profile',  label: 'Profil',  icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/> }
  ];

  const activeIndex = navLinks.findIndex(l => location.pathname === l.path || location.pathname.startsWith(l.path + '/'));
  const notchPosition = activeIndex >= 0 ? `${activeIndex * (100 / navLinks.length) + (100 / navLinks.length / 2)}%` : '10%';

  return (
    <>
      <style>{`
        .notch-nav{position:relative;height:70px;background:rgba(18,18,22,0.96);border:1px solid rgba(255,255,255,0.14);border-radius:32px;display:flex;align-items:flex-end;justify-content:space-around;box-shadow:0 12px 40px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.2);padding-bottom:8px}
        .notch-nav::before{content:'';position:absolute;top:-1px;left:${notchPosition};transform:translateX(-50%);width:64px;height:32px;background:rgba(18,18,22,0.96);border-radius:0 0 50% 50% / 0 0 100% 100%;border:1px solid rgba(255,255,255,0.14);border-top:none;transition:left 0.5s cubic-bezier(0.34,1.56,0.64,1);z-index:0}
        .notch-item{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;cursor:pointer;flex:1;height:100%;padding-bottom:6px;z-index:1}
        .notch-icon-wrapper{width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:16px;transition:all 0.5s cubic-bezier(0.34,1.56,0.64,1);margin-bottom:2px;position:relative}
        .notch-icon-wrapper.active{background:#F6CF80;transform:translateY(-16px) scale(1.1);box-shadow:0 8px 24px rgba(246,207,128,0.35),0 4px 12px rgba(246,207,128,0.2);border-radius:18px}
        .notch-label{font-size:9px;font-weight:800;transition:all 0.3s ease;opacity:0;transform:translateY(6px);position:absolute;bottom:8px}
        .notch-label.active{opacity:1;transform:translateY(0);color:#F6CF80}
      `}</style>

      <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md z-[90]">
        <div className="notch-nav">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
            return (
              <div key={link.path} className="notch-item" onPointerDown={() => navigate(link.path)}>
                <div className={`notch-icon-wrapper ${isActive ? 'active' : ''}`}>
                  <svg className="w-5 h-5" fill="none"
                    stroke={isActive ? '#0a0a0c' : 'rgba(255,255,255,0.5)'}
                    strokeWidth="2.5" viewBox="0 0 24 24">{link.icon}</svg>
                </div>
                <span className={`notch-label ${isActive ? 'active' : ''}`}>{link.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Navbar;
