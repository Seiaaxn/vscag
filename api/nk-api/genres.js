import { withCache, apiGenres, ok, fail } from '../_lib.js';
export default async function handler(req, res) {
  try { ok(res, { data: await withCache('genres', apiGenres, 30*60*1000) }); }
  catch (e) { fail(res, e); }
}
