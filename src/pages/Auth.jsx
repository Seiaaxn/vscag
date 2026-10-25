import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const Field = ({ label, ...props }) => (
  <label className="block">
    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">{label}</span>
    <input {...props}
      className="glass-input w-full rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none placeholder:text-white/25" />
  </label>
);

// Satu komponen untuk /login dan /register
const Auth = ({ mode = 'login' }) => {
  const isRegister = mode === 'register';
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rawNext = params.get('next') || '/profile';
  // hanya izinkan path internal (cegah open redirect)
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/profile';

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = key => event => setForm(current => ({ ...current, [key]: event.target.value }));

  if (user) return <Navigate to={next} replace />;

  const submit = async event => {
    event.preventDefault();
    setError('');
    if (isRegister && form.password !== form.confirm) return setError('Konfirmasi password tidak sama.');
    setBusy(true);
    try {
      if (isRegister) await signUp({ name: form.name, email: form.email, password: form.password });
      else await signIn({ email: form.email, password: form.password });
      navigate(next, { replace: true });
    } catch (e) {
      setError(e.message || 'Terjadi kesalahan.');
      setBusy(false);
    }
  };

  const other = `${isRegister ? '/login' : '/register'}${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass-strong w-full max-w-sm rounded-3xl p-6">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Link to="/home"><Logo className="h-14 w-14" /></Link>
          <h1 className="text-lg font-black text-white">{isRegister ? 'Buat Akun' : 'Masuk'}</h1>
          <p className="text-[11px] font-bold leading-relaxed text-white/45">
            {isRegister
              ? 'Daftar untuk menyimpan riwayat tontonan dan bookmark.'
              : 'Masuk untuk membuka riwayat, bookmark, dan profil kamu.'}
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          {isRegister && <Field label="Nama" value={form.name} onChange={set('name')} placeholder="Nama tampilan" autoComplete="nickname" required />}
          <Field label="Email" type="email" value={form.email} onChange={set('email')} placeholder="kamu@email.com" autoComplete="email" required />
          <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Minimal 6 karakter"
            autoComplete={isRegister ? 'new-password' : 'current-password'} required />
          {isRegister && <Field label="Ulangi Password" type="password" value={form.confirm} onChange={set('confirm')} placeholder="Ketik ulang password" autoComplete="new-password" required />}

          {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-300">{error}</p>}

          <button type="submit" disabled={busy}
            className="btn-gold rounded-2xl py-3 text-xs font-black uppercase tracking-wider text-black disabled:opacity-50">
            {busy ? 'Memproses...' : isRegister ? 'Daftar' : 'Masuk'}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] font-bold text-white/45">
          {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
          <Link to={other} className="text-[#F6CF80] hover:underline">{isRegister ? 'Masuk' : 'Daftar'}</Link>
        </p>
        <Link to="/home" className="mt-3 block text-center text-[10px] font-bold text-white/30 hover:text-white/60">← Kembali ke beranda</Link>
      </div>
    </div>
  );
};

export default Auth;
