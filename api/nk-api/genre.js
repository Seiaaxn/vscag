import { withCache, apiGenrePosts, ok, fail } from '../_lib.js';
export default async function handler(req, res) {
  const { id, page = '1', limit = '20' } = req.query;
  if (!id) return fail(res, new Error('?id= genre diperlukan'), 400);
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  try {
    const data = await withCache(`genre:${id}:${p}:${l}`, () => apiGenrePosts(id, p, l));
    ok(res, data);
  } catch (e) { fail(res, e); }
}
