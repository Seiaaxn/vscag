import express from 'express';
import {
  withCache, apiRecent, apiOngoing, apiAll, apiDetail,
  apiGenres, apiSearch, apiGenrePosts, apiComingSoon, apiTest, cors
} from './api/_lib.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => { cors(res); next(); });
const ok = (res, data) => res.json({ status: 200, data });
const fail = (res, e, c = 500) => res.status(c).json({ error: e.message, status: e.status || c });
const positiveInt = (value, fallback, max = 100) => {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? Math.min(max, Math.max(1, number)) : fallback;
};

app.get('/nk-api/home', async (req, res) => {
  try { ok(res, await withCache('home', apiRecent, 3*60*1000)); } catch (e) { fail(res, e); }
});

app.get('/nk-api/ongoing', async (req, res) => {
  const page = positiveInt(req.query.page, 1, 10000);
  const perPage = positiveInt(req.query.limit, 20, 100);
  try { ok(res, await withCache(`ongoing:${page}:${perPage}`, () => apiOngoing(page, perPage), 3 * 60 * 1000)); }
  catch (e) { fail(res, e); }
});

app.get('/nk-api/all', async (req, res) => {
  const page = positiveInt(req.query.page, 1, 10000);
  const perPage = positiveInt(req.query.limit, 20, 100);
  try {
    ok(res, await withCache(`all:${page}:${perPage}`, () => apiAll(page, perPage), 10*60*1000));
  } catch (e) { fail(res, e); }
});

app.get('/nk-api/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return fail(res, new Error('?q= diperlukan'), 400);
  try { ok(res, { query: q, results: await withCache(`search:${q}`, () => apiSearch(q), 5*60*1000) }); }
  catch (e) { fail(res, e); }
});

app.get('/nk-api/detail/:id', async (req, res) => {
  try { ok(res, await withCache(`detail:${req.params.id}`, () => apiDetail(req.params.id))); }
  catch (e) { fail(res, e); }
});

app.get('/nk-api/genres', async (req, res) => {
  try { ok(res, { data: await withCache('genres', apiGenres, 30*60*1000) }); }
  catch (e) { fail(res, e); }
});

app.get('/nk-api/genre', async (req, res) => {
  const id = String(req.query.id || '').trim();
  if (!id) return fail(res, new Error('?id= diperlukan'), 400);
  const p = positiveInt(req.query.page, 1, 10000);
  const perPage = positiveInt(req.query.limit, 20, 100);
  try { ok(res, await withCache(`genre:${id}:${p}:${perPage}`, () => apiGenrePosts(id, p, perPage), 10*60*1000)); }
  catch (e) { fail(res, e); }
});

app.get('/nk-api/comingsoon', async (_req, res) => {
  try { ok(res, await withCache('comingsoon', apiComingSoon, 30 * 60 * 1000)); }
  catch (error) { fail(res, error); }
});

app.get('/nk-api/test', async (req, res) => {
  try { ok(res, await apiTest(req.query.id || null)); }
  catch (error) { fail(res, error); }
});

app.get('/nk-api/img', async (req, res) => {
  const rawUrl = String(req.query.url || '');
  let url;
  try { url = new URL(rawUrl); } catch { return res.status(400).end(); }
  if (!['http:', 'https:'].includes(url.protocol)) return res.status(400).end();
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'nekopoi-api-client-js/1.0 (GET-only; respectful rate)',
        Referer: 'https://nekopoi.care/',
        Accept: 'image/*,*/*',
      },
    });
    if (!r.ok) return res.status(r.status).end();
    res.set('Content-Type', r.headers.get('content-type') || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(await r.arrayBuffer()));
  } catch { res.status(500).end(); }
});

app.get('/nk-api/ping', (_, res) => res.json({ ok: true }));
app.listen(PORT, () => console.log(`[dev] http://localhost:${PORT}`));
