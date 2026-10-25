import { withCache, apiSearch, ok, fail } from '../_lib.js';
export default async function handler(req, res) {
  const q = req.query.q;
  if (!q) return fail(res, new Error('?q= diperlukan'), 400);
  try { ok(res, { query: q, results: await withCache(`search:${q}`, () => apiSearch(q)) }); }
  catch (e) { fail(res, e); }
}
