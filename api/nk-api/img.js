import { cors } from '../_lib.js';
export default async function handler(req, res) {
  const rawUrl = String(req.query?.url || '');
  let url;
  try { url = new URL(rawUrl); } catch { return res.status(400).end(); }
  if (!['http:', 'https:'].includes(url.protocol)) return res.status(400).end();
  cors(res);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'nekopoi-api-client-js/1.0 (GET-only; respectful rate)',
        Referer: 'https://nekopoi.care/',
        Accept: 'image/*,*/*',
      },
    });
    if (!response.ok) return res.status(response.status).end();
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch { res.status(500).end(); }
}
