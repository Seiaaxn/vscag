import { withCache, apiDetail, ok, fail } from '../../_lib.js';
export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return fail(res, new Error('id diperlukan'), 400);
  try { ok(res, await withCache(`detail:${id}`, () => apiDetail(id))); }
  catch (e) { fail(res, e); }
}
