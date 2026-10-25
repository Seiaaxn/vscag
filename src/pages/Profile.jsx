import React, { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { fileToAvatar } from '../lib/auth';
import { proxyImg } from '../lib/api';

const timeAgo = ts => {
  const sec = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (sec < 60) return 'Baru saja';
  const min = Math.floor(sec / 60); if (min < 60) return `${min} menit lalu`;
  const hour = Math.floor(min / 60); if (hour < 24) return `${hour} jam lalu`;
  const day = Math.floor(hour / 24); if (day < 30) return `${day} hari lalu`;
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const Thumb = ({ image }) => (
  <div className="h-14 w-24 shrink-0 overflow-hidden rounded-xl bg-black/40">
    {image
      ? <img src={proxyImg(image)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
      : <div className="flex h-full w-full items-center justify-center"><Logo className="h-6 w-6" dim /></div>}
  </div>
);

const Row = ({ entry, sub, onOpen, onRemove, removeLabel }) => (
  <li className="glass glass-hover flex items-center gap-3 rounded-2xl p-2.5">
    <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
      <Thumb image={entry.image} />
      <div className="min-w-0">
        <p className="line-clamp-2 text-[11px] font-bold leading-tight text-white/85">{entry.title}</p>
        <p className="mt-1 text-[9px] font-bold text-white/35">{sub}</p>
      </div>
    </button>
    <button type="button" onClick={onRemove} aria-label={removeLabel} title={removeLabel}
      className="shrink-0 rounded-full p-2 text-white/30 transition hover:bg-white/10 hover:text-red-300">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
    </button>
  </li>
);

const Profile = () => {
  const { user, bookmarks, history, signOut, updateProfile, changePassword, toggleBookmark, removeHistory, clearHistory } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'bookmark' ? 'bookmark' : 'history';
  const fileRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [pw, setPw] = useState({ open: false, old: '', next: '' });
  const [message, setMessage] = useState(null); // { type: 'ok' | 'err', text }

  const flash = (type, text) => { setMessage({ type, text }); setTimeout(() => setMessage(null), 3500); };
  const run = async (fn, okText) => {
    try { await fn(); if (okText) flash('ok', okText); return true; }
    catch (e) { flash('err', e.message || 'Terjadi kesalahan.'); return false; }
  };

  const onPickPhoto = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    await run(async () => updateProfile({ avatar: await fileToAvatar(file) }), 'Foto profil diperbarui.');
  };

  const saveProfile = async event => {
    event.preventDefault();
    if (await run(() => updateProfile({ name, bio }), 'Profil disimpan.')) setEditing(false);
  };

  const savePassword = async event => {
    event.preventDefault();
    if (await run(() => changePassword(pw.old, pw.next), 'Password diganti.')) setPw({ open: false, old: '', next: '' });
  };

  // Reload penuh ke /home: kalau memakai navigate(), RequireAuth sempat melempar ke /login
  // begitu user jadi null. Reload juga membersihkan state sisa di memori.
  const logout = () => { signOut(); window.location.replace('/home'); };
  const stats = [['Riwayat', history.length], ['Bookmark', bookmarks.length]];

  return (
    <div className="min-h-screen pb-28">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 pt-6">
        {/* Kartu profil */}
        <section className="glass-strong rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar user={user} className="h-20 w-20 text-3xl" />
              <button type="button" onClick={() => fileRef.current?.click()} aria-label="Ganti foto profil" title="Ganti foto profil"
                className="btn-gold absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full text-black shadow-lg">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.66-.9l.82-1.2A2 2 0 0110.07 4h3.86a2 2 0 011.66.9l.82 1.2a2 2 0 001.66.9H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-black text-white">{user.name}</h1>
              <p className="truncate text-[11px] font-bold text-white/40">{user.email}</p>
              {user.bio && <p className="mt-1 line-clamp-2 text-[11px] font-bold text-white/60">{user.bio}</p>}
              <p className="mt-1 text-[9px] font-bold text-white/25">Bergabung {new Date(user.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {stats.map(([label, value]) => (
              <div key={label} className="glass rounded-2xl py-3 text-center">
                <div className="text-lg font-black text-[#F6CF80]">{value}</div>
                <div className="text-[9px] font-black uppercase tracking-widest text-white/35">{label}</div>
              </div>
            ))}
          </div>

          {message && (
            <p role="status" className={`mt-4 rounded-xl border px-3 py-2 text-[11px] font-bold ${message.type === 'ok' ? 'border-green-500/30 bg-green-500/10 text-green-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
              {message.text}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => { setEditing(value => !value); setName(user.name); setBio(user.bio || ''); }}
              className="glass glass-hover rounded-full px-4 py-2 text-[10px] font-black text-white/80">Edit Profil</button>
            {user.avatar && (
              <button type="button" onClick={() => run(() => updateProfile({ avatar: null }), 'Foto profil dihapus.')}
                className="glass glass-hover rounded-full px-4 py-2 text-[10px] font-black text-white/80">Hapus Foto</button>
            )}
            <button type="button" onClick={() => setPw(value => ({ ...value, open: !value.open }))}
              className="glass glass-hover rounded-full px-4 py-2 text-[10px] font-black text-white/80">Ganti Password</button>
            <button type="button" onClick={logout}
              className="rounded-full border border-red-500/30 px-4 py-2 text-[10px] font-black text-red-300 transition hover:bg-red-500/10">Keluar</button>
          </div>

          {editing && (
            <form onSubmit={saveProfile} className="mt-4 flex flex-col gap-3">
              <input value={name} onChange={e => setName(e.target.value)} maxLength={30} placeholder="Nama"
                className="glass-input rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none placeholder:text-white/25" required />
              <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={120} rows={2} placeholder="Bio singkat (opsional)"
                className="glass-input resize-none rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none placeholder:text-white/25" />
              <button type="submit" className="btn-gold rounded-2xl py-2.5 text-xs font-black text-black">Simpan</button>
            </form>
          )}

          {pw.open && (
            <form onSubmit={savePassword} className="mt-4 flex flex-col gap-3">
              <input type="password" value={pw.old} onChange={e => setPw({ ...pw, old: e.target.value })} placeholder="Password lama" autoComplete="current-password"
                className="glass-input rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none placeholder:text-white/25" required />
              <input type="password" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} placeholder="Password baru (min. 6 karakter)" autoComplete="new-password"
                className="glass-input rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none placeholder:text-white/25" required />
              <button type="submit" className="btn-gold rounded-2xl py-2.5 text-xs font-black text-black">Ganti Password</button>
            </form>
          )}
        </section>

        {/* Tab */}
        <div className="mt-6 flex items-center gap-2">
          {[['history', 'Riwayat'], ['bookmark', 'Bookmark']].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setParams({ tab: key }, { replace: true })}
              className={`${tab === key ? 'btn-gold text-black' : 'glass text-white/60'} rounded-full px-5 py-2 text-[11px] font-black`}>{label}</button>
          ))}
          {tab === 'history' && history.length > 0 && (
            <button type="button" onClick={() => { if (window.confirm('Hapus seluruh riwayat tontonan?')) clearHistory(); }}
              className="ml-auto text-[10px] font-black text-white/35 transition hover:text-red-300">Hapus semua</button>
          )}
        </div>

        <ul className="mt-4 flex flex-col gap-2">
          {tab === 'history' && history.map(entry => (
            <Row key={entry.id} entry={entry} sub={`Ditonton ${timeAgo(entry.watchedAt)}`}
              onOpen={() => navigate(`/watch?id=${encodeURIComponent(entry.id)}`)}
              onRemove={() => removeHistory(entry.id)} removeLabel="Hapus dari riwayat" />
          ))}
          {tab === 'bookmark' && bookmarks.map(entry => (
            <Row key={entry.id} entry={entry} sub={`Disimpan ${timeAgo(entry.savedAt)}`}
              onOpen={() => navigate(`/anime/${encodeURIComponent(entry.id)}`)}
              onRemove={() => toggleBookmark(entry)} removeLabel="Hapus bookmark" />
          ))}
        </ul>

        {((tab === 'history' && history.length === 0) || (tab === 'bookmark' && bookmarks.length === 0)) && (
          <div className="glass mt-4 flex flex-col items-center gap-3 rounded-3xl px-6 py-10 text-center">
            <Logo className="h-14 w-14" dim />
            <p className="text-[11px] font-bold leading-relaxed text-white/45">
              {tab === 'history' ? 'Belum ada riwayat. Judul yang kamu tonton akan muncul di sini.' : 'Belum ada bookmark. Tekan tombol Bookmark di halaman detail untuk menyimpan judul.'}
            </p>
            <button type="button" onClick={() => navigate('/explore')} className="btn-gold rounded-full px-6 py-2 text-[11px] font-black text-black">Jelajahi Konten</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
