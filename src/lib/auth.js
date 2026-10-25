// Lapisan data akun, bookmark, dan riwayat.
//
// Saat ini semuanya disimpan di localStorage browser (tanpa database), jadi akun
// hanya berlaku di browser/perangkat yang sama. Semua fungsi sengaja dibuat
// async dan terpusat di file ini: untuk pindah ke backend sungguhan
// (Supabase / Firebase / API sendiri) cukup ganti isi file ini,
// halaman dan komponen lain tidak perlu diubah.

const USERS_KEY = 'nf_users';
const SESSION_KEY = 'nf_session';
const DATA_PREFIX = 'nf_data_';
const HISTORY_LIMIT = 100;

export const EMPTY_DATA = { bookmarks: [], history: [] };

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
};

const toHex = buffer => [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
const fromHex = hex => new Uint8Array((hex.match(/.{2}/g) || []).map(b => parseInt(b, 16)));

async function hashPassword(password, saltHex) {
  if (!globalThis.crypto?.subtle) throw new Error('Browser tidak mendukung enkripsi password (butuh HTTPS atau localhost).');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: fromHex(saltHex), iterations: 120000, hash: 'SHA-256' }, key, 256);
  return toHex(bits);
}

const publicUser = user => {
  if (!user) return null;
  const { passHash, salt, ...rest } = user; // eslint-disable-line no-unused-vars
  return rest;
};

const getUsers = () => read(USERS_KEY, {});

// ---------- sesi ----------
export function currentUser() {
  const id = read(SESSION_KEY, null);
  return id ? publicUser(getUsers()[id]) : null;
}

export async function register({ name, email, password }) {
  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (cleanName.length < 2 || cleanName.length > 30) throw new Error('Nama harus 2-30 karakter.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error('Format email tidak valid.');
  if (String(password || '').length < 6) throw new Error('Password minimal 6 karakter.');

  const users = getUsers();
  if (Object.values(users).some(user => user.email === cleanEmail)) throw new Error('Email sudah terdaftar. Silakan masuk.');

  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const user = {
    id: `u_${Date.now().toString(36)}${toHex(crypto.getRandomValues(new Uint8Array(4)))}`,
    name: cleanName,
    email: cleanEmail,
    bio: '',
    avatar: null,
    createdAt: new Date().toISOString(),
    salt,
    passHash: await hashPassword(password, salt),
  };
  users[user.id] = user;
  if (!write(USERS_KEY, users)) throw new Error('Penyimpanan browser penuh atau dinonaktifkan.');
  write(SESSION_KEY, user.id);
  return publicUser(user);
}

export async function login({ email, password }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const user = Object.values(getUsers()).find(item => item.email === cleanEmail);
  // pesan sama untuk email salah / password salah agar tidak membocorkan email terdaftar
  const invalid = new Error('Email atau password salah.');
  if (!user) throw invalid;
  if (await hashPassword(String(password || ''), user.salt) !== user.passHash) throw invalid;
  write(SESSION_KEY, user.id);
  return publicUser(user);
}

export function logout() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* abaikan */ }
}

export async function updateProfile(userId, patch) {
  const users = getUsers();
  const user = users[userId];
  if (!user) throw new Error('Akun tidak ditemukan.');
  if ('name' in patch) {
    const name = String(patch.name || '').trim();
    if (name.length < 2 || name.length > 30) throw new Error('Nama harus 2-30 karakter.');
    user.name = name;
  }
  if ('bio' in patch) user.bio = String(patch.bio || '').trim().slice(0, 120);
  if ('avatar' in patch) user.avatar = patch.avatar || null;
  users[userId] = user;
  if (!write(USERS_KEY, users)) throw new Error('Gagal menyimpan. Penyimpanan browser penuh, coba foto yang lebih kecil.');
  return publicUser(user);
}

export async function changePassword(userId, oldPassword, newPassword) {
  const users = getUsers();
  const user = users[userId];
  if (!user) throw new Error('Akun tidak ditemukan.');
  if (await hashPassword(String(oldPassword || ''), user.salt) !== user.passHash) throw new Error('Password lama salah.');
  if (String(newPassword || '').length < 6) throw new Error('Password baru minimal 6 karakter.');
  user.salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  user.passHash = await hashPassword(newPassword, user.salt);
  users[userId] = user;
  write(USERS_KEY, users);
}

// ---------- bookmark & riwayat (per akun) ----------
export function loadData(userId) {
  if (!userId) return EMPTY_DATA;
  const data = read(DATA_PREFIX + userId, EMPTY_DATA);
  return {
    bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [],
    history: Array.isArray(data.history) ? data.history : [],
  };
}

const saveData = (userId, data) => { write(DATA_PREFIX + userId, data); return data; };

const slim = item => ({
  id: String(item.id),
  title: item.title || 'Tanpa judul',
  image: item.image || null,
});

export function toggleBookmark(userId, item) {
  const data = loadData(userId);
  const id = String(item.id);
  const exists = data.bookmarks.some(entry => entry.id === id);
  const bookmarks = exists
    ? data.bookmarks.filter(entry => entry.id !== id)
    : [{ ...slim(item), savedAt: Date.now() }, ...data.bookmarks];
  return saveData(userId, { ...data, bookmarks });
}

export function addHistory(userId, item) {
  const data = loadData(userId);
  const id = String(item.id);
  const entry = { ...slim(item), seriesId: item.seriesId ? String(item.seriesId) : null, watchedAt: Date.now() };
  const history = [entry, ...data.history.filter(old => old.id !== id)].slice(0, HISTORY_LIMIT);
  return saveData(userId, { ...data, history });
}

export function removeHistory(userId, id) {
  const data = loadData(userId);
  return saveData(userId, { ...data, history: data.history.filter(entry => entry.id !== String(id)) });
}

export function clearHistory(userId) {
  const data = loadData(userId);
  return saveData(userId, { ...data, history: [] });
}

// ---------- foto profil ----------
// Dipotong persegi tengah dan dikecilkan ke 256px agar muat di localStorage.
export function fileToAvatar(file, size = 256) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) return reject(new Error('File harus berupa gambar.'));
    if (file.size > 10 * 1024 * 1024) return reject(new Error('Ukuran gambar maksimal 10 MB.'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      canvas.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gambar tidak bisa dibaca.')); };
    img.src = url;
  });
}
