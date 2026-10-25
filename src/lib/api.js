// Helper fetch tunggal untuk semua halaman.
// Memastikan respons benar-benar JSON; kalau server mengembalikan HTML
// (SPA fallback / halaman 404 Express / proteksi Cloudflare) pesan errornya jelas,
// bukan "Unexpected token '<', "<!DOCTYPE "... is not valid JSON".
export const API_BASE = (import.meta.env.VITE_API_BASE || '/nk-api').replace(/\/$/, '');

export const proxyImg = url => (url ? `${API_BASE}/img?url=${encodeURIComponent(url)}` : null);

export class ApiError extends Error {
  constructor(message, extra = {}) {
    super(message);
    this.name = 'ApiError';
    Object.assign(this, extra);
  }
}

const HTML_RE = /^\s*<(?:!doctype|html|head|body)/i;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function apiGet(path, { signal, retries = 1 } = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
      const text = await response.text();
      const type = response.headers.get('content-type') || '';

      if (HTML_RE.test(text) || type.includes('text/html')) {
        throw new ApiError(
          'Server mengembalikan halaman HTML, bukan data JSON. Route /nk-api belum terhubung ke backend ' +
          '(jalankan "npm run dev" / "npm start", atau cek vercel.json).',
          { code: 'HTML', status: response.status },
        );
      }

      let json;
      try { json = JSON.parse(text); }
      catch { throw new ApiError(`Respons API tidak valid (HTTP ${response.status}).`, { code: 'BAD_JSON', status: response.status }); }

      if (!response.ok || json?.error) {
        const raw = String(json?.error || `HTTP ${response.status}`);
        const message = HTML_RE.test(raw) || /<!doctype|<html/i.test(raw)
          ? 'Situs sumber menolak permintaan (mungkin proteksi Cloudflare atau sedang down). Coba lagi nanti.'
          : raw;
        throw new ApiError(message, { code: 'HTTP', status: response.status });
      }
      return json;
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      lastError = error instanceof ApiError
        ? error
        : new ApiError('Tidak bisa terhubung ke server API. Pastikan backend sedang berjalan.', { code: 'NETWORK' });
      if (lastError.code === 'HTML' || lastError.code === 'HTTP') break; // retry tidak membantu
      if (attempt < retries) await sleep(600);
    }
  }
  throw lastError;
}
